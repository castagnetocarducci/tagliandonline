import {Router} from "express";
import {type AuthRequest, middlewareAuthCheck} from "./auth.ts";
import {DatabaseManager} from "../../db/databaseManager.ts";
import {permits, permitsHistory} from "../../db/schema.ts";
import {eq} from "drizzle-orm";
import {type NumerationListEntry} from "./numerations.ts";
import type {DocTemplateListEntry} from "./docTemplates.ts";
import {type EmailTemplateListEntry} from "./emailTemplates.ts";
import type {HistoryEvent, HistoryModificationMap} from "../../utils/commonTypes.ts";
import {checkAndUpdateValueModificationsMap} from "../../utils/commonFunctions.ts";

export const permitsRouter = Router();


type PermitListEntry = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    description: string,
    printedName: string,
    disabled: boolean,
    simultaneousPlatesAmount: number,
    applicationPlatesAmount: number
}

type PermitDetails = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    description: string,
    printedName: string,
    simultaneousPlatesAmount: number,
    applicationPlatesAmount: number,
    disabled: boolean,
    notes: string,
    approveEmailTemplateId: number,
    revokeEmailTemplateId: number,
    refuseEmailTemplateId: number,
    voucherTemplateId: number,
    authorizationTemplateId: number,
    numerationRegisterId: number
}

permitsRouter.get("/list", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        return res.status(401).json({message: "Non autorizzato"});
    }

    const db = DatabaseManager.instance.db;
    const permitsArr = await db.query.permits.findMany({
        orderBy: {updatedAt: "desc"},
    });
    if (permitsArr == null) {
        return res.status(500).json({message: "Errore nel reperire i permessi"});
    }
    const permitsList: PermitListEntry[] = [];
    for (const permitElem of permitsArr) {
        permitsList.push({
            id: permitElem.id,
            createdAt: permitElem.createdAt,
            updatedAt: permitElem.updatedAt,
            description: permitElem.description,
            printedName: permitElem.printedName,
            disabled: permitElem.disabled,
            simultaneousPlatesAmount: permitElem.simultaneousPlatesAmount,
            applicationPlatesAmount: permitElem.applicationPlatesAmount
        });
    }
    res.json({
        message: "Permessi acquisiti con successo",
        permitsList: permitsList
    });
});

permitsRouter.get("/detail/:permitID", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    if (req.params.permitID == null || ("" + req.params.permitID).trim() == "") {
        res.status(400).json({message: "ID permesso non valido"});
        return;
    }
    const permitID = parseInt(req.params.permitID as string);
    if (isNaN(permitID)) {
        res.status(400).json({message: "ID permesso non valido"});
        return;
    }

    const db = DatabaseManager.instance.db;
    const permit = await db.query.permits.findFirst(
        {
            where: {id: permitID}
        });
    if (permit == null) {
        res.status(500).json({message: "Permesso non trovato"});
        return;
    }
    const permitDetails: PermitDetails = {
        id: permit.id,
        createdAt: permit.createdAt,
        updatedAt: permit.updatedAt,
        description: permit.description,
        printedName: permit.printedName,
        simultaneousPlatesAmount: permit.simultaneousPlatesAmount,
        applicationPlatesAmount: permit.applicationPlatesAmount,
        disabled: permit.disabled,
        notes: permit.notes,
        approveEmailTemplateId: permit.approveEmailTemplateId,
        revokeEmailTemplateId: permit.revokeEmailTemplateId,
        refuseEmailTemplateId: permit.refuseEmailTemplateId,
        voucherTemplateId: permit.voucherTemplateId,
        authorizationTemplateId: permit.authorizationTemplateId,
        numerationRegisterId: permit.numerationRegisterId
    };

    res.json({
        message: "Permesso acquisito con successo",
        permit: permitDetails
    });
});




