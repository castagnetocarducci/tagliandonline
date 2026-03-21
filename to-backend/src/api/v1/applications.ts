import {type AuthRequest, middlewareAuthCheck} from "./auth.ts";
import {DatabaseManager} from "../../db/databaseManager.ts";
import type {HistoryEvent, HistoryModificationMap} from "../../utils/commonTypes.ts";
import {checkAndUpdateValueModificationsMap} from "../../utils/commonFunctions.ts";
import {
    applications,
    applicationsHistory, applicationsHistoryToVehiclesHistory, applicationsToVehicles, permits,
    permitsHistory,
    vehicles,
    vehiclesHistory, vouchers,
    vouchersHistory
} from "../../db/schema.ts";
import {and, desc, eq, gte, ilike, lte} from "drizzle-orm";
import {Router} from "express";
import {ConfigProvider} from "../../configProvider.ts";
import type {DocTemplateListEntry} from "./docTemplates.ts";
import type {EmailTemplateListEntry} from "./emailTemplates.ts";
import {getVoucherNumerationNewData, type NumerationListEntry} from "./numerations.ts";
import {getLastPermitHistoryId, getPermit, getPermitsList, permitsRouter} from "./permits.ts";
import {createNewVoucher, getLastVoucherHistoryId, updateVoucherWithApplication} from "./vouchers.ts";
import {getLastVehicleHistoryId} from "./vehicles.ts";

export const applicationsRouter = Router();

type ApplicationTypeListEntry = {
    id: number,
    description: string,
    disabled: boolean,
}
type ApplicationOutcomeListEntry = {
    id: number,
    description: string,
    disabled: boolean,
}
type ApplicationPermitListEntry = {
    id: number,
    description: string,
    disabled: boolean,
}

type ApplicationListEntry = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    requestDate: Date,
    outcomeDate: Date,
    registerNumber: number,
    registerDate: Date,
    cf: string,
    firstname: string,
    lastname: string,
    targetHousePlace: string,
    permit: {
        id: number,
        description: string,
        disabled: boolean,
    },
    outcome: {
        id: number,
        description: string
    },
    type: {
        id: number,
        description: string
    }
    voucher: {
        id: number,
        number: number,
        revoked: boolean,
        validFromDate: Date,
        validToDate: Date
    } | null,
    emails: {
        id: number,
        to: string,
        subject: string,
        attachmentsPresent: boolean
    }[]
}

type ApplicationDetails = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    requestDate: Date,
    outcomeDate: Date,
    registerNumber: number,
    registerDate: Date,
    cf: string,
    firstname: string,
    lastname: string,
    email: string,
    birthDate: Date,
    birthCity: string,
    residencePlace: string,
    targetHousePlace: string,
    targetHouseLandRegistrySheet: string,
    targetHouseLandRegistryMap: string,
    targetHouseLandRegistrySubaltern: string,
    targetHouseLandRegistryCategory: string,
    notes: string,

    permit: {
        id: number,
        description: string,
        disabled: boolean,
    },
    outcome: {
        id: number,
        description: string
    },
    type: {
        id: number,
        description: string
    },
    outcomeAuthUser: {
        id: number,
        username: string,
    } | null,
    voucher: {
        id: number,
        number: number,
        revoked: boolean,
        validFromDate: Date,
        validToDate: Date
    } | null,
    emails: {
        id: number,
        to: string,
        subject: string,
        attachmentsPresent: boolean
    }[]
}

