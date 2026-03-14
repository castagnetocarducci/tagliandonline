import {type AuthRequest, middlewareAuthCheck} from "./auth.ts";
import {DatabaseManager} from "../../db/databaseManager.ts";
import type {HistoryEvent, HistoryModificationMap} from "../../utils/commonTypes.ts";
import {checkAndUpdateValueModificationsMap} from "../../utils/commonFunctions.ts";
import {vehicles, vehiclesHistory} from "../../db/schema.ts";
import {eq} from "drizzle-orm";
import {Router} from "express";

export const vehiclesRouter = Router();

type VehicleListEntry = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    plate: string,
    model: string,
    brand: string,
}

type VehicleDetails = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    plate: string,
    model: string,
    brand: string,
    applications: number[],
    vouchers: number[]
}

vehiclesRouter.post("/list", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        return res.status(401).json({message: "Non autorizzato"});
    }

    const {
        plate,
        model,
        brand,
        page,
    } = req.body;
    //TODO: limit offset using page
    const db = DatabaseManager.instance.db;
    const vehiclesArr = await db.query.vehicles.findMany({
        where: {
            plate: plate != null ? {ilike: `%${plate}%`}: undefined,
            model: model != null ? {ilike: `%${model}%`}: undefined,
            brand: brand != null ? {ilike: `%${brand}%`}: undefined,
        },
        orderBy: {id: "desc"},
    });
    if (vehiclesArr == null) {
        return res.status(500).json({message: "Errore nel reperire i veicoli"});
    }
    const vehiclesList: VehicleListEntry[] = [];
    for (const vehicleElem of vehiclesArr) {
        vehiclesList.push({
            id: vehicleElem.id,
            createdAt: vehicleElem.createdAt,
            updatedAt: vehicleElem.updatedAt,
            plate: vehicleElem.plate,
            brand: vehicleElem.brand,
            model: vehicleElem.model
        });
    }
    res.json({
        message: "Veicoli acquisiti con successo",
        vehiclesList: vehiclesList
    });
});

vehiclesRouter.get("/detail/:vehicleID", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    if (req.params.vehicleID == null || ("" + req.params.vehicleID).trim() == "") {
        res.status(400).json({message: "ID veicolo non valido"});
        return;
    }
    const vehicleID = parseInt(req.params.vehicleID as string);
    if (isNaN(vehicleID)) {
        res.status(400).json({message: "ID veicolo non valido"});
        return;
    }

    const db = DatabaseManager.instance.db;
    const vehicle = await db.query.vehicles.findFirst(
        {
            where: {id: vehicleID},
            with: {
                applications: true,
                vouchers: true,
            },
        });
    if (vehicle == null) {
        res.status(500).json({message: "Veicolo non trovato"});
        return;
    }
    const vehicleDetails: VehicleDetails = {
        id: vehicle.id,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
        plate: vehicle.plate,
        model: vehicle.model,
        brand: vehicle.brand,
        applications: vehicle.applications.map((app) => app.id),
        vouchers: vehicle.vouchers.map((voucher) => voucher.id),
    };

    res.json({
        message: "Veicolo acquisito con successo",
        vehicle: vehicleDetails
    });
});


vehiclesRouter.get("/history/:vehicleID", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    if (req.params.vehicleID == null || ("" + req.params.vehicleID).trim() == "") {
        res.status(400).json({message: "ID veicolo non valido"});
        return;
    }
    const vehicleID = parseInt(req.params.vehicleID as string);
    if (isNaN(vehicleID)) {
        res.status(400).json({message: "ID veicolo non valido"});
        return;
    }

    try {
        const db = DatabaseManager.instance.db;
        const vehicleHistory = await db.query.vehiclesHistory.findMany(
            {
                where: {vehicleId: vehicleID},
                with: {
                    modifiedByAuthUser: true
                },
                orderBy: {createdAt: "asc"},
            });
        if (vehicleHistory == null || vehicleHistory.length === 0) {
            res.status(500).json({message: "Storico veicolo non trovato"});
            return;
        }

        const vehicleHistoryRes: HistoryEvent[] = [];
        const currModificationEntries: HistoryModificationMap = {};
        vehicleHistory.forEach((historyElem) => {
            const diffModificationEntries: HistoryModificationMap = {};
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "plate", {
                description: "Targa",
                value: historyElem.plate
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "brand", {
                description: "Marca",
                value: historyElem.brand
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "model", {
                description: "Modello",
                value: historyElem.model
            });
            vehicleHistoryRes.push({
                userId: historyElem.modifiedByAuthUser ? historyElem.modifiedByAuthUser.id : 0,
                username: historyElem.modifiedByAuthUser ? historyElem.modifiedByAuthUser.username : "unknown",
                timestamp: historyElem.createdAt,
                modificationsMap: diffModificationEntries
            });
        });

        res.status(200).json({
            message: "Storico del veicolo acquisito con successo",
            vehicleHistory: vehicleHistoryRes
        });
    } catch (e) {
        res.status(500).json({message: "Errore nel reperire lo storico del veicolo: " + e});
        return;
    }
});

