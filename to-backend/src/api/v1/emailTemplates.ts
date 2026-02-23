import {Router} from "express";
import {type AuthRequest, middlewareAuthCheck} from "./auth.ts";
import {DatabaseManager} from "../../db/databaseManager.ts";
import {emailTemplates} from "../../db/schema.ts";
import {eq} from "drizzle-orm";


export const emailTemplatesRouter = Router();


type EmailTemplateListEntry = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    disabled: boolean,
    description: string
}

type EmailTemplateDetail = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    disabled: boolean,
    description: string,
    subject: string,
    body: string
}


emailTemplatesRouter.get("/list", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        return res.status(401).json({message: "Non autorizzato"});
    }
    // let includeDisabled: boolean = false;
    // if (req.query.disabled != null && req.query.disabled === "true") {
    //     includeDisabled = true;
    // }

    const db = DatabaseManager.instance.db;
    const emailTemplatesList = await db.query.emailTemplates.findMany({
        // where: {
        //     disabled: includeDisabled ? undefined : false
        // }
        orderBy: { updatedAt: "desc"},
    });
    if (emailTemplatesList == null) {
        return res.status(500).json({message: "Errore nel reperire i modelli di email"});
    }
    const emailTemplatesResList: EmailTemplateListEntry[] = [];
    for (const emailTemplate of emailTemplatesList) {
        emailTemplatesResList.push({
            id: emailTemplate.id,
            createdAt: emailTemplate.createdAt,
            updatedAt: emailTemplate.updatedAt,
            disabled: emailTemplate.disabled,
            description: emailTemplate.description
        });
    }
    res.json({
        message: "Modelli di email acquisiti con successo",
        emailTemplatesList: emailTemplatesResList
    });
});

emailTemplatesRouter.get("/detail/:emailTemplateID", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    if (req.params.emailTemplateID == null || ("" + req.params.emailTemplateID).trim() == "") {
        res.status(400).json({message: "ID modello email non valido"});
        return;
    }
    const emailTemplateID = parseInt(req.params.emailTemplateID as string);
    if (isNaN(emailTemplateID)) {
        res.status(400).json({message: "ID modello email non valido"});
        return;
    }

    const db = DatabaseManager.instance.db;
    const emailTemplate = await db.query.emailTemplates.findFirst(
        {
            where: {id: emailTemplateID}
        });
    if (emailTemplate == null) {
        res.status(500).json({message: "Modello di email non trovato"});
        return;
    }
    const emailDetails: EmailTemplateDetail = {
        id: emailTemplate.id,
        createdAt: emailTemplate.createdAt,
        updatedAt: emailTemplate.updatedAt,
        disabled: emailTemplate.disabled,
        description: emailTemplate.description,
        subject: emailTemplate.subject,
        body: emailTemplate.body
    };

    res.json({
        message: "Modello di email acquisito con successo",
        emailTemplate: emailDetails
    });
});

emailTemplatesRouter.post("/edit/:emailTemplateID", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
        if (req.user == null) {
            res.status(401).json({message: "Non autorizzato"});
            return;
        }

        if (req.params.emailTemplateID == null || ("" + req.params.emailTemplateID).trim() == "") {
            res.status(400).json({message: "Modello di email non trovato"});
            return;
        }
        const emailTemplateID = parseInt(req.params.emailTemplateID as string);

        if (req.body.description == null || req.body.description.trim() === "" ||
            req.body.disabled == null || req.body.disabled.trim() === "" ||
            req.body.subject == null || req.body.subject.trim() === "" ||
            req.body.body == null || req.body.body.trim() === "") {
            res.status(400).json({message: "Richiesta con campi mancanti"});
            return;
        }
        const {description, disabled, subject, body} = req.body;
        const db = DatabaseManager.instance.db;
        try {
            const updateResult = await db.update(emailTemplates)
                .set({
                    description: description,
                    disabled: disabled === "true",
                    subject: subject,
                    body: body
                })
                .where(eq(emailTemplates.id, emailTemplateID));
            if (updateResult == null) {
                res.status(500).json({message: "Aggiornamento non riuscito"});
                return;
            }
            if (updateResult.rowCount !== 1) {
                res.status(500).json({message: "Aggiornamento non riuscito (righe: " + updateResult.rowCount + "): " + updateResult.command});
                return;
            }
        } catch (e) {
            res.status(500).json({message: "Errore durante l'aggiornamento: " + e});
            return;
        }
        res.status(200).json({message: "Modello aggiornato con successo"});
    }
);

emailTemplatesRouter.post("/new", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
        if (req.user == null) {
            res.status(401).json({message: "Non autorizzato"});
            return;
        }

        if (req.body.description == null || req.body.description.trim() === "" ||
            req.body.subject == null || req.body.subject.trim() === "" ||
            req.body.body == null || req.body.body.trim() === "") {
            res.status(400).json({message: "Richiesta con campi mancanti"});
            return;
        }
        const {description, subject, body} = req.body;

        const db = DatabaseManager.instance.db;
        try {
            const inserted = await db.insert(emailTemplates).values({
                description: description,
                subject: subject,
                body: body
            }).returning();
            if (inserted == null || inserted.length !== 1 || inserted[0] == null) {
                res.status(500).json({message: "Inserimento non riuscito"});
                return;
            }
            const insertedEmailTemplate = inserted[0];
            res.status(200).json({message: "Modello inserito con successo", id: insertedEmailTemplate.id});
        } catch (e) {
            res.status(500).json({message: "Errore durante l'inserimento: " + e});
            return;
        }
    }
);