// vehiclesRouter.post("/list", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
//     if (req.user == null) {
//         return res.status(401).json({message: "Non autorizzato"});
//     }
//
//     const {
//         idFrom,
//         idTo,
//         plate,
//         model,
//         brand,
//         page,
//     } = req.body;
//     const db = DatabaseManager.instance.db;
//     const resultsPerPage = ConfigProvider.instance.configs.resultsPerPage;
//     // const countConditions = [], queryConditions = [];
//     const searchConditions = [];
//     if (idFrom != null && !isNaN(parseInt(idFrom))) { searchConditions.push(gte(vehicles.id, parseInt(idFrom))); } // queryConditions.push({id: {gte: idFrom}}); }
//     if (idTo != null && !isNaN(parseInt(idTo))) { searchConditions.push(lte(vehicles.id, parseInt(idTo))); } // queryConditions.push({id: {lte: idTo}}); }
//     if (plate != null && plate.trim() !== "") { searchConditions.push(ilike(vehicles.plate, `%${plate}%`)); } // queryConditions.push({plate: {ilike: `%${plate}%`}}); }
//     if (model != null && model.trim() !== "") { searchConditions.push(ilike(vehicles.model, `%${model}%`)); } // queryConditions.push({model: {ilike: `%${model}%`}}); }
//     if (brand != null && brand.trim() !== "") { searchConditions.push(ilike(vehicles.brand, `%${brand}%`)); } // queryConditions.push({brand: {ilike: `%${brand}%`}}); }
//     const totalAmount = await db.$count(vehicles, and(...searchConditions));
//     const vehiclesArr = await db.select().from(vehicles)
//         .where(and(...searchConditions))
//         .orderBy(desc(vehicles.id))
//         .offset(page != null ? (page - 1) * resultsPerPage : 0).limit(resultsPerPage);
//     // const vehiclesArr = await db.query.vehicles.findMany({
//     //     where: {AND: [
//     //         ...queryConditions,
//     //         ]},
//     //     orderBy: {id: "desc"},
//     //     offset: page != null ? (page - 1) * resultsPerPage : undefined,
//     //     limit: resultsPerPage,
//     // });
//     if (vehiclesArr == null) {
//         return res.status(500).json({message: "Errore nel reperire i veicoli"});
//     }
//     const vehiclesList: VehicleListEntry[] = [];
//     for (const vehicleElem of vehiclesArr) {
//         vehiclesList.push({
//             id: vehicleElem.id,
//             createdAt: vehicleElem.createdAt,
//             updatedAt: vehicleElem.updatedAt,
//             plate: vehicleElem.plate,
//             brand: vehicleElem.brand,
//             model: vehicleElem.model
//         });
//     }
//     res.json({
//         message: "Veicoli acquisiti con successo",
//         vehiclesList: vehiclesList,
//         pageData: {
//             currentPage: page != null ? page : 1,
//             totalPages: Math.ceil(totalAmount / resultsPerPage),
//         }
//     });
// });

// vehiclesRouter.get("/detail/:vehicleID", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
//     if (req.user == null) {
//         res.status(401).json({message: "Non autorizzato"});
//         return;
//     }
//     if (req.params.vehicleID == null || ("" + req.params.vehicleID).trim() == "") {
//         res.status(400).json({message: "ID veicolo non valido"});
//         return;
//     }
//     const vehicleID = parseInt(req.params.vehicleID as string);
//     if (isNaN(vehicleID)) {
//         res.status(400).json({message: "ID veicolo non valido"});
//         return;
//     }
//
//     const db = DatabaseManager.instance.db;
//     const vehicle = await db.query.vehicles.findFirst(
//         {
//             where: {id: vehicleID},
//             with: {
//                 applications: true,
//                 vouchers: true,
//             },
//         });
//     if (vehicle == null) {
//         res.status(500).json({message: "Veicolo non trovato"});
//         return;
//     }
//     const vehicleDetails: VehicleDetails = {
//         id: vehicle.id,
//         createdAt: vehicle.createdAt,
//         updatedAt: vehicle.updatedAt,
//         plate: vehicle.plate,
//         model: vehicle.model,
//         brand: vehicle.brand,
//         applications: vehicle.applications.map((application) => application.id),
//         vouchers: vehicle.vouchers.map((voucher) => voucher.id),
//     };
//
//     res.json({
//         message: "Veicolo acquisito con successo",
//         vehicle: vehicleDetails
//     });
// });


