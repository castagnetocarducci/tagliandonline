import {DatabaseManager} from "../../db/databaseManager.ts";
import {type AuthRequest, middlewareAuthCheck} from "./auth.ts";
import {Router} from "express";
import {authUsers, roles} from "../../db/schema.ts";
import {and, eq} from "drizzle-orm";
import {generatePasswordResetToken} from "../../utils/pswHashing.ts";
import {ConfigProvider} from "../../configProvider.ts";
import {SmtpManager} from "../../smtpManager.ts";


type UserListEntry = {
    id: number,
    username: string,
    firstName: string,
    lastName: string,
    email: string,
    role: string,
    disabled: boolean
}

type UserLoginHistoryEntry = {
    clientIp: string,
    createdAt: Date
}

type UserDetails = {
    id: number,
    username: string,
    firstName: string,
    lastName: string,
    email: string,
    cf: string,
    role: string,
    disabled: boolean
    lastPasswordResetDate: Date,
    createdAt: Date,
    updatedAt: Date,
    latestLoginHistory: UserLoginHistoryEntry[],
}

export const usersRouter = Router();

usersRouter.get("/list", middlewareAuthCheck(["admin"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }

    const db = DatabaseManager.instance.db;
    const authUsersList = await db.query.authUsers.findMany({with: {role: true}});
    if (authUsersList == null) {
        res.status(500).json({message: "Errore nel reperire la lista di utenti"});
        return;
    }
    const usersList: UserListEntry[] = [];
    for (const authUser of authUsersList) {
        usersList.push({
            id: authUser.id,
            username: authUser.username,
            firstName: authUser.firstname,
            lastName: authUser.lastname,
            email: authUser.email,
            role: authUser.role ? authUser.role.description : "unknown",
            disabled: authUser.disabled
        });
    }

    res.json({
        message: "Utenti acquisiti con successo",
        usersList: usersList
    });
});

