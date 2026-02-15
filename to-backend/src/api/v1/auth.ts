import {type NextFunction, type Request, type RequestHandler, type Response, Router} from "express";
import jwt from "jsonwebtoken";
import {DatabaseManager} from "../../db/databaseManager.ts";
import {authUsers, loginHistory} from "../../db/schema.ts";
import {ConfigProvider} from "../../configProvider.ts";
import {
    checkPasswordStrength,
    comparePasswords,
    generatePasswordHash,
    generatePasswordResetToken
} from "../../utils/pswHashing.ts";
import {SmtpManager} from "../../smtpManager.ts";
import {eq, or} from "drizzle-orm";
import {sleep} from "../../utils/commonFunctions.ts";

export type UserToken = {
    id: number;
    username: string;
    role: string;
    createdAt: string;
}

export type RequiredRole = "admin" | "operatore" | "vigile" | "any";

export interface AuthRequest extends Request {
    user?: UserToken;
}

const randomSleep = async ()=> {
    await sleep(Math.random() * 1500 + 500);
}

export const middlewareAuthCheck = (requiredRole: RequiredRole[]): RequestHandler => async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    let token: string | undefined = undefined;
    //authorization header for future automation
    const authHeader = req.headers.authorization;
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    }
    if (req.cookies != null && req.cookies.authToken != null) {
        token = req.cookies.authToken;
    }
    if (token == null) {
        res.status(401).json({message: "Token non presente"});
        return;
    }

    try {
        const decoded = jwt.verify(token, ConfigProvider.instance.configs.jwtSecret) as UserToken;
        const db = DatabaseManager.instance.db;
        try {
            // TODO: meglio fare una cache in memoria per questa casistica per diminuire le query al db
            const authUser = await db.query.authUsers.findFirst({where: {id: decoded.id}, with: {role: true}});
            if (authUser == null || authUser.disabled) {
                throw new Error("Utente disabilitato");
            }
            // i token creati prima della modifica della password sono tutti immediatamente invalidati
            if (authUser.lastPasswordResetDate != null && new Date(decoded.createdAt) < authUser.lastPasswordResetDate) {
                throw new Error("Token scaduto.");
            }
            if (authUser.role == null) {
                throw new Error("Ruolo utente non trovato");
            }

            if (!requiredRole.includes("any") && authUser.role.description !== "admin" && !requiredRole.includes(authUser.role.description as RequiredRole)) {
                res.status(403).json({message: "Permessi insufficienti"});
                return;
            }

            req.user = {
                id: decoded.id,
                username: decoded.username,
                role: decoded.role,
                createdAt: decoded.createdAt,
            };
            next();
        } catch (error) {
            throw new Error("Errore nel recupero dell'utente dal database");
        }

    } catch (error) {
        res.clearCookie("authToken", {
            httpOnly: true,
            secure: ConfigProvider.instance.configs.baseUrl.startsWith("https"),
            sameSite: "strict",
        });
        res.status(401).json({message: "Token non valido o scaduto"});
        return;
    }
}

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
    if (req.body == null || req.body.username == null || req.body.password == null || req.body.username.trim() === "" || req.body.password.trim() === "") {
        res.status(400).json({message: "Utente e password sono richiesti"});
        return;
    }
    const {username, password} = req.body;
    const clientIp = req.ip != null ? req.ip : "unknown";
    await randomSleep(); //attacchi timing per capire se il nome utente esiste

    const db = DatabaseManager.instance.db;
    const foundUser = await db.query.authUsers.findFirst({
        where: {OR: [{username: username}, {email: username}]},
        with: {role: true},
    });

    if (foundUser == null || foundUser.role == null) {
        res.status(401).json({message: "Username o password errati"});
        return;
    }
    if (foundUser.disabled) {
        res.status(403).json({message: "Account disabilitato"});
        return;
    }

    const isValidPassword = await comparePasswords(password, foundUser.passwordHash);
    if (!isValidPassword) {
        res.status(401).json({message: "Username o password errati"});
        return;
    }

    const userData: UserToken = {
        id: foundUser.id,
        username: foundUser.username,
        role: foundUser.role.description,
        createdAt: new Date().toISOString()
    };
    const token = jwt.sign(
        userData,
        ConfigProvider.instance.configs.jwtSecret,
        {expiresIn: "2d"}
    );

    //non-blocking
    db.insert(loginHistory).values([{userId: foundUser.id, clientIp: clientIp}]).execute();

    res.cookie("authToken", token, {
        httpOnly: true, //protezione da xss
        secure: ConfigProvider.instance.configs.baseUrl.startsWith("https"),
        maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days in milliseconds
        sameSite: "strict",
    });
    res.json({
        message: "Login avvenuto con successo",
        user: {
            id: foundUser.id,
            username: foundUser.username,
            firstName: foundUser.firstname,
            lastName: foundUser.lastname,
            email: foundUser.email,
            cf: foundUser.cf,
            role: foundUser.role.description,
        }
    });
});