// vehiclesRouter.get("/history/:vehicleID", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
//     if (req.user == null) {
//         res.status(401).json({message: "Non autorizzato"});
//         return;
//     }
//     if (req.params.vehicleID == null || ("" + req.params.vehicleID).trim() == "") {
//         res.status(400).json({message: "ID veicolo non valido"});
//         return;
//     }
//     const vehicleID = parseInt(req.params.vehicleID as string);
//     if (isNaN(vehicleID)) {
//         res.status(400).json({message: "ID veicolo non valido"});
//         return;
//     }
//
//     try {
//         const db = DatabaseManager.instance.db;
//         const vehicleHistory = await db.query.vehiclesHistory.findMany(
//             {
//                 where: {vehicleId: vehicleID},
//                 with: {
//                     modifiedByAuthUser: true
//                 },
//                 orderBy: {createdAt: "asc"},
//             });
//         if (vehicleHistory == null || vehicleHistory.length === 0) {
//             res.status(500).json({message: "Storico veicolo non trovato"});
//             return;
//         }
//
//         const vehicleHistoryRes: HistoryEvent[] = [];
//         const currModificationEntries: HistoryModificationMap = {};
//         vehicleHistory.forEach((historyElem) => {
//             const diffModificationEntries: HistoryModificationMap = {};
//             checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "plate", {
//                 description: "Targa",
//                 value: historyElem.plate
//             });
//             checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "brand", {
//                 description: "Marca",
//                 value: historyElem.brand
//             });
//             checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "model", {
//                 description: "Modello",
//                 value: historyElem.model
//             });
//             vehicleHistoryRes.push({
//                 userId: historyElem.modifiedByAuthUser ? historyElem.modifiedByAuthUser.id : 0,
//                 username: historyElem.modifiedByAuthUser ? historyElem.modifiedByAuthUser.username : "unknown",
//                 timestamp: historyElem.createdAt,
//                 modificationsMap: diffModificationEntries
//             });
//         });
//
//         res.status(200).json({
//             message: "Storico del veicolo acquisito con successo",
//             vehicleHistory: vehicleHistoryRes
//         });
//     } catch (e) {
//         res.status(500).json({message: "Errore nel reperire lo storico del veicolo: " + e});
//         return;
//     }
// });

const checkApplicationParameters = (req: AuthRequest) => {
    //TODO: add vehicles
    if (req.body.registerNumber == null || isNaN(parseInt(req.body.registerNumber)) ||
        req.body.registerDate == null || new Date(req.body.registerDate).toString() === "Invalid Date" ||
        req.body.cf == null || req.body.cf.trim() === "" ||
        req.body.firstname == null || req.body.firstname.trim() === "" ||
        req.body.lastname == null || req.body.lastname.trim() === "" ||
        req.body.email == null || req.body.email.trim() === "" ||
        req.body.notes == null || typeof req.body.notes !== "string" ||
        req.body.permitId == null || isNaN(parseInt(req.body.permitId)) ||
        req.body.outcomeId == null || isNaN(parseInt(req.body.outcomeId)) ||
        req.body.typeId == null || isNaN(parseInt(req.body.typeId)) ||
        req.body.vehicles == null || !Array.isArray(req.body.vehicles) || req.body.vehicles.some((elem: any) => typeof elem !== 'number')) {
        return false;
    }
    if (
        (req.body.requestDate != null && new Date(req.body.requestDate).toString() === "Invalid Date") ||
        (req.body.outcomeDate != null && new Date(req.body.outcomeDate).toString() === "Invalid Date") ||
        (req.body.birthDate != null && new Date(req.body.birthDate).toString() === "Invalid Date") ||
        (req.body.birthCity != null && typeof req.body.birthCity !== "string") ||
        (req.body.outcomeAuthUserId != null && isNaN(parseInt(req.body.outcomeAuthUserId))) ||
        (req.body.voucherId != null && isNaN(parseInt(req.body.voucherId))) ||
        (req.body.createVoucher != null && typeof req.body.createVoucher !== "boolean")
    ) {
        return false;
    }
    return true;
}