permitsRouter.get("/history/:permitID", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    if (req.params.permitID == null || ("" + req.params.permitID).trim() == "") {
        res.status(400).json({message: "ID permesso non valido"});
        return;
    }
    const permitID = parseInt(req.params.permitID as string);
    if (isNaN(permitID)) {
        res.status(400).json({message: "ID permesso non valido"});
        return;
    }

    try {
        const db = DatabaseManager.instance.db;
        const permitHistory = await db.query.permitsHistory.findMany(
            {
                where: {permitId: permitID},
                with: {
                    modifiedByAuthUser: true,
                    approveEmailTemplate: true,
                    revokeEmailTemplate: true,
                    refuseEmailTemplate: true,
                    voucherDocTemplate: true,
                    authorizationDocTemplate: true,
                    numerationRegister: true
                },
                orderBy: {createdAt: "asc"},
            });
        if (permitHistory == null || permitHistory.length === 0) {
            res.status(500).json({message: "Storico permesso non trovato"});
            return;
        }

        const permitHistoryRes: HistoryEvent[] = [];
        const currModificationEntries: HistoryModificationMap = {};
        permitHistory.forEach((historyElem, index) => {
            const diffModificationEntries: HistoryModificationMap = {};
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "description", historyElem.description);
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "printedName", historyElem.printedName);
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "simultaneousPlatesAmount", "" + historyElem.simultaneousPlatesAmount);
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "applicationPlatesAmount", "" + historyElem.applicationPlatesAmount);
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "notes", historyElem.notes);
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "approveEmailTemplate", historyElem.approveEmailTemplate ? historyElem.approveEmailTemplate.id + ": " + historyElem.approveEmailTemplate.description : "sconosciuto");
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "revokeEmailTemplate", historyElem.revokeEmailTemplate ? historyElem.revokeEmailTemplate.id + ": " + historyElem.revokeEmailTemplate.description : "sconosciuto");
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "refuseEmailTemplate", historyElem.refuseEmailTemplate ? historyElem.refuseEmailTemplate.id + ": " + historyElem.refuseEmailTemplate.description : "sconosciuto");
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "voucherDocTemplate", historyElem.voucherDocTemplate ? historyElem.voucherDocTemplate.id + ": " + historyElem.voucherDocTemplate.description : "sconosciuto");
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "authorizationDocTemplate", historyElem.authorizationDocTemplate ? historyElem.authorizationDocTemplate.id + ": " + historyElem.authorizationDocTemplate.description : "sconosciuto");
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "numerationRegister", historyElem.numerationRegister  ? historyElem.numerationRegister.id + ": " + historyElem.numerationRegister.description : "sconosciuto");
            permitHistoryRes.push( {
                userId: historyElem.modifiedByAuthUser ? historyElem.modifiedByAuthUser.id : 0,
                username: historyElem.modifiedByAuthUser ? historyElem.modifiedByAuthUser.username : "unknown",
                timestamp: historyElem.createdAt,
                modificationsMap: diffModificationEntries
            });
        });

        res.status(200).json({
            message: "Storico del permesso acquisito con successo",
            permitHistory: permitHistoryRes
        });
    } catch (e) {
        res.status(500).json({message: "Errore nel reperire lo storico del permesso: " + e});
        return;
    }



});