usersRouter.get("/detail/:userID", middlewareAuthCheck(["admin"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    if (req.params.userID == null || req.params.userID == "") {
        res.status(400).json({message: "ID utente non valido"});
        return;
    }
    const  userID = parseInt(req.params.userID as string);
    if (isNaN(userID)) {
        res.status(400).json({message: "ID utente non valido"});
        return;
    }

    const db = DatabaseManager.instance.db;
    const authUser = await db.query.authUsers.findFirst(
        {
            where: {id: userID},
            with: {
                role: true,
                logins: {
                    orderBy: {createdAt: "desc"},
                    limit: 10,
                }
            }
        });
    if (authUser == null) {
        res.status(500).json({message: "Utente non trovato"});
        return;
    }
    const userDetails: UserDetails = {
        id: authUser.id,
        username: authUser.username,
        firstName: authUser.firstname,
        lastName: authUser.lastname,
        email: authUser.email,
        cf: authUser.cf || "",
        role: authUser.role ? authUser.role.description : "unknown",
        disabled: authUser.disabled,
        lastPasswordResetDate: authUser.lastPasswordResetDate,
        createdAt: authUser.createdAt,
        updatedAt: authUser.updatedAt,
        latestLoginHistory: authUser.logins.map(login => {
            return {clientIp: login.clientIp, createdAt: login.createdAt}
        }),
    };

    res.json({
        message: "Utente acquisito con successo",
        user: userDetails
    });
});

usersRouter.post("/edit/:userID", middlewareAuthCheck(["admin"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    if (req.params.userID == null || req.params.userID == "") {
        res.status(400).json({message: "ID utente non valido"});
        return;
    }
    const userID = parseInt(req.params.userID as string);
    if (isNaN(userID)) {
        res.status(400).json({message: "ID utente non valido"});
        return;
    }

    if (req.body == null ||
        req.body.username == null || req.body.username.trim() === "" ||
        req.body.firstName == null || req.body.firstName.trim() === "" ||
        req.body.lastName == null || req.body.lastName.trim() === "" ||
        req.body.cf == null || req.body.cf.trim() === "" ||
        req.body.role == null || req.body.role.trim() === "" ||
        req.body.disabled == null || req.body.disabled.trim() === "" ||
        req.body.email == null || req.body.email.trim() === ""
    ) {
        res.status(400).json({message: "Richiesta con campi mancanti"});
        return;
    }

    const {username, firstName, lastName, cf, role, disabled, email} = req.body;

    const db = DatabaseManager.instance.db;
    const updateResult = await db.update(authUsers)
        .set({
            username,
            firstname: firstName,
            lastname: lastName,
            cf,
            roleId: roles.id,
            disabled: disabled === "true",
            email
        })
        .from(roles)
        .where(and(eq(authUsers.id, userID), eq(roles.description, role)));
    if (updateResult == null) {
        res.status(500).json({message: "Aggiornamento non riuscito"});
        return;
    }
    if (updateResult.rowCount !== 1) {
        res.status(500).json({message: "Aggiornamento non riuscito (righe: " + updateResult.rowCount + "): " + updateResult.command});
        return;
    }

    await DatabaseManager.instance.loadAuthUsers();
    res.json({
        message: "Utente aggiornato con successo",
    });
});


usersRouter.post("/new", middlewareAuthCheck(["admin"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }

    if (req.body == null ||
        req.body.username == null || req.body.username.trim() === "" ||
        req.body.firstName == null || req.body.firstName.trim() === "" ||
        req.body.lastName == null || req.body.lastName.trim() === "" ||
        req.body.cf == null || req.body.cf.trim() === "" ||
        req.body.role == null || req.body.role.trim() === "" ||
        req.body.disabled == null || req.body.disabled.trim() === "" ||
        req.body.email == null || req.body.email.trim() === ""
    ) {
        res.status(400).json({message: "Richiesta con campi mancanti"});
        return;
    }

    const {username, firstName, lastName, cf, role, disabled, email} = req.body;

    const db = DatabaseManager.instance.db;
    const roleDB = await db.query.roles.findFirst({where: {description: role}});
    if (roleDB == null) {
        res.status(400).json({message: "Ruolo non trovato " + role + ": " + roleDB});
        return;
    }
    try {
        const insertResult = await db.insert(authUsers).values({
            cf: cf,
            firstname: firstName,
            lastname: lastName,
            email: email,
            username: username,
            passwordHash: "",
            roleId: roleDB.id,
        });

        if (insertResult == null) {
            res.status(500).json({message: "Inserimento non riuscito"});
            return;
        }
        if (insertResult.rowCount !== 1) {
            res.status(500).json({message: "Inserimento non riuscito (righe: " + insertResult.rowCount + "): " + insertResult.command});
            return;
        }
    } catch (e) {
        res.status(500).json({message: "Errore durante l'inserimento: " + e});
        return;
    }


    const foundUser = await db.query.authUsers.findFirst({
        where: {email: email},
    });
    if (foundUser == null) {
        //così non si sa se la mail è registrata
        res.status(404).json({message: "Utente inserito ma non trovato"});
        return;
    }
    if (foundUser.disabled) {
        res.status(403).json({message: "Account disabilitato"});
        return;
    }

    let resetToken = generatePasswordResetToken();

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

    await DatabaseManager.instance.loadAuthUsers();
    res.json({message: "Utente inserito con successo. La mail di recupero della password è stata inviata all'indirizzo."});
});


// NON CONSENTITO: invece si disabilitano gli utenti (sono inclusi in ispezioni e altro)
// usersRouter.get("/delete/:userID", middlewareAuthCheck(["admin"]), async (req: AuthRequest, res) => {
//     if (req.user == null) {
//         res.status(401).json({message: "Non autorizzato"});
//         return;
//     }
//     if (req.params.userID == null || req.params.userID == "") {
//         res.status(400).json({message: "ID utente non valido"});
//         return;
//     }
//     let userID = 0;
//     try {
//         userID = parseInt(req.params.userID as string);
//     } catch (e) {
//         res.status(400).json({message: "ID utente non valido"});
//         return;
//     }
//
//     const db = DatabaseManager.instance.db;
//     const deleteResult = await db.delete(authUsers).where(eq(authUsers.id, userID));
//     if (deleteResult == null) {
//         res.status(500).json({message: "Eliminazione non riuscita"});
//         return;
//     }
//     if (deleteResult.rowCount !== 1) {
//         res.status(500).json({message: "Eliminazione non riuscita (righe: " + deleteResult.rowCount + "): " + deleteResult.command});
//         return;
//     }
//
//     await DatabaseManager.instance.loadAuthUsers();
//     res.json({
//         message: "Utente eliminato con successo",
//     });
// });
//