applicationsRouter.post("/edit/:applicationID", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    const modifiedByAuthUserId = req.user.id;

    if (req.params.applicationID == null || ("" + req.params.applicationID).trim() == "") {
        res.status(400).json({message: "Domanda non trovata"});
        return;
    }
    const applicationID = parseInt(req.params.applicationID as string);
    if (!checkApplicationParameters(req)) {
        res.status(400).json({message: "Parametri di aggiornamento non validi"});
        return;
    }

    const {
        requestDate,
        outcomeDate,
        registerNumber,
        registerDate,
        cf,
        firstname,
        lastname,
        email,
        birthDate,
        birthCity,
        residencePlace,
        targetHousePlace,
        targetHouseLandRegistrySheet,
        targetHouseLandRegistryMap,
        targetHouseLandRegistrySubaltern,
        targetHouseLandRegistryCategory,
        notes,
        permitId,
        outcomeId,
        typeId,
        outcomeAuthUserId,
        voucherId,
        vehicles,
        //EXTRA
        createVoucher, //boolean for creating a voucher for this application
    } = req.body;

    const db = DatabaseManager.instance.db;
    try {
        const toUpdateApplication = await db.query.applications.findFirst(
            {
                where: {id: applicationID},
                with: {vehicles: true,},
            });
        if (toUpdateApplication == null) {
            res.status(500).json({message: "Domanda non trovata"});
            return;
        }
        if (requestDate === toUpdateApplication.requestDate &&
            outcomeDate === toUpdateApplication.outcomeDate &&
            registerNumber === toUpdateApplication.registerNumber &&
            registerDate === toUpdateApplication.registerDate &&
            cf === toUpdateApplication.cf &&
            firstname === toUpdateApplication.firstname &&
            lastname === toUpdateApplication.lastname &&
            email === toUpdateApplication.email &&
            birthDate === toUpdateApplication.birthDate &&
            birthCity === toUpdateApplication.birthCity &&
            residencePlace === toUpdateApplication.residencePlace &&
            targetHousePlace === toUpdateApplication.targetHousePlace &&
            targetHouseLandRegistrySheet === toUpdateApplication.targetHouseLandRegistrySheet &&
            targetHouseLandRegistryMap === toUpdateApplication.targetHouseLandRegistryMap &&
            targetHouseLandRegistrySubaltern === toUpdateApplication.targetHouseLandRegistrySubaltern &&
            targetHouseLandRegistryCategory === toUpdateApplication.targetHouseLandRegistryCategory &&
            notes === toUpdateApplication.notes &&
            permitId === toUpdateApplication.permitId &&
            outcomeId === toUpdateApplication.outcomeId &&
            typeId === toUpdateApplication.typeId &&
            outcomeAuthUserId === toUpdateApplication.outcomeAuthUserId &&
            voucherId === toUpdateApplication.voucherId &&
            toUpdateApplication.vehicles.length === vehicles.length &&
            toUpdateApplication.vehicles.map((vehicle) => vehicle.id).every((id) => vehicles.includes(id)) &&
            createVoucher === false) {
            res.status(200).json({message: "Nessuna modifica effettuata"});
            return;
        }

        const updatedApplicationId = await db.transaction(async (tx) => {
            const permit = await getPermit(tx, permitId);
            const permitHistoryId = permit.lastPermitHistoryId as number;

            if (permit.applicationPlatesAmount != vehicles.length) {
                res.status(400).json({message: "Numero di veicoli non valido"});
                tx.rollback();
                return;
            }

            let createdVoucherId: number | null = null;
            let createdVoucherHistoryId: number | null = null;
            if (createVoucher && voucherId == null) {
                const {newVoucherId, newVoucherHistoryId} = await createNewVoucher(tx, {
                    permitId: permitId,
                    permitHistoryId: permitHistoryId,
                    validFromDate: outcomeDate,
                    notes: "",
                    permitApplicationPlatesAmount: permit.applicationPlatesAmount,
                    modifiedByAuthUserId: modifiedByAuthUserId,
                    vehicles: vehicles,
                });
                createdVoucherId = newVoucherId;
                createdVoucherHistoryId = newVoucherHistoryId;
            }

            const updatedApplication = await tx.update(applications).set({
                requestDate: requestDate,
                outcomeDate: outcomeDate,
                registerNumber: registerNumber,
                registerDate: registerDate,
                cf: cf,
                firstname: firstname,
                lastname: lastname,
                email: email,
                birthDate: birthDate,
                birthCity: birthCity,
                residencePlace: residencePlace,
                targetHousePlace: targetHousePlace,
                targetHouseLandRegistrySheet: targetHouseLandRegistrySheet,
                targetHouseLandRegistryMap: targetHouseLandRegistryMap,
                targetHouseLandRegistrySubaltern: targetHouseLandRegistrySubaltern,
                targetHouseLandRegistryCategory: targetHouseLandRegistryCategory,
                notes: notes,
                permitId: permitId,
                typeId: typeId,
                outcomeId: outcomeId,
                voucherId: (createdVoucherId != null ? createdVoucherId : voucherId),
                ...(outcomeId !== toUpdateApplication.outcomeId && {outcomeAuthUserId: modifiedByAuthUserId}),
            }).where(eq(applications.id, applicationID)).returning();
            if (updatedApplication == null || updatedApplication.length !== 1 || updatedApplication[0] == null) {
                console.log("Errore durante l'aggiornamento della domanda");
                tx.rollback();
                return null;
            }

            const deleteResult = await tx.delete(applicationsToVehicles).where(eq(applicationsToVehicles.applicationId, applicationID));
            const vehiclesToInsertApplication = (vehicles as number[]).map((vehicleId) => {
                return {
                    applicationId: applicationID,
                    vehicleId: vehicleId as number,
                }
            });

            if (createdVoucherId == null) {
                await updateVoucherWithApplication(tx, voucherId, modifiedByAuthUserId);
            }

            const insertResult = await tx.insert(applicationsToVehicles).values(vehiclesToInsertApplication);
            if (insertResult == null || insertResult.rowCount !== vehicles.length) {
                console.log("Errore durante l'aggiornamento delle associazioni tra domanda e veicoli");
                tx.rollback();
                return null;
            }

            let voucherHistoryId: number | null = null;
            if (voucherId != null) {
                voucherHistoryId = await getLastVoucherHistoryId(tx, voucherId);
            }

            const updatedApplicationHistory = await tx.insert(applicationsHistory).values({
                applicationId: updatedApplication[0].id,
                modifiedByAuthUserId: modifiedByAuthUserId,

                requestDate: updatedApplication[0].requestDate,
                outcomeDate: updatedApplication[0].outcomeDate,
                registerNumber: updatedApplication[0].registerNumber,
                registerDate: updatedApplication[0].registerDate,
                cf: updatedApplication[0].cf,
                firstname: updatedApplication[0].firstname,
                lastname: updatedApplication[0].lastname,
                email: updatedApplication[0].email,
                birthDate: updatedApplication[0].birthDate,
                birthCity: updatedApplication[0].birthCity,
                residencePlace: updatedApplication[0].residencePlace,
                targetHousePlace: updatedApplication[0].targetHousePlace,
                targetHouseLandRegistrySheet: updatedApplication[0].targetHouseLandRegistrySheet,
                targetHouseLandRegistryMap: updatedApplication[0].targetHouseLandRegistryMap,
                targetHouseLandRegistrySubaltern: updatedApplication[0].targetHouseLandRegistrySubaltern,
                targetHouseLandRegistryCategory: updatedApplication[0].targetHouseLandRegistryCategory,
                notes: updatedApplication[0].notes,
                permitHistoryId: permitHistoryId,
                outcomeId: updatedApplication[0].outcomeId,
                typeId: updatedApplication[0].typeId,
                outcomeAuthUserId: updatedApplication[0].outcomeAuthUserId,
                voucherHistoryId: (createdVoucherHistoryId != null ? createdVoucherHistoryId : voucherHistoryId),
            }).returning();
            if (updatedApplicationHistory == null || updatedApplicationHistory.length !== 1 || updatedApplicationHistory[0] == null) {
                console.log("Errore durante l'aggiornamento dello storico della domanda");
                tx.rollback();
                return null;
            }
            const updatedApplicationHistoryId = updatedApplicationHistory[0].id;
            const updateResult = await tx.update(applications)
                .set({lastApplicationHistoryId: updatedApplicationHistoryId})
                .where(eq(applications.id, updatedApplication[0].id));
            const vehiclesToInsertApplicationHistory: {applicationHistoryId: number, vehicleHistoryId: number}[] = [];
            for (const vehicleId of vehicles) {
                const vehicleHistoryId = await getLastVehicleHistoryId(tx, vehicleId);
                vehiclesToInsertApplicationHistory.push({
                    applicationHistoryId: updatedApplicationHistoryId,
                    vehicleHistoryId: vehicleHistoryId,
                });
            }

            const insertASVSResult = await tx.insert(applicationsHistoryToVehiclesHistory).values(vehiclesToInsertApplicationHistory);
            if (insertASVSResult == null || insertASVSResult.rowCount !== vehicles.length) {
                console.log("Errore durante l'aggiornamento delle associazioni tra storico domanda e storico veicoli");
                tx.rollback();
                return null;
            }

            if (updateResult == null || updateResult.rowCount !== 1) {
                console.log("Errore durante l'aggiornamento della domanda con lo storico");
                tx.rollback();
                return null;
            }
            return updatedApplication[0].id;
        });
        if (updatedApplicationId == null) {
            res.status(500).json({message: "Errore durante l'aggiornamento della domanda"});
            return;
        }
        res.status(200).json({message: "Veicolo aggiornato con successo"});
        return;
    } catch (e) {
        res.status(500).json({message: "Errore durante l'aggiornamento: " + e});
        return;
    }
});

