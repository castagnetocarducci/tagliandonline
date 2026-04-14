import {Router} from "express";
import {type AuthRequest, middlewareAuthCheck} from "./auth.ts";
import {DatabaseManager, type DbTransactionType} from "../../db/databaseManager.ts";
import {numerationRegisters, permits} from "../../db/schema.ts";
import {eq} from "drizzle-orm";
import {PgAsyncTransaction} from "drizzle-orm/pg-core";

export const numerationsRouter = Router();


export type NumerationListEntry = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    nextNumber: number,
    disabled: boolean,
    description: string
}

numerationsRouter.get("/list", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        return res.status(401).json({message: "Non autorizzato"});
    }

    const db = DatabaseManager.instance.db;
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
    res.json({
        message: "Numerazioni acquisite con successo",
        numerationRegisterList: numerationsRegistersList
    });
});

numerationsRouter.get("/detail/:numerationID", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    if (req.params.numerationID == null || ("" + req.params.numerationID).trim() == "") {
        res.status(400).json({message: "ID numerazione non valido"});
        return;
    }
    const numerationID = parseInt(req.params.numerationID as string);
    if (isNaN(numerationID)) {
        res.status(400).json({message: "ID numerazione non valido"});
        return;
    }

    const db = DatabaseManager.instance.db;
    const numerationRegister = await db.query.numerationRegisters.findFirst(
        {
            where: {id: numerationID}
        });
    if (numerationRegister == null) {
        res.status(500).json({message: "Numerazione non trovata"});
        return;
    }
    const numerationDetails: NumerationListEntry = {
        id: numerationRegister.id,
        createdAt: numerationRegister.createdAt,
        updatedAt: numerationRegister.updatedAt,
        nextNumber: numerationRegister.nextNumber,
        disabled: numerationRegister.disabled,
        description: numerationRegister.description
    };

    res.json({
        message: "Numerazione acquisita con successo",
        numerationRegister: numerationDetails
    });
});

numerationsRouter.post("/edit/:numerationID", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
        if (req.user == null) {
            res.status(401).json({message: "Non autorizzato"});
            return;
        }

        if (req.params.numerationID == null || ("" + req.params.numerationID).trim() == "") {
            res.status(400).json({message: "Numerazione non trovata"});
            return;
        }
        const numerationID = parseInt(req.params.numerationID as string);

        if (req.body.description == null || req.body.description.trim() === "" ||
            req.body.nextNumber == null || isNaN(parseInt(req.body.nextNumber)) ||
            req.body.disabled == null || req.body.disabled.trim() === "") {
            res.status(400).json({message: "Richiesta con campi mancanti"});
            return;
        }
        const {description, nextNumber, disabled} = req.body;
        const db = DatabaseManager.instance.db;
        try {
            const updateResult = await db.update(numerationRegisters)
                .set({
                    description: description,
                    nextNumber: nextNumber,
                    disabled: disabled === "true"
                })
                .where(eq(numerationRegisters.id, numerationID));
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
        res.status(200).json({message: "Numerazione aggiornata con successo"});
    }
);

numerationsRouter.post("/new", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
        if (req.user == null) {
            res.status(401).json({message: "Non autorizzato"});
            return;
        }
        if (req.body.description == null || req.body.description.trim() === "" ||
            req.body.nextNumber == null || !isNaN(parseInt(req.body.nextNumber))) {
            res.status(400).json({message: "Richiesta con campi mancanti"});
            return;
        }
        const {description, nextNumber} = req.body;
        const db = DatabaseManager.instance.db;
        try {
            const inserted = await db.insert(numerationRegisters).values({
                description: description,
                nextNumber: nextNumber
            }).returning();
            if (inserted == null || inserted.length !== 1 || inserted[0] == null) {
                res.status(500).json({message: "Inserimento non riuscito"});
                return;
            }
            const insertedNumeration = inserted[0];
            res.status(200).json({message: "Numerazione inserita con successo", id: insertedNumeration.id});
        } catch (e) {
            res.status(500).json({message: "Errore durante l'inserimento: " + e});
            return;
        }
    }
);

export const getVoucherNumerationNewData = async (tx: DbTransactionType, permitID: number): Promise<{number: number, durationDays: number}> => {
    const numerationRes =
        await tx.select().from(permits).where(eq(permits.id, permitID)).leftJoin(numerationRegisters, eq(permits.numerationRegisterId, numerationRegisters.id));
    if (numerationRes == null || numerationRes.length !== 1 || numerationRes[0] == null ||
        numerationRes[0].numerationRegisters == null || numerationRes[0].permits == null) {
        throw new Error("Errore: registro numerazione non trovato");
    }
    const numeration = numerationRes[0].numerationRegisters;
    const permit = numerationRes[0].permits;
    const nextNumber = numeration.nextNumber;
    const durationDays = permit.voucherDurationDays;
    const updateResult = await tx.update(numerationRegisters).set(
        {
            nextNumber: nextNumber + 1
        }).where(eq(numerationRegisters.id, numeration.id));
    if (updateResult == null || updateResult.rowCount !== 1) {
        throw new Error("Errore: aggiornamento non riuscito: " + updateResult);
    }
    return {
        number: nextNumber,
        durationDays: durationDays
    };
}