authRouter.get("/logout", async (req, res) => {
    res.clearCookie("authToken", {
        httpOnly: true,
        secure: ConfigProvider.instance.configs.baseUrl.startsWith("https"),
        sameSite: "strict",
    });

    res.json({message: "Logout avvenuto con successo"});
});

authRouter.get("/user-info", middlewareAuthCheck(["any"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }

    const db = DatabaseManager.instance.db;
    const authUser = await db.query.authUsers.findFirst({
        where: {id: req.user.id},
        with: {role: true},
    });
    if (authUser == null || authUser.role == null) {
        res.status(500).json({message: "Utente non trovato nel database"});
        return;
    }

    res.json({
        message: "Informazioni utente acquisite con successo",
        user: {
            id: authUser.id,
            username: req.user.username,
            firstName: authUser.firstname,
            lastName: authUser.lastname,
            email: authUser.email,
            cf: authUser.cf,
            role: authUser.role.description,
        }
    });
});


authRouter.post("/register", async (req, res) => {
    res.send("Register non è ancora implementato.");
});

const passwordResetTokenExpirationTimeMs = 1 * 60 * 60 * 1000; // 1 hour in ms
const passwordResetTokenResendMailMs = 60 * 1000; // 1 minute in ms
authRouter.post("/password-reset-request", async (req, res) => {
    if (req.body == null || req.body.email == null || req.body.email.trim() === "") {
        res.status(400).json({message: "L'email è richiesta"});
        return;
    }
    await randomSleep(); //attacchi timing per capire se il nome utente esiste

    const {email} = req.body;

    const db = DatabaseManager.instance.db;
    const foundUser = await db.query.authUsers.findFirst({
        where: {email: email},
    });
    if (foundUser == null) {
        //così non si sa se la mail è registrata
        res.json({message: "Se l'account esiste allora la mail di reimpostazione password è stata inviata. Controlla la tua casella di posta elettronica."});
        // res.status(404).json({message: "Utente non trovato"});

        return;
    }
    if (foundUser.disabled) {
        res.status(403).json({message: "Account disabilitato"});
        return;
    }

    let resetToken = generatePasswordResetToken();
    if (foundUser.passwordResetToken != null && foundUser.passwordResetTokenGenerationDate != null) {
        const tokeAge = Date.now() - foundUser.passwordResetTokenGenerationDate.getTime();
        //ripeti l'invio solo dopo un po' di tempo
        if (tokeAge < passwordResetTokenResendMailMs) {
            //così non si sa se la mail è registrata
            res.json({message: "Se l'account esiste allora la mail di reimpostazione password è stata inviata. Controlla la tua casella di posta elettronica."});
            // res.json({message: "La mail per il ripristino della password è stata già inviata. Aspetta qualche minuto prima di richiederne una nuova."});
            return;
        }
        //se il token è ancora valido, invia lo stesso (così l'utente non si confonde con le mail)
        if (tokeAge < (passwordResetTokenExpirationTimeMs / 2)) {
            resetToken = foundUser.passwordResetToken;
        }
    }

    await db.update(authUsers).set({
        passwordResetToken: resetToken,
        passwordResetTokenGenerationDate: new Date(),
    }).where(eq(authUsers.id, foundUser.id));

    // send email
    const resetLink = `${ConfigProvider.instance.configs.baseUrl}/password-reset/${resetToken}`;
    const mailResult = await SmtpManager.instance.sendMail({
        from: ConfigProvider.instance.configs.smtpUser,
        to: foundUser.email,
        subject: "Reimpostazione password - TagliandOnline",
        html: `<p>Per reimpostare la passowrd clicca il seguente link:</p><p><a href="${resetLink}">${resetLink}</a></p><p>Se non hai richiesto la reimpostazione contatta un amministratore.</p>`,
    });
    if (!mailResult.success) {
        res.status(500).json({message: "Impossibile inviare la mail di reimpostazione password: " + mailResult.err});
        return;
    }
    res.json({message: "Se l'account esiste allora la mail di reimpostazione password è stata inviata. Controlla la tua casella di posta elettronica."});
});

