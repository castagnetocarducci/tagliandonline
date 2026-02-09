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

export type UserToken = {
    id: number;
    username: string;
    role: string;
}

export type RequiredRole = "admin" | "operatore" | "vigile" | "any";

export interface AuthRequest extends Request {
    user?: UserToken;
}

export const middlewareAuthCheck = (requiredRole: RequiredRole): RequestHandler => async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    let token: string | undefined = undefined;
    //authorization header for future automation
    const authHeader = req.headers.authorization;
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    }
    if (req.cookies.authToken != null) {
        token = req.cookies.authToken;
    }
    if (token == null) {
        res.status(401).json({message: "Token missing"});
        return;
    }

    try {
        const decoded = jwt.verify(token, ConfigProvider.instance.configs.jwtSecret) as UserToken;
        if (requiredRole !== "any" && decoded.role !== "admin" && decoded.role !== requiredRole) {
            res.status(403).json({message: "Insufficient permissions"});
            return;
        }
        req.user = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role,
        };
        next();
    } catch (error) {
        res.status(401).json({message: "Invalid or expired token"});
        return;
    }
}

export const expressRouter = Router();

expressRouter.post("/login", async (req, res) => {
    const {username, password} = req.body;
    const clientIp = req.ip != null ? req.ip : "unknown";
    if (!username || !password) {
        res.status(400).json({message: "Username and password are required"});
        return;
    }

    const db = DatabaseManager.instance.db;
    const foundUser = await db.query.authUsers.findFirst({
        where: {OR: [{username: username}, {email: username}]},
        with: {role: true},
    });

    if (foundUser == null || foundUser.role == null) {
        res.status(401).json({message: "Invalid credentials"});
        return;
    }
    if (foundUser.disabled) {
        res.status(403).json({message: "Account disabled"});
        return;
    }

    const isValidPassword = await comparePasswords(password, foundUser.passwordHash);
    if (!isValidPassword) {
        res.status(401).json({message: "Invalid credentials"});
        return;
    }

    const userData: UserToken = {
        id: foundUser.id,
        username: foundUser.username,
        role: foundUser.role.description,
    };
    const token = jwt.sign(
        userData,
        ConfigProvider.instance.configs.jwtSecret,
        {expiresIn: "2d"}
    );

    //non-blocking
    db.insert(loginHistory).values([{userId: foundUser.id, clientIp: clientIp}]).execute();

    res.cookie("authToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days in milliseconds
        sameSite: "strict",
    });
    res.json({
        message: "Login successful",
        user: {
            id: foundUser.id,
            username: foundUser.username,
            role: foundUser.role.description,
            firstName: foundUser.firstname,
            lastName: foundUser.lastname,
            email: foundUser.email,
        }
    });
});

expressRouter.get("/userInfo", middlewareAuthCheck("any"), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Unauthorized"});
        return;
    }

    const db = DatabaseManager.instance.db;
    const authUser = await db.query.authUsers.findFirst({
        where: {id: req.user.id},
        with: {role: true},
    });
    if (authUser == null || authUser.role == null) {
        res.status(500).json({message: "User not found in database. Please contact the administrator."});
        return;
    }

    res.json({
        message: "User info retrieved successfully",
        user: {
            id: authUser.id,
            username: req.user.username,
            firstName: authUser.firstname,
            lastName: authUser.lastname,
            email: authUser.email,
            cf: authUser.cf,
            updatedAt: authUser.updatedAt,
            role: authUser.role.description,
        }
    });
});


expressRouter.post("/register", async (req, res) => {
    res.send("Register not implemented yet.");
});

const passwordResetTokenExpirationTimeMs = 1 * 60 * 60 * 1000; // 1 hour in ms
const passwordResetTokenResendMailMs = 60 * 1000; // 1 minute in ms
expressRouter.post("/password-reset-request", async (req, res) => {
    const {username} = req.body;

    if (username != null) {
        res.status(400).json({message: "Username or email is required"});
        return;
    }

    const db = DatabaseManager.instance.db;
    const foundUser = await db.query.authUsers.findFirst({
        where: {OR: [{username: username}, {email: username}]},
    });
    if (foundUser == null) {
        res.status(404).json({message: "User not found"});
        return;
    }
    if (foundUser.disabled) {
        res.status(403).json({message: "Account disabled"});
        return;
    }

    let resetToken = generatePasswordResetToken();
    if (foundUser.passwordResetToken != null && foundUser.passwordResetTokenGenerationDate != null) {
        const tokeAge = Date.now() - foundUser.passwordResetTokenGenerationDate.getTime();
        //ripeti l'invio solo dopo un po' di tempo
        if (tokeAge < passwordResetTokenResendMailMs) {
            res.json({message: "Password reset email already sent. Please wait a few minutes before requesting a new one."});
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
    const resetLink = `${ConfigProvider.instance.configs.baseUrl}/password-reset?token=${resetToken}`;
    const mailResult = await SmtpManager.instance.sendMail({
        from: ConfigProvider.instance.configs.smtpUser,
        to: foundUser.email,
        subject: "Reimpostazione password - TagliandOnline",
        html: `<p>Per reimpostare la passowrd clicca il seguente link:</p><p><a href="${resetLink}">${resetLink}</a></p><p>Se non hai richiesto la reimpostazione contatta un amministratore.</p>`,
    });
    if (!mailResult.success) {
        res.status(500).json({message: "Failed to send password reset email", error: mailResult.err});
        return;
    }
    res.json({message: "Password reset email sent successfully"});
});

expressRouter.post("/password-reset-execute", async (req, res) => {
    const {token, password} = req.body;

    if (!token || !password) {
        res.status(400).json({message: "Token and new password are required"});
        return;
    }

    if (!checkPasswordStrength(password)) {
        res.status(400).json({message: "Password must be at least 12 characters long"});
        return;
    }

    const db = DatabaseManager.instance.db;
    const foundUser = await db.query.authUsers.findFirst({
        where: {passwordResetToken: token},
    });
    if (foundUser == null || foundUser.passwordResetTokenGenerationDate == null) {
        res.status(400).json({message: "Invalid or expired reset token"});
        return;
    }
    const tokenAge = Date.now() - foundUser.passwordResetTokenGenerationDate.getTime();
    if (tokenAge > passwordResetTokenExpirationTimeMs) {
        res.status(400).json({message: "Invalid or expired reset token"});
        return;
    }
    if (foundUser.disabled) {
        res.status(403).json({message: "Account disabled"});
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

    res.json({message: "Password reset successfully"});
});



