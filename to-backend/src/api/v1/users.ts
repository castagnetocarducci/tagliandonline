import {DatabaseManager} from "../../db/databaseManager.ts";
import {type AuthRequest, middlewareAuthCheck} from "./auth.ts";
import {Router} from "express";
import {authUsers, roles} from "../../db/schema.ts";
import {and, eq} from "drizzle-orm";


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
    let userID = 0;
    try {
        userID = parseInt(req.params.userID as string);
    } catch (e) {
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
    let userID = 0;
    try {
        userID = parseInt(req.params.userID as string);
    } catch (e) {
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

    res.json({
        message: "Utente aggiornato con successo",
    });
});