applicationsRouter.post("/new", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
    //TODO: redo this function based on /edit
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    const modifiedByAuthUserId = req.user.id;

    if (!checkApplicationParameters(req)) {
        res.status(400).json({message: "Parametri di inserimento non validi"});
        return;
    }

    const {
        requestDate,
        outcomeDate,
        registerNumber,
        registerDate,
        cf,
        firstname,
        lastname,
        email,
        birthDate,
        birthCity,
        residencePlace,
        targetHousePlace,
        targetHouseLandRegistrySheet,
        targetHouseLandRegistryMap,
        targetHouseLandRegistrySubaltern,
        targetHouseLandRegistryCategory,
        notes,
        permitId,
        outcomeId,
        typeId,
        voucherId,
        //EXTRA
        createVoucher, //boolean for creating a voucher for this application
    } = req.body;

    const db = DatabaseManager.instance.db;
    try {
        const insertedApplicationId = await db.transaction(async (tx) => {
            const insertedApplication = await tx.insert(applications).values({
                requestDate,
                outcomeDate,
                registerNumber,
                registerDate,
                cf,
                firstname,
                lastname,
                email,
                birthDate,
                birthCity,
                residencePlace,
                targetHousePlace,
                targetHouseLandRegistrySheet,
                targetHouseLandRegistryMap,
                targetHouseLandRegistrySubaltern,
                targetHouseLandRegistryCategory,
                notes,
                permitId,
                outcomeId,
                typeId,
                outcomeAuthUserId: modifiedByAuthUserId,
                voucherId,
            }).returning();
            if (insertedApplication == null || insertedApplication.length !== 1 || insertedApplication[0] == null) {
                console.log("Errore durante l'inserimento della domanda");
                tx.rollback();
                return null;
            }

            const permitHistoryId = await getLastPermitHistoryId(tx, permitId);

            let voucherHistoryId: number | null = null;
            if (voucherId != null) {
                const foundVouchers = await tx.select().from(vouchers).where(eq(vouchers.id, voucherId));
                if (foundVouchers == null || foundVouchers.length !== 1 || foundVouchers[0] == null || foundVouchers[0].lastVoucherHistoryId == null) {
                    console.log("Errore tagliando non trovato");
                    tx.rollback();
                    return null;
                }
                voucherHistoryId = foundVouchers[0].lastVoucherHistoryId;
            }

            const insertedApplicationHistory = await tx.insert(applicationsHistory).values({
                applicationId: insertedApplication[0].id,
                modifiedByAuthUserId: modifiedByAuthUserId,

                requestDate: insertedApplication[0].requestDate,
                outcomeDate: insertedApplication[0].outcomeDate,
                registerNumber: insertedApplication[0].registerNumber,
                registerDate: insertedApplication[0].registerDate,
                cf: insertedApplication[0].cf,
                firstname: insertedApplication[0].firstname,
                lastname: insertedApplication[0].lastname,
                email: insertedApplication[0].email,
                birthDate: insertedApplication[0].birthDate,
                birthCity: insertedApplication[0].birthCity,
                residencePlace: insertedApplication[0].residencePlace,
                targetHousePlace: insertedApplication[0].targetHousePlace,
                targetHouseLandRegistrySheet: insertedApplication[0].targetHouseLandRegistrySheet,
                targetHouseLandRegistryMap: insertedApplication[0].targetHouseLandRegistryMap,
                targetHouseLandRegistrySubaltern: insertedApplication[0].targetHouseLandRegistrySubaltern,
                targetHouseLandRegistryCategory: insertedApplication[0].targetHouseLandRegistryCategory,
                notes: insertedApplication[0].notes,
                permitHistoryId: permitHistoryId,
                outcomeId: insertedApplication[0].outcomeId,
                typeId: insertedApplication[0].typeId,
                outcomeAuthUserId: insertedApplication[0].outcomeAuthUserId,
                ...(voucherHistoryId != null && {voucherHistoryId: voucherHistoryId}), // aggiunta condizionale perché drizzle orm non accetta null in insert tramite typescript
            }).returning();
            if (insertedApplicationHistory == null || insertedApplicationHistory.length !== 1 || insertedApplicationHistory[0] == null) {
                console.log("Errore durante l'inserimento dello storico della domanda");
                tx.rollback();
                return null;
            }
            const updateResult = await tx.update(applications)
                .set({lastApplicationHistoryId: insertedApplicationHistory[0].id})
                .where(eq(applications.id, insertedApplication[0].id));
            if (updateResult == null || updateResult.rowCount !== 1) {
                console.log("Errore durante l'aggiornamento della domanda con lo storico");
                tx.rollback();
                return null;
            }
            return insertedApplication[0].id;
        });

        if (insertedApplicationId == null) {
            res.status(500).json({message: "Errore durante l'inserimento della domanda"});
            return;
        }
        res.status(200).json({message: "Domanda inserita con successo", id: insertedApplicationId});
        return;
    } catch (e) {
        res.status(500).json({message: "Errore durante l'inserimento: " + e});
        return;
    }
});


