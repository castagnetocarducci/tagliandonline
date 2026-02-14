import {DatabaseManager} from "../../db/databaseManager.ts";
import {type AuthRequest, middlewareAuthCheck} from "./auth.ts";
import {Router} from "express";


type UserListEntry = {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    cf: string | null;
    role: string;
    disabled: boolean,
    lastPasswordResetDate: Date,
    createdAt: Date,
    updatedAt: Date,
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
            cf: authUser.cf,
            role: authUser.role ? authUser.role.description : "unknown",
            disabled: authUser.disabled,
            lastPasswordResetDate: authUser.lastPasswordResetDate,
            createdAt: authUser.createdAt,
            updatedAt: authUser.updatedAt,
        });
    }


    res.json({
        message: "Utenti acquisiti con successo",
        usersList: usersList
    });
});