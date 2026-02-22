import {Router} from "express";
import {type AuthRequest, middlewareAuthCheck} from "./auth.ts";
import {DatabaseManager} from "../../db/databaseManager.ts";
import {adjustPathForDownload} from "./downloadFile.ts";
import {deleteFile, deleteFileByPath, uploadModelsMulter} from "../../files/filesStorages.ts";
import {authUsers, docTemplates} from "../../db/schema.ts";
import {eq} from "drizzle-orm";

export const docTemplatesRouter = Router();

type DocTemplateListEntry = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    disabled: boolean,
    description: string,
    path: string
}


docTemplatesRouter.get("/list", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        return res.status(401).json({message: "Non autorizzato"});
    }
    // let includeDisabled: boolean = false;
    // if (req.query.disabled != null && req.query.disabled === "true") {
    //     includeDisabled = true;
    // }

    const db = DatabaseManager.instance.db;
    const docTemplatesList = await db.query.docTemplates.findMany({
        // where: {
        //     disabled: includeDisabled ? undefined : false
        // }
    });
    if (docTemplatesList == null) {
        return res.status(500).json({message: "Errore nel reperire i modelli di documenti"});
    }
    const docTemplatesResList: DocTemplateListEntry[] = [];
    for (const docTemplate of docTemplatesList) {
        docTemplatesResList.push({
            id: docTemplate.id,
            createdAt: docTemplate.createdAt,
            updatedAt: docTemplate.updatedAt,
            disabled: docTemplate.disabled,
            description: docTemplate.description,
            path: adjustPathForDownload(docTemplate.path || ""),
        });
    }
    res.json({
        message: "Modelli di documento acquisiti con successo",
        docTemplatesList: docTemplatesResList
    });
});

docTemplatesRouter.get("/detail/:docTemplateID", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    if (req.params.docTemplateID == null || ("" + req.params.docTemplateID).trim() == "") {
        res.status(400).json({message: "ID modello documento non valido"});
        return;
    }
    const docTemplateID = parseInt(req.params.docTemplateID as string);
    if (isNaN(docTemplateID)) {
        res.status(400).json({message: "ID modello documento non valido"});
        return;
    }

    const db = DatabaseManager.instance.db;
    const docTemplate = await db.query.docTemplates.findFirst(
        {
            where: {id: docTemplateID}
        });
    if (docTemplate == null) {
        res.status(500).json({message: "Modello di documento non trovato"});
        return;
    }
    const docDetails: DocTemplateListEntry = {
        id: docTemplate.id,
        createdAt: docTemplate.createdAt,
        updatedAt: docTemplate.updatedAt,
        disabled: docTemplate.disabled,
        description: docTemplate.description,
        path: adjustPathForDownload(docTemplate.path || ""),
    };

    res.json({
        message: "Modello di documento acquisito con successo",
        docTemplate: docDetails
    });
});

docTemplatesRouter.post("/edit/:docTemplateID", middlewareAuthCheck(["admin", "operatore"]),
    uploadModelsMulter.single("docTemplateFile"), async (req: AuthRequest, res) => {
        if (req.user == null) {
            deleteFile(req.file);
            res.status(401).json({message: "Non autorizzato"});
            return;
        }

        if (req.params.docTemplateID == null || ("" + req.params.docTemplateID).trim() == "") {
            deleteFile(req.file);
            res.status(400).json({message: "Modello di documento non trovato"});
            return;
        }
        const docTemplateID = parseInt(req.params.docTemplateID as string);

        if (req.body.description == null || req.body.description.trim() === "" ||
            req.body.disabled == null || req.body.disabled.trim() === "") {
            deleteFile(req.file);
            res.status(400).json({message: "Richiesta con campi mancanti"});
            return;
        }
        const {description, disabled} = req.body;
        const db = DatabaseManager.instance.db;
        try {
            const previousDocTemplate = await db.query.docTemplates.findFirst({where: {id: docTemplateID}});
            if (previousDocTemplate == null) {
                deleteFile(req.file);
                res.status(400).json({message: "Modello di documento non trovato"});
                return;
            }
            const previousFilePath = previousDocTemplate.path;
            const updateResult = await db.update(docTemplates)
                .set({
                    description: description,
                    disabled: disabled === "true",
                    path: req.file != null ? req.file.path : previousFilePath
                })
                .where(eq(docTemplates.id, docTemplateID));
            if (updateResult == null) {
                deleteFile(req.file);
                res.status(500).json({message: "Aggiornamento non riuscito"});
                return;
            }
            if (updateResult.rowCount !== 1) {
                deleteFile(req.file);
                res.status(500).json({message: "Aggiornamento non riuscito (righe: " + updateResult.rowCount + "): " + updateResult.command});
                return;
            }
            if (req.file != null) {
                deleteFileByPath(previousFilePath);
            }
        } catch (e) {
            deleteFile(req.file);
            res.status(500).json({message: "Errore durante l'aggiornamento: " + e});
            return;
        }
        res.status(200).json({message: "Modello aggiornato con successo"});
    }
);

docTemplatesRouter.post("/new", middlewareAuthCheck(["admin", "operatore"]),
    uploadModelsMulter.single("docTemplateFile"), async (req: AuthRequest, res) => {
        if (req.user == null) {
            deleteFile(req.file);
            res.status(401).json({message: "Non autorizzato"});
            return;
        }

        if (req.file == null) {
            res.status(401).json({message: "File non presente"});
            return;
        }

        if (req.body.description == null || req.body.description.trim() === "") {
            deleteFile(req.file);
            res.status(400).json({message: "Richiesta con campi mancanti"});
            return;
        }
        const {description} = req.body;

        const db = DatabaseManager.instance.db;
        try {
            const insertResult = await db.insert(docTemplates).values({
                description: description,
                path: req.file.path
            });
            if (insertResult == null) {
                deleteFile(req.file);
                res.status(500).json({message: "Inserimento non riuscito"});
                return;
            }
            if (insertResult.rowCount !== 1) {
                deleteFile(req.file);
                res.status(500).json({message: "Inserimento non riuscito (righe: " + insertResult.rowCount + "): " + insertResult.command});
                return;
            }
        } catch (e) {
            deleteFile(req.file);
            res.status(500).json({message: "Errore durante l'inserimento: " + e});
            return;
        }
        res.status(200).json({message: "Modello inserito con successo"});
    }
);