authRouter.post("/password-reset-execute-token", async (req, res) => {
    if (req.body == null || req.body.token == null || req.body.password == null || req.body.token.trim() === "" || req.body.password.trim() === "") {
        res.status(400).json({message: "Token e password sono richiesti"});
        return;
    }

    const {token, password} = req.body;

    if (!checkPasswordStrength(password)) {
        res.status(400).json({message: "La password deve contenere almeno 12 caratteri e tra cui una lettera maiuscola, una minuscola, un numero e un carattere speciale."});
        return;
    }

    const db = DatabaseManager.instance.db;
    const foundUser = await db.query.authUsers.findFirst({
        where: {passwordResetToken: token},
    });
    if (foundUser == null || foundUser.passwordResetTokenGenerationDate == null) {
        res.status(400).json({message: "Token di ripristino password scaduto"});
        return;
    }
    const tokenAge = Date.now() - foundUser.passwordResetTokenGenerationDate.getTime();
    if (tokenAge > passwordResetTokenExpirationTimeMs) {
        res.status(400).json({message: "Token di ripristino password scaduto"});
        return;
    }
    if (foundUser.disabled) {
        res.status(403).json({message: "Account disabilitato"});
        return;
    }

    const newPasswordHash = await generatePasswordHash(password);
    await db.update(authUsers)
        .set({
            passwordHash: newPasswordHash,
            lastPasswordResetDate: new Date(),
            passwordResetToken: generatePasswordResetToken(), // rimpiazza il vecchio token per sicurezza
        })
        .where(eq(authUsers.id, foundUser.id));

    res.json({message: "Password reimpostata con successo"});
});

authRouter.post("/password-reset-execute-authenticated", middlewareAuthCheck(["any"]), async (req: AuthRequest, res) => {
    if (req.body == null || req.body.password == null || req.body.password.trim() === "") {
        res.status(400).json({message: "La password è richiesta"});
        return;
    }
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }

    const {password} = req.body;

    if (!checkPasswordStrength(password)) {
        res.status(400).json({message: "La password deve contenere almeno 12 caratteri e tra cui una lettera maiuscola, una minuscola, un numero e un carattere speciale."});
        return;
    }

    const db = DatabaseManager.instance.db;
    const authUser = await db.query.authUsers.findFirst({
        where: {id: req.user.id}
    });

    if (authUser == null) {
        res.status(400).json({message: "Utente non trovato"});
        return;
    }
    if (authUser.disabled) {
        res.status(403).json({message: "Account disabilitato"});
        return;
    }

    const newPasswordHash = await generatePasswordHash(password);
    await db.update(authUsers)
        .set({
            passwordHash: newPasswordHash,
            lastPasswordResetDate: new Date(),
            passwordResetToken: generatePasswordResetToken(), // rimpiazza il vecchio token per sicurezza
        })
        .where(eq(authUsers.id, authUser.id));

    res.json({message: "Password reimpostata con successo"});
});