permitsRouter.post("/edit/:permitID", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    const modifiedByAuthUserId = req.user.id;

    if (req.params.permitID == null || ("" + req.params.permitID).trim() == "") {
        res.status(400).json({message: "Permesso non trovato"});
        return;
    }
    const permitID = parseInt(req.params.permitID as string);


    if (req.body.description == null || req.body.description.trim() === "" ||
        req.body.printedName == null || req.body.printedName.trim() === "" ||
        req.body.simultaneousPlatesAmount == null || isNaN(parseInt(req.body.simultaneousPlatesAmount)) ||
        req.body.applicationPlatesAmount == null || isNaN(parseInt(req.body.applicationPlatesAmount)) ||
        req.body.notes == null ||
        req.body.approveEmailTemplateId == null || isNaN(parseInt(req.body.approveEmailTemplateId)) ||
        req.body.revokeEmailTemplateId == null || isNaN(parseInt(req.body.revokeEmailTemplateId)) ||
        req.body.refuseEmailTemplateId == null || isNaN(parseInt(req.body.refuseEmailTemplateId)) ||
        req.body.voucherTemplateId == null || isNaN(parseInt(req.body.voucherTemplateId)) ||
        req.body.authorizationTemplateId == null || isNaN(parseInt(req.body.authorizationTemplateId)) ||
        req.body.numerationRegisterId == null || isNaN(parseInt(req.body.numerationRegisterId))) {
        res.status(400).json({message: "Richiesta con campi mancanti"});
        return;
    }
    const {
        description,
        printedName,
        simultaneousPlatesAmount,
        applicationPlatesAmount,
        notes,
        approveEmailTemplateId,
        revokeEmailTemplateId,
        refuseEmailTemplateId,
        voucherTemplateId,
        authorizationTemplateId,
        numerationRegisterId
    } = req.body;
    const db = DatabaseManager.instance.db;
    try {
        const toUpdatePermit = await db.query.permits.findFirst(
            {
                where: {id: permitID}
            });
        if (toUpdatePermit == null) {
            res.status(500).json({message: "Permesso non trovato"});
            return;
        }
        if (description === toUpdatePermit.description &&
            printedName === toUpdatePermit.printedName &&
            simultaneousPlatesAmount === toUpdatePermit.simultaneousPlatesAmount &&
            applicationPlatesAmount === toUpdatePermit.applicationPlatesAmount &&
            notes === toUpdatePermit.notes &&
            approveEmailTemplateId === toUpdatePermit.approveEmailTemplateId &&
            revokeEmailTemplateId === toUpdatePermit.revokeEmailTemplateId &&
            refuseEmailTemplateId === toUpdatePermit.refuseEmailTemplateId &&
            voucherTemplateId === toUpdatePermit.voucherTemplateId &&
            authorizationTemplateId === toUpdatePermit.authorizationTemplateId &&
            numerationRegisterId === toUpdatePermit.numerationRegisterId) {
            res.status(200).json({message: "Nessuna modifica effettuata"});
            return;
        }

        const updatedPermitId = await db.transaction(async (tx) => {
            const updatedPermit = await tx.update(permits).set({
                description,
                printedName,
                simultaneousPlatesAmount,
                applicationPlatesAmount,
                notes,
                approveEmailTemplateId,
                revokeEmailTemplateId,
                refuseEmailTemplateId,
                voucherTemplateId,
                authorizationTemplateId,
                numerationRegisterId
            }).where(eq(permits.id, permitID)).returning();
            if (updatedPermit == null || updatedPermit.length !== 1 || updatedPermit[0] == null) {
                console.log("Errore durante l'aggiornamento del permesso");
                tx.rollback();
                return null;
            }
            const updatedPermitHistory = await tx.insert(permitsHistory).values({
                permitId: updatedPermit[0].id,
                modifiedByAuthUserId: modifiedByAuthUserId,

                description: updatedPermit[0].description,
                printedName: updatedPermit[0].printedName,
                simultaneousPlatesAmount: updatedPermit[0].simultaneousPlatesAmount,
                applicationPlatesAmount: updatedPermit[0].applicationPlatesAmount,
                notes: updatedPermit[0].notes,
                approveEmailTemplateId: updatedPermit[0].approveEmailTemplateId,
                revokeEmailTemplateId: updatedPermit[0].revokeEmailTemplateId,
                refuseEmailTemplateId: updatedPermit[0].refuseEmailTemplateId,
                voucherTemplateId: updatedPermit[0].voucherTemplateId,
                authorizationTemplateId: updatedPermit[0].authorizationTemplateId,
                numerationRegisterId: updatedPermit[0].numerationRegisterId,
            }).returning();
            if (updatedPermitHistory == null || updatedPermitHistory.length !== 1 || updatedPermitHistory[0] == null) {
                console.log("Errore durante l'aggiornamento dello storico del permesso");
                tx.rollback();
                return null;
            }
            const updateResult = await tx.update(permits)
                .set({lastPermitHistoryId: updatedPermitHistory[0].id})
                .where(eq(permits.id, updatedPermit[0].id));
            if (updateResult == null || updateResult.rowCount !== 1) {
                console.log("Errore durante l'aggiornamento del permesso con lo storico");
                tx.rollback();
                return null;
            }
            return updatedPermit[0].id;
        });
        if (updatedPermitId == null) {
            res.status(500).json({message: "Errore durante l'inserimento del permesso"});
            return;
        }
        res.status(200).json({message: "Permesso aggiornato con successo"});
        return;
    } catch (e) {
        res.status(500).json({message: "Errore durante l'aggiornamento: " + e});
        return;
    }

});


