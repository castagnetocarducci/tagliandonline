import {Router} from "express";
import {type AuthRequest, middlewareAuthCheck} from "./auth.ts";
import {DatabaseManager} from "../../db/databaseManager.ts";
import {usersRouter} from "./users.ts";

export const docTemplatesRouter = Router();

type DocTemplateListEntry = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    disabled: boolean,
    description: string,
    path: string
}

usersRouter.get("/list", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    let includeDisabled: boolean = false;
    if (req.query.disabled != null && req.query.disabled === "true") {
        includeDisabled = true;
    }

    const db = DatabaseManager.instance.db;
    const docTemplatesList = await db.query.docTemplates.findMany({
        where: {
            disabled: includeDisabled ? undefined : false
        }
    });
    if (docTemplatesList == null) {
        res.status(500).json({message: "Errore nel reperire i modelli di documenti"});
        return;
    }
    const docTemplatesResList: DocTemplateListEntry[] = [];
    for (const docTemplate of docTemplatesList) {
        docTemplatesResList.push({
            id: docTemplate.id,
            createdAt: docTemplate.createdAt,
            updatedAt: docTemplate.updatedAt,
            disabled: docTemplate.disabled,
            description: docTemplate.description,
            path: docTemplate.path,
        });
    }
    res.json({
        message: "Modelli di documento acquisiti con successo",
        docTemplatesList: docTemplatesResList
    });
});