applicationsRouter.get("/availableOptions", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
        if (req.user == null) {
            return res.status(401).json({message: "Non autorizzato"});
        }
        const db = DatabaseManager.instance.db;
        try {
            const applicationTypeList: ApplicationTypeListEntry[] = [];
            const applicationTypesArr = await db.query.applicationTypes.findMany({
                orderBy: {id: "asc"},
            });
            for (const applicationType of applicationTypesArr) {
                applicationTypeList.push({
                    id: applicationType.id,
                    disabled: applicationType.disabled,
                    description: applicationType.description
                });
            }

            const applicationOutcomeList: ApplicationOutcomeListEntry[] = [];
            const applicationOutcomesArr = await db.query.applicationOutcome.findMany({
                orderBy: {id: "asc"},
            });
            for (const applicationOutcome of applicationOutcomesArr) {
                applicationOutcomeList.push({
                    id: applicationOutcome.id,
                    disabled: applicationOutcome.disabled,
                    description: applicationOutcome.description
                });
            }

            const permitsList = await getPermitsList();
            if (permitsList == null) {
                res.status(500).json({message: "Errore nel reperire elenco dei permessi"});
                return;
            }

            res.status(200).json({
                message: "Tipi e Esiti domande acquisiti con successo",
                applicationTypeList: applicationTypeList,
                applicationOutcomeList: applicationOutcomeList,
                permitsList: permitsList
            });
        } catch (e) {
            res.status(500).json({message: "Errore nel reperire permessi, tipi o esiti domande: " + e});
        }
    }
);