permitsRouter.post("/new", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
        if (req.user == null) {
            res.status(401).json({message: "Non autorizzato"});
            return;
        }
        const modifiedByAuthUserId = req.user.id;

        if (req.body.description == null || req.body.description.trim() === "" ||
            req.body.printedName == null || req.body.printedName.trim() === "" ||
            req.body.simultaneousPlatesAmount == null || isNaN(parseInt(req.body.simultaneousPlatesAmount)) ||
            req.body.applicationPlatesAmount == null || isNaN(parseInt(req.body.applicationPlatesAmount)) ||
            req.body.notes == null ||
            req.body.approveEmailTemplateId == null || isNaN(parseInt(req.body.approveEmailTemplateId)) ||
            req.body.revokeEmailTemplateId == null || isNaN(parseInt(req.body.revokeEmailTemplateId)) ||
            req.body.refuseEmailTemplateId == null || isNaN(parseInt(req.body.refuseEmailTemplateId)) ||
            req.body.voucherTemplateId == null || isNaN(parseInt(req.body.voucherTemplateId)) ||
            req.body.authorizationTemplateId == null || isNaN(parseInt(req.body.authorizationTemplateId)) ||
            req.body.numerationRegisterId == null || isNaN(parseInt(req.body.numerationRegisterId))) {
            res.status(400).json({message: "Richiesta con campi mancanti"});
            return;
        }
        const {
            description,
            printedName,
            simultaneousPlatesAmount,
            applicationPlatesAmount,
            notes,
            approveEmailTemplateId,
            revokeEmailTemplateId,
            refuseEmailTemplateId,
            voucherTemplateId,
            authorizationTemplateId,
            numerationRegisterId
        } = req.body;
        const db = DatabaseManager.instance.db;
        try {
            const insertedPermitId = await db.transaction(async (tx) => {
                const insertedPermit = await tx.insert(permits).values({
                    description,
                    printedName,
                    simultaneousPlatesAmount,
                    applicationPlatesAmount,
                    notes,
                    approveEmailTemplateId,
                    revokeEmailTemplateId,
                    refuseEmailTemplateId,
                    voucherTemplateId,
                    authorizationTemplateId,
                    numerationRegisterId
                }).returning();
                if (insertedPermit == null || insertedPermit.length !== 1 || insertedPermit[0] == null) {
                    console.log("Errore durante l'inserimento del permesso");
                    tx.rollback();
                    return null;
                }
                const insertedPermitHistory = await tx.insert(permitsHistory).values({
                    permitId: insertedPermit[0].id,
                    modifiedByAuthUserId: modifiedByAuthUserId,

                    description: insertedPermit[0].description,
                    printedName: insertedPermit[0].printedName,
                    simultaneousPlatesAmount: insertedPermit[0].simultaneousPlatesAmount,
                    applicationPlatesAmount: insertedPermit[0].applicationPlatesAmount,
                    notes: insertedPermit[0].notes,
                    approveEmailTemplateId: insertedPermit[0].approveEmailTemplateId,
                    revokeEmailTemplateId: insertedPermit[0].revokeEmailTemplateId,
                    refuseEmailTemplateId: insertedPermit[0].refuseEmailTemplateId,
                    voucherTemplateId: insertedPermit[0].voucherTemplateId,
                    authorizationTemplateId: insertedPermit[0].authorizationTemplateId,
                    numerationRegisterId: insertedPermit[0].numerationRegisterId,
                }).returning();
                if (insertedPermitHistory == null || insertedPermitHistory.length !== 1 || insertedPermitHistory[0] == null) {
                    console.log("Errore durante l'inserimento dello storico del permesso");
                    tx.rollback();
                    return null;
                }
                const updateResult = await tx.update(permits)
                    .set({lastPermitHistoryId: insertedPermitHistory[0].id})
                    .where(eq(permits.id, insertedPermit[0].id));
                if (updateResult == null || updateResult.rowCount !== 1) {
                    console.log("Errore durante l'aggiornamento del permesso con lo storico");
                    tx.rollback();
                    return null;
                }
                return insertedPermit[0].id;
            });

            if (insertedPermitId == null) {
                res.status(500).json({message: "Errore durante l'inserimento del permesso"});
                return;
            }
            res.status(200).json({message: "Permesso inserito con successo", id: insertedPermitId});
            return;
        } catch (e) {
            res.status(500).json({message: "Errore durante l'inserimento: " + e});
            return;
        }
    }
);

