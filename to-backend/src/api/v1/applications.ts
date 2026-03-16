import {type AuthRequest, middlewareAuthCheck} from "./auth.ts";
import {DatabaseManager} from "../../db/databaseManager.ts";
import type {HistoryEvent, HistoryModificationMap} from "../../utils/commonTypes.ts";
import {checkAndUpdateValueModificationsMap} from "../../utils/commonFunctions.ts";
import {
    applications,
    applicationsHistory, permits,
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
import {permitsRouter} from "./permits.ts";

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
    //TODO: fix put checks for all inputs: if they aren't null then they have to be valid
    if (req.body.registerNumber == null || isNaN(parseInt(req.body.registerNumber)) ||
        req.body.registerDate == null || new Date(req.body.registerDate).toString() === "Invalid Date" ||
        req.body.cf == null || req.body.cf.trim() === "" ||
        req.body.firstname == null || req.body.firstname.trim() === "" ||
        req.body.lastname == null || req.body.lastname.trim() === "" ||
        req.body.notes == null ||
        req.body.permitId == null || isNaN(parseInt(req.body.permitId)) ||
        req.body.outcomeId == null || isNaN(parseInt(req.body.outcomeId)) ||
        req.body.typeId == null || isNaN(parseInt(req.body.typeId))) {
        res.status(400).json({message: "Richiesta con campi mancanti"});
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
        //EXTRA
        createVoucher, //boolean for creating a voucher for this application
    } = req.body;

    const db = DatabaseManager.instance.db;
    try {
        const toUpdateApplication = await db.query.applications.findFirst(
            {
                where: {id: applicationID}
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
            voucherId === toUpdateApplication.voucherId) {
            res.status(200).json({message: "Nessuna modifica effettuata"});
            return;
        }

        const updatedApplicationId = await db.transaction(async (tx) => {
            //TODO: check createVoucher and create it
            let createdVoucherId: number | null = null;
            if (createVoucher && voucherId == null) {
                const outcomeDateT: Date = new Date(outcomeDate);
                if (outcomeDateT.toString() === "Invalid Date") {
                    console.log("Errore durante la creazione del tagliando: data esito non valida");
                    tx.rollback();
                    return null;
                }
                try {
                    const {number, durationDays} = await getVoucherNumerationNewData(tx, toUpdateApplication.permitId);
                    const expiryDateT: Date = new Date(outcomeDateT);
                    expiryDateT.setDate(expiryDateT.getDate() + durationDays);
                    const createdVoucher = await tx.insert(vouchers).values({
                        number: number,
                        revoked: false,
                        validFromDate: outcomeDateT.toDateString(),
                        validToDate: expiryDateT.toDateString(),
                        notes: "",
                        permitId: toUpdateApplication.permitId,
                        generatedVoucherTemplatePath: "",
                        generatedAuthorizationTemplatePath: "",
                        generatedVoucherPdfPath: "",
                        generatedAuthorizationPdfPath: "",
                        signedAuthorizationPath: "",
                    });

                    //creatededVoucherId =
                } catch (e) {
                    console.log("Errore durante la creazione del tagliando: " + e);
                    tx.rollback();
                    return null;
                }
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
            const foundPermits = await tx.select().from(permits).where(eq(permits.id, permitId));
            if (foundPermits == null || foundPermits.length !== 1 || foundPermits[0] == null || foundPermits[0].lastPermitHistoryId == null) {
                console.log("Errore permesso non trovato");
                tx.rollback();
                return null;
            }
            const permitHistoryId = foundPermits[0].lastPermitHistoryId;

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
                ...(voucherHistoryId != null && { voucherHistoryId: voucherHistoryId }),
            }).returning();
            if (updatedApplicationHistory == null || updatedApplicationHistory.length !== 1 || updatedApplicationHistory[0] == null) {
                console.log("Errore durante l'aggiornamento dello storico della domanda");
                tx.rollback();
                return null;
            }
            const updateResult = await tx.update(applications)
                .set({lastApplicationHistoryId: updatedApplicationHistory[0].id})
                .where(eq(applications.id, updatedApplication[0].id));
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
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    const modifiedByAuthUserId = req.user.id;

    if (req.body.registerNumber == null || isNaN(parseInt(req.body.registerNumber)) ||
        req.body.registerDate == null || new Date(req.body.registerDate).toString() === "Invalid Date" ||
        req.body.cf == null || req.body.cf.trim() === "" ||
        req.body.firstname == null || req.body.firstname.trim() === "" ||
        req.body.lastname == null || req.body.lastname.trim() === "" ||
        req.body.notes == null ||
        req.body.permitId == null || isNaN(parseInt(req.body.permitId)) ||
        req.body.outcomeId == null || isNaN(parseInt(req.body.outcomeId)) ||
        req.body.typeId == null || isNaN(parseInt(req.body.typeId))) {
        res.status(400).json({message: "Richiesta con campi mancanti"});
        return;
    }
    //TODO: add creare voucher
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

            const foundPermits = await tx.select().from(permits).where(eq(permits.id, permitId));
            if (foundPermits == null || foundPermits.length !== 1 || foundPermits[0] == null || foundPermits[0].lastPermitHistoryId == null) {
                console.log("Errore permesso non trovato");
                tx.rollback();
                return null;
            }
            const permitHistoryId = foundPermits[0].lastPermitHistoryId;

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
                ...(voucherHistoryId != null && { voucherHistoryId: voucherHistoryId }), // aggiunta condizionale perché drizzle orm non accetta null in insert tramite typescript
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


            res.status(200).json({
                message: "Tipi e Esiti domande acquisiti con successo",
                applicationTypeList: applicationTypeList,
                applicationOutcomeList: applicationOutcomeList
            });
        } catch (e) {
            res.status(500).json({message: "Errore nel reperire tipi e esiti domande: " + e});
        }
    }
);