vehiclesRouter.post("/edit/:vehicleID", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    const modifiedByAuthUserId = req.user.id;

    if (req.params.vehicleID == null || ("" + req.params.vehicleID).trim() == "") {
        res.status(400).json({message: "Veicolo non trovato"});
        return;
    }
    const vehicleID = parseInt(req.params.vehicleID as string);


    if (req.body.plate == null || req.body.plate.trim() === "" ||
        req.body.model == null || req.body.model.trim() === "" ||
        req.body.brand == null || req.body.brand.trim() === "") {
        res.status(400).json({message: "Richiesta con campi mancanti"});
        return;
    }
    let {
        plate,
        model,
        brand,
    } = req.body;
    plate = plate.toUpperCase();
    const db = DatabaseManager.instance.db;
    try {
        const toUpdateVehicle = await db.query.vehicles.findFirst(
            {
                where: {id: vehicleID}
            });
        if (toUpdateVehicle == null) {
            res.status(500).json({message: "Veicolo non trovato"});
            return;
        }
        if (plate === toUpdateVehicle.plate &&
            model === toUpdateVehicle.model &&
            brand === toUpdateVehicle.brand) {
            res.status(200).json({message: "Nessuna modifica effettuata"});
            return;
        }

        const updatedVehicleId = await db.transaction(async (tx) => {
            const updatedVehicle = await tx.update(vehicles).set({
                plate,
                model,
                brand,
            }).where(eq(vehicles.id, vehicleID)).returning();
            if (updatedVehicle == null || updatedVehicle.length !== 1 || updatedVehicle[0] == null) {
                console.log("Errore durante l'aggiornamento del veicolo");
                tx.rollback();
                return null;
            }
            const updatedVehicleHistory = await tx.insert(vehiclesHistory).values({
                vehicleId: updatedVehicle[0].id,
                modifiedByAuthUserId: modifiedByAuthUserId,

                plate: updatedVehicle[0].plate,
                model: updatedVehicle[0].model,
                brand: updatedVehicle[0].brand,
            }).returning();
            if (updatedVehicleHistory == null || updatedVehicleHistory.length !== 1 || updatedVehicleHistory[0] == null) {
                console.log("Errore durante l'aggiornamento dello storico del veicolo");
                tx.rollback();
                return null;
            }
            const updateResult = await tx.update(vehicles)
                .set({lastVehiclesHistoryId: updatedVehicleHistory[0].id})
                .where(eq(vehicles.id, updatedVehicle[0].id));
            if (updateResult == null || updateResult.rowCount !== 1) {
                console.log("Errore durante l'aggiornamento del veicolo con lo storico");
                tx.rollback();
                return null;
            }
            return updatedVehicle[0].id;
        });
        if (updatedVehicleId == null) {
            res.status(500).json({message: "Errore durante l'inserimento del veicolo"});
            return;
        }
        res.status(200).json({message: "Veicolo aggiornato con successo"});
        return;
    } catch (e) {
        res.status(500).json({message: "Errore durante l'aggiornamento: " + e});
        return;
    }

});


vehiclesRouter.post("/new", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    const modifiedByAuthUserId = req.user.id;

    if (req.body.plate == null || req.body.plate.trim() === "" ||
        req.body.model == null || req.body.model.trim() === "" ||
        req.body.brand == null || req.body.brand.trim() === "") {
        res.status(400).json({message: "Richiesta con campi mancanti"});
        return;
    }
    let {
        plate,
        model,
        brand,
    } = req.body;
    plate = plate.toUpperCase();
    const db = DatabaseManager.instance.db;
    try {
        const insertedVehicleId = await db.transaction(async (tx) => {
            const insertedVehicle = await tx.insert(vehicles).values({
                plate,
                model,
                brand,
            }).returning();
            if (insertedVehicle == null || insertedVehicle.length !== 1 || insertedVehicle[0] == null) {
                console.log("Errore durante l'inserimento del veicolo");
                tx.rollback();
                return null;
            }
            const insertedVehicleHistory = await tx.insert(vehiclesHistory).values({
                vehicleId: insertedVehicle[0].id,
                modifiedByAuthUserId: modifiedByAuthUserId,

                plate: insertedVehicle[0].plate,
                model: insertedVehicle[0].model,
                brand: insertedVehicle[0].brand
            }).returning();
            if (insertedVehicleHistory == null || insertedVehicleHistory.length !== 1 || insertedVehicleHistory[0] == null) {
                console.log("Errore durante l'inserimento dello storico del veicolo");
                tx.rollback();
                return null;
            }
            const updateResult = await tx.update(vehicles)
                .set({lastVehiclesHistoryId: insertedVehicleHistory[0].id})
                .where(eq(vehicles.id, insertedVehicle[0].id));
            if (updateResult == null || updateResult.rowCount !== 1) {
                console.log("Errore durante l'aggiornamento del veicolo con lo storico");
                tx.rollback();
                return null;
            }
            return insertedVehicle[0].id;
        });

        if (insertedVehicleId == null) {
            res.status(500).json({message: "Errore durante l'inserimento del veicolo"});
            return;
        }
        res.status(200).json({message: "Veicolo inserito con successo", id: insertedVehicleId});
        return;
    } catch (e) {
        res.status(500).json({message: "Errore durante l'inserimento: " + e});
        return;
    }
});