permitsRouter.get("/availableTemplates", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
        if (req.user == null) {
            return res.status(401).json({message: "Non autorizzato"});
        }
        const db = DatabaseManager.instance.db;
        try {
            const docTemplatesList: DocTemplateListEntry[] = [];
            const docTemplatesArr = await db.query.docTemplates.findMany({
                orderBy: {updatedAt: "desc"},
            });
            for (const docTemplate of docTemplatesArr) {
                docTemplatesList.push({
                    id: docTemplate.id,
                    createdAt: docTemplate.createdAt,
                    updatedAt: docTemplate.updatedAt,
                    disabled: docTemplate.disabled,
                    description: docTemplate.description,
                    path: docTemplate.path
                });
            }

            const emailTemplatesList: EmailTemplateListEntry[] = [];
            const emailTemplatesArr = await db.query.emailTemplates.findMany({
                orderBy: {updatedAt: "desc"},
            });
            for (const emailTemplate of emailTemplatesArr) {
                emailTemplatesList.push({
                    id: emailTemplate.id,
                    createdAt: emailTemplate.createdAt,
                    updatedAt: emailTemplate.updatedAt,
                    disabled: emailTemplate.disabled,
                    description: emailTemplate.description
                });
            }

            const numerationsRegistersArr = await db.query.numerationRegisters.findMany({
                orderBy: {updatedAt: "desc"},
            });
            if (numerationsRegistersArr == null) {
                return res.status(500).json({message: "Errore nel reperire le numerazioni"});
            }
            const numerationsRegistersList: NumerationListEntry[] = [];
            for (const numerationRegister of numerationsRegistersArr) {
                numerationsRegistersList.push({
                    id: numerationRegister.id,
                    createdAt: numerationRegister.createdAt,
                    updatedAt: numerationRegister.updatedAt,
                    nextNumber: numerationRegister.nextNumber,
                    disabled: numerationRegister.disabled,
                    description: numerationRegister.description
                });
            }

            res.status(200).json({
                message: "Modelli di documenti ed email e numerazioni acquisiti con successo",
                docTemplatesList: docTemplatesList,
                emailTemplatesList: emailTemplatesList,
                numerationRegisterList: numerationsRegistersList
            });
        } catch (e) {
            res.status(500).json({message: "Errore nel reperire i modelli: " + e});
        }
    }
);

//TODO: storico permessi

