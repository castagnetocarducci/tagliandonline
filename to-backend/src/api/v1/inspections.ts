import {type AuthRequest, middlewareAuthCheck} from "./auth.ts";
import {DatabaseManager, type DbTransactionType} from "../../db/databaseManager.ts";
import {inspectionChecks, inspections} from "../../db/schema.ts";
import {and, count, eq, gte, ilike, lte} from "drizzle-orm";
import {Router} from "express";
import {ConfigProvider} from "../../configProvider.ts";
import {getLastVehicleHistoryId} from "./vehicles.ts";
import {Mutex} from "../../utils/mutex.ts";
import {getLastVoucherHistoryId, getVoucherCurrentState, type VoucherCurrentState, vouchersRouter} from "./vouchers.ts";
import {type CachedVoucher, InspectionsManager} from "../../db/inspectionsManager.ts";
import {getPermitsList} from "./permits.ts";

export const inspectionsRouter = Router();

type InspectionCurrentState = "Pronta" | "In corso" | "Conclusa";

type InspectionListEntry = {
    id: number,
    startDate: Date,
    endDate: Date | null,
    description: string,
    currentState: InspectionCurrentState
}

export type VoucherHistory = {
    voucherId: number,
    number: number,
    revoked: boolean,
    currentState: VoucherCurrentState,
    validFromDate: Date,
    validToDate: Date,
    permitHistory: {
        permitId: number,
        description: string,
        disabled: boolean,
        simultaneousPlatesAmount: number,
        applicationPlatesAmount: number,
        voucherDurationDays: number | null,
        voucherExpiryDate: Date | null,
    },
};

export type InspectionCheck = {
    id: number,
    createdAt: Date,
    vehicleHistory: {
        vehicleId: number,
        plate: string,
        model: string,
        brand: string,
    },
    voucherHistory: VoucherHistory,
    checkedByAuthUser: {
        username: string,
        firstname: string,
        lastname: string
    },
};

export type InspectionDetails = {
    id: number,
    startDate: Date,
    endDate: Date | null,
    description: string,
    currentState: InspectionCurrentState,
    inspectionChecks: InspectionCheck[]
}

const getInspectionCurrentState = (startDate: Date, endDate: Date | null): InspectionCurrentState => {
    if (endDate != null) {
        return "Conclusa";
    } else if (new Date() < startDate) {
        return "Pronta";
    } else {
        return "In corso";
    }
}

inspectionsRouter.post("/list", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        return res.status(401).json({message: "Non autorizzato"});
    }

    const {
        idFrom,
        idTo,
        description,
        startDateFrom,
        startDateTo,
        endDateFrom,
        endDateTo,

        page,
    } = req.body;
    const db = DatabaseManager.instance.db;
    const resultsPerPage = ConfigProvider.instance.configs.resultsPerPage;

    const inspectionsCountConditions = [], inspectionsQueryConditions = [];

    // inspections filters
    if (idFrom != null && !isNaN(parseInt(idFrom))) {
        inspectionsCountConditions.push(gte(inspections.id, parseInt(idFrom)));
        inspectionsQueryConditions.push({id: {gte: idFrom}});
    }
    if (idTo != null && !isNaN(parseInt(idTo))) {
        inspectionsCountConditions.push(lte(inspections.id, parseInt(idTo)));
        inspectionsQueryConditions.push({id: {lte: idTo}});
    }
    if (description != null && description.trim() !== "") {
        inspectionsCountConditions.push(ilike(inspections.description, `%${description}%`));
        inspectionsQueryConditions.push({description: {ilike: `%${description}%`}});
    }
    if (startDateFrom != null && !isNaN(parseInt(startDateFrom))) {
        inspectionsCountConditions.push(gte(inspections.startDate, new Date(startDateFrom)));
        inspectionsQueryConditions.push({startDate: {gte: new Date(startDateFrom)}});
    }
    if (startDateTo != null && !isNaN(parseInt(startDateTo))) {
        inspectionsCountConditions.push(lte(inspections.startDate, new Date(startDateTo)));
        inspectionsQueryConditions.push({startDate: {lte: new Date(startDateTo)}});
    }
    if (endDateFrom != null && !isNaN(parseInt(endDateFrom))) {
        inspectionsCountConditions.push(gte(inspections.endDate, new Date(endDateFrom)));
        inspectionsQueryConditions.push({endDate: {gte: new Date(endDateFrom)}});
    }
    if (endDateTo != null && !isNaN(parseInt(endDateTo))) {
        inspectionsCountConditions.push(lte(inspections.endDate, new Date(endDateTo)));
        inspectionsQueryConditions.push({endDate: {lte: new Date(endDateTo)}});
    }

    // counting section
    const totalAmount = await db.select({count: count()}).from(inspections)
        .where(and(...inspectionsCountConditions));
    if (totalAmount == null || totalAmount.length !== 1 || totalAmount[0] == null) {
        return res.status(500).json({message: "Errore nel conteggio dei risultati"});
    }

    // query section
    const inspectionsArr = await db.query.inspections.findMany({
        where: {AND: [...inspectionsQueryConditions]},
        orderBy: {id: "desc"},
        offset: page != null ? (page - 1) * resultsPerPage : 0,
        limit: resultsPerPage,
    });
    if (inspectionsArr == null) {
        return res.status(500).json({message: "Errore nel reperire le ispezioni"});
    }
    const inspectionsList: InspectionListEntry[] = [];
    for (const inspection of inspectionsArr) {
        const currentState = getInspectionCurrentState(inspection.startDate, inspection.endDate);
        inspectionsList.push({
            id: inspection.id,
            startDate: inspection.startDate,
            endDate: inspection.endDate,
            description: inspection.description,
            currentState: currentState
        });
    }
    res.json({
        message: "Ispezioni acquisite con successo",
        inspectionsList: inspectionsList,
        pageData: {
            currentPage: page != null ? page : 1,
            totalPages: Math.ceil(totalAmount[0].count / resultsPerPage),
        }
    });
});


const getDetailedInspectionPaged = async (tx: DbTransactionType, inspectionID: number, page: number | null) => {
    const resultsPerPage = ConfigProvider.instance.configs.resultsPerPage;
    const totalAmount = await tx.select({count: count()}).from(inspectionChecks)
        .where(eq(inspectionChecks.inspectionId, inspectionID));
    if (totalAmount == null || totalAmount.length !== 1 || totalAmount[0] == null) {
        throw new Error("Errore nel conteggio dei risultati");
    }
    const inspection = await tx.query.inspections.findFirst({
        where: {
            id: inspectionID,
        },
        with: {
            inspectionChecks: {
                offset: page != null ? (page - 1) * resultsPerPage : 0,
                orderBy: {id: "desc"},
                with: {
                    checkedByAuthUser: true,
                    voucherHistory: {
                        with: {
                            permitHistory: true
                        }
                    },
                    vehicleHistory: true
                }
            }
        },
    });
    return {
        inspection: inspection,
        pageData: {
            currentPage: page != null ? page : 1,
            totalPages: Math.ceil(totalAmount[0].count / resultsPerPage),
        }
    };
}
type DetailedInspectionPagedQueryResult = Awaited<ReturnType<typeof getDetailedInspectionPaged>>;

export const getDetailedOngoingInspectionsFull = async (tx: DbTransactionType) => {
    const inspections = await tx.query.inspections.findMany({
        where: {
            endDate: {isNull: true},
        },
        with: {
            inspectionChecks: {
                orderBy: {id: "desc"},
                with: {
                    checkedByAuthUser: true,
                    voucherHistory: {
                        with: {
                            permitHistory: true
                        }
                    },
                    vehicleHistory: true
                }
            }
        },
        orderBy: {id: "desc"},
    });
    return inspections;
}
type DetailedOngoingInspectionsQueryResult = Awaited<ReturnType<typeof getDetailedOngoingInspectionsFull>>;

const getDetailedInspectionFull = async (tx: DbTransactionType, inspectionID: number) => {
    const inspection = await tx.query.inspections.findFirst({
        where: {
            id: inspectionID,
        },
        with: {
            inspectionChecks: {
                orderBy: {id: "desc"},
                with: {
                    checkedByAuthUser: true,
                    voucherHistory: {
                        with: {
                            permitHistory: true
                        }
                    },
                    vehicleHistory: true
                }
            }
        },
    });
    return inspection;
}
type DetailedInspectionQueryResult = Awaited<ReturnType<typeof getDetailedInspectionFull>>;

const getInspectionCheck = async (tx: DbTransactionType, inspectionCheckID: number) => {
    const inspectionCheck = await tx.query.inspectionChecks.findFirst({
        where: {
            id: inspectionCheckID,
        },
        with: {
            checkedByAuthUser: true,
            voucherHistory: {
                with: {
                    permitHistory: true
                }
            },
            vehicleHistory: true
        },
    });
    return inspectionCheck;
}
type InspectionCheckQueryResult = Awaited<ReturnType<typeof getInspectionCheck>>;

const getInspectionCheckDetails = (check: InspectionCheckQueryResult) => {
    if (check == null || check.vehicleHistory == null || check.checkedByAuthUser == null || check.voucherHistory == null || check.voucherHistory.permitHistory == null) {
        throw new Error("Errore nel reperire le associazioni di un rilievo");
    }
    const voucherCurrentState = getVoucherCurrentState(check.voucherHistory.revoked, check.voucherHistory.validFromDate, check.voucherHistory.validToDate);
    const inspectionCheck: InspectionCheck = {
        id: check.id,
        createdAt: check.createdAt,
        vehicleHistory: {
            vehicleId: check.vehicleHistory.id,
            plate: check.vehicleHistory.plate,
            model: check.vehicleHistory.model,
            brand: check.vehicleHistory.brand,
        },
        voucherHistory: {
            voucherId: check.voucherHistory.voucherId,
            number: check.voucherHistory.number,
            revoked: check.voucherHistory.revoked,
            currentState: voucherCurrentState,
            validFromDate: new Date(check.voucherHistory.validFromDate),
            validToDate: new Date(check.voucherHistory.validToDate),
            permitHistory: {
                permitId: check.voucherHistory.permitHistory.permitId,
                description: check.voucherHistory.permitHistory.description,
                disabled: check.voucherHistory.permitHistory.disabled,
                simultaneousPlatesAmount: check.voucherHistory.permitHistory.simultaneousPlatesAmount,
                applicationPlatesAmount: check.voucherHistory.permitHistory.applicationPlatesAmount,
                voucherDurationDays: check.voucherHistory.permitHistory.voucherDurationDays,
                voucherExpiryDate: check.voucherHistory.permitHistory.voucherExpiryDate == null ? null : new Date(check.voucherHistory.permitHistory.voucherExpiryDate),
            },
        },
        checkedByAuthUser: {
            username: check.checkedByAuthUser.username,
            firstname: check.checkedByAuthUser.firstname,
            lastname: check.checkedByAuthUser.lastname
        },
    };
    return inspectionCheck;
}

const getInspection = async (tx: DbTransactionType, inspectionID: number) => {
    const inspection = await tx.query.inspections.findFirst({
        where: {
            id: inspectionID,
        }
    });
    return inspection;
}
type InspectionQueryResult = Awaited<ReturnType<typeof getInspection>>;

const getInspectionDetails = (inspection: DetailedInspectionQueryResult) => {
    if (inspection == null) {
        throw new Error("Ispezione non trovata");
    }
    const currentState = getInspectionCurrentState(inspection.startDate, inspection.endDate);
    const inspectionDetails: InspectionDetails = {
        id: inspection.id,
        startDate: inspection.startDate,
        endDate: inspection.endDate,
        description: inspection.description,
        currentState: currentState,

        inspectionChecks: inspection.inspectionChecks == null ? [] : inspection.inspectionChecks.map((check) => {
            return getInspectionCheckDetails(check);
        }),
    };
    return inspectionDetails;
}

//utility per caricamento ispezioni allo startup
export const getOngoingInspectionsDetails = (inspections: DetailedOngoingInspectionsQueryResult) => {
    if (inspections == null) {
        throw new Error("Ispezioni non trovate");
    }
    const inspectionsDetails: InspectionDetails[] = [];
    for (const inspection of inspections) {
        const currentState = getInspectionCurrentState(inspection.startDate, inspection.endDate);
        inspectionsDetails.push({
            id: inspection.id,
            startDate: inspection.startDate,
            endDate: inspection.endDate,
            description: inspection.description,
            currentState: currentState,

            inspectionChecks: inspection.inspectionChecks == null ? [] : inspection.inspectionChecks.map((check) => {
                return getInspectionCheckDetails(check);
            }),
        });
    }
    return inspectionsDetails;
}

inspectionsRouter.post("/detail/:inspectionID", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    if (req.params.inspectionID == null || ("" + req.params.inspectionID).trim() == "" || isNaN(parseInt(req.params.inspectionID as string))) {
        res.status(400).json({message: "Ispezione non trovata"});
        return;
    }
    const inspectionID = parseInt(req.params.inspectionID as string);
    if (isNaN(inspectionID)) {
        res.status(400).json({message: "ID ispezione non valido"});
        return;
    }

    const {
        page,
    } = req.body;
    const db = DatabaseManager.instance.db;

    const detailsPagedObj = await db.transaction(async (tx) => {
        const detailedPagedInspectionQuery = await getDetailedInspectionPaged(tx, inspectionID, page);
        const inspectionPagedDetails = getInspectionDetails(detailedPagedInspectionQuery.inspection);
        let anomalies: CachedVoucher[] = [];
        if (inspectionPagedDetails.endDate == null) {
            //ongoing
            anomalies = await InspectionsManager.instance.getAnomaliesFromOngoingInspection(inspectionPagedDetails.id);
        } else {
            //ended
            const detailedFullInspectionQuery = await getDetailedInspectionFull(tx, inspectionID);
            const inspectionFullDetails = getInspectionDetails(detailedFullInspectionQuery);
            anomalies = InspectionsManager.getAnomaliesFromEndedInspection(inspectionFullDetails);
        }

        return {
            inspection: inspectionPagedDetails,
            anomalies: anomalies,
            pageData: detailedPagedInspectionQuery.pageData
        };
    });

    res.json({
        message: "Ispezione acquisita con successo",
        inspection: detailsPagedObj.inspection,
        anomalies: detailsPagedObj.anomalies,
        pageData: detailsPagedObj.pageData
    });
});

inspectionsRouter.post("/edit/:inspectionID", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    // const modifiedByAuthUserId = req.user.id;

    if (req.params.inspectionID == null || ("" + req.params.inspectionID).trim() == "" || isNaN(parseInt(req.params.inspectionID as string))) {
        res.status(400).json({message: "Ispezione non trovata"});
        return;
    }
    const inspectionID = parseInt(req.params.inspectionID as string);

    if (req.body.description == null || req.body.description.trim() === "" ||
        (req.body.reopen != null && ("" + req.body.reopen).trim() === "") ||
        (req.body.close != null && ("" + req.body.close).trim() === "")) {
        res.status(400).json({message: "Parametri di modifica non validi"});
        return;
    }
    if (req.body.reopen == null) {
        req.body.reopen = "false";
    }
    if (req.body.close == null) {
        req.body.close = "false";
    }
    req.body.reopen = req.body.reopen === "true";
    req.body.close = req.body.close === "true";

    const {
        description,
        reopen,
        close,
    } = req.body;

    const db = DatabaseManager.instance.db;
    try {
        const toUpdateInspection = await db.query.inspections.findFirst({
            where: {id: inspectionID}
        });
        if (toUpdateInspection == null) {
            res.status(500).json({message: "Ispezione non trovata"});
            return;
        }

        // controllare che non ci siano campi da aggiornare
        let parametersNeedUpdate = true;
        if (description === toUpdateInspection.description) {
            parametersNeedUpdate = false;
        }
        let toggleEndStatus = true;
        if ((reopen === true && close === false && toUpdateInspection.endDate == null) ||
            (reopen === false && close === true && toUpdateInspection.endDate != null) ||
            (reopen === false && close === false)) {
            toggleEndStatus = false;
        }
        // se non ci sono parametri da aggiornare esco subito
        if (!parametersNeedUpdate && !toggleEndStatus) {
            res.status(200).json({message: "Nessuna modifica effettuata"});
            return;
        }

        await db.transaction(async (tx) => {
            return await inspectionsApiMutex.runExclusive(async () => {
                const updatedInspection = await tx.update(inspections).set({
                    description: description,
                    ...((toggleEndStatus && toUpdateInspection.endDate != null) ? {endDate: null} : {endDate: new Date()}),
                }).where(eq(inspections.id, inspectionID)).returning();
                if (updatedInspection == null || updatedInspection.length !== 1 || updatedInspection[0] == null) {
                    throw new Error("Errore durante l'aggiornamento dell'ispezione");
                }
                if (toggleEndStatus) {
                    if (updatedInspection[0].endDate == null) {
                        const inspectionQuery = await getDetailedInspectionFull(tx, inspectionID);
                        const inspectionDetails = getInspectionDetails(inspectionQuery);
                        await InspectionsManager.instance.addInspectionToMap(inspectionDetails);
                    } else {
                        await InspectionsManager.instance.removeInspectionFromMap(toUpdateInspection.id);
                    }
                }
            });
        });
        // if (inspectionDetails == null) {
        //     res.status(500).json({message: "Errore durante l'aggiornamento dell'ispezione"});
        //     return;
        // }
        res.status(200).json({
            message: "Ispezione aggiornata con successo",
            // inspectionDetails: inspectionDetails
        });
        return;
    } catch (e) {
        res.status(500).json({message: "Errore durante l'aggiornamento dell'ispezione: " + e});
        return;
    }
});

inspectionsRouter.post("/new", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    // const modifiedByAuthUserId = req.user.id;

    if (req.body.description == null || req.body.description.trim() === "") {
        //req.body.startDate == null || new Date(req.body.startDate).toString() === "Invalid Date" ||
        res.status(400).json({message: "Parametri di creazione non validi"});
        return;
    }

    const {
        //startDate,
        description
    } = req.body;

    const db = DatabaseManager.instance.db;
    try {
        const createdInspectionId = await db.transaction(async (tx) => {
            return await inspectionsApiMutex.runExclusive(async () => {
                const createdInspection = await tx.insert(inspections).values({
                    //startDate: startDate,
                    description: description
                }).returning();
                if (createdInspection == null || createdInspection.length !== 1 || createdInspection[0] == null) {
                    throw new Error("Creazione ispezione fallita: " + JSON.stringify(createdInspection));
                }
                await InspectionsManager.instance.addNewInspectionToMap(createdInspection[0].id);
                return createdInspection[0].id;
            });
        });
        if (createdInspectionId == null) {
            res.status(500).json({message: "Errore durante l'inserimento dell'ispezione"});
            return;
        }
        res.status(200).json({
            message: "Ispezione creata con successo",
            id: createdInspectionId
        });
        return;
    } catch (e) {
        res.status(500).json({message: "Errore durante la creazione dell'ispezione: " + e});
        return;
    }
});

inspectionsRouter.post("/addCheck/:inspectionID", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    const modifiedByAuthUserId = req.user.id;

    if (req.params.inspectionID == null || ("" + req.params.inspectionID).trim() == "" || isNaN(parseInt(req.params.inspectionID as string))) {
        res.status(400).json({message: "Ispezione non trovata"});
        return;
    }
    const inspectionID = parseInt(req.params.inspectionID as string);
    if (req.body.vehicleId == null || isNaN(parseInt(req.body.vehicleId)) ||
        req.body.voucherId == null || isNaN(parseInt(req.body.voucherId))) {
        res.status(400).json({message: "Parametri di creazione non validi"});
        return;
    }

    const {
        vehicleId,
        voucherId
    } = req.body;

    const db = DatabaseManager.instance.db;
    try {
        const createdInspectionInfo = await db.transaction(async (tx) => {
            const lastVehicleHistoryId = await getLastVehicleHistoryId(tx, vehicleId);
            const lastVoucherHistoryId = await getLastVoucherHistoryId(tx, voucherId);

            return await inspectionsApiMutex.runExclusive(async () => {
                const inspection = await getInspection(tx, inspectionID);
                if (inspection == null || inspection.endDate != null) {
                    throw new Error("Ispezione non trovata o già conclusa");
                }
                const createdInspectionCheck = await tx.insert(inspectionChecks).values({
                    inspectionId: inspectionID,
                    vehicleHistoryId: lastVehicleHistoryId,
                    voucherHistoryId: lastVoucherHistoryId,
                    checkedByAuthUserId: modifiedByAuthUserId
                }).returning();
                if (createdInspectionCheck == null || createdInspectionCheck.length !== 1 || createdInspectionCheck[0] == null) {
                    throw new Error("Creazione ispezione fallita: " + JSON.stringify(createdInspectionCheck));
                }
                const inspectionCheckQuery = await getInspectionCheck(tx, createdInspectionCheck[0].id);
                const inspectionCheckDetails = getInspectionCheckDetails(inspectionCheckQuery);
                const anomaly = await InspectionsManager.instance.addCheckToInspection(inspectionCheckDetails, inspectionID);
                return {
                    createdInspectionId: createdInspectionCheck[0].id,
                    anomaly: anomaly
                };
            });
        });
        if (createdInspectionInfo == null) {
            res.status(500).json({message: "Errore durante l'inserimento del rilievo"});
            return;
        }
        res.status(200).json({
            message: "Rilievo inserito con successo",
            id: createdInspectionInfo.createdInspectionId,
            anomaly: createdInspectionInfo.anomaly
        });
        return;
    } catch (e) {
        res.status(500).json({message: "Errore durante la creazione del rilievo: " + e});
        return;
    }
});

inspectionsRouter.get("/deleteCheck/:inspectionCheckID", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    // const modifiedByAuthUserId = req.user.id;
    if (req.params.inspectionCheckID == null || ("" + req.params.inspectionCheckID).trim() == "" || isNaN(parseInt(req.params.inspectionCheckID as string))) {
        res.status(400).json({message: "Rilievo non trovata"});
        return;
    }
    const inspectionCheckID = parseInt(req.params.inspectionCheckID as string);

    const db = DatabaseManager.instance.db;
    try {
        await db.transaction(async (tx) => {
            return await inspectionsApiMutex.runExclusive(async () => {
                const toDeleteInspectionCheck = await getInspectionCheck(tx, inspectionCheckID);
                const toDeleteInspectionCheckDetails = getInspectionCheckDetails(toDeleteInspectionCheck);
                if (toDeleteInspectionCheck == null) {
                    throw new Error("Impossibile trovare il rilievo");
                }
                const inspection = await getInspection(tx, toDeleteInspectionCheck.inspectionId);
                if (inspection == null || inspection.endDate != null) {
                    throw new Error("Ispezione non trovata o già conclusa");
                }
                const deleteResult = await tx.delete(inspectionChecks).where(eq(inspectionChecks.id, inspectionCheckID));
                if (deleteResult == null || deleteResult.rowCount !== 1) {
                    throw new Error("Errore durante l'eliminazione del rilievo");
                }
                await InspectionsManager.instance.removeCheckFromInspection(
                    toDeleteInspectionCheckDetails.id,
                    toDeleteInspectionCheckDetails.voucherHistory.voucherId,
                    toDeleteInspectionCheck.inspectionId
                );
            });
        });
        res.status(200).json({
            message: "Rilievo eliminato con successo"
        });
        return;
    } catch (e) {
        res.status(500).json({message: "Errore durante l'eliminazione del rilievo: " + e});
        return;
    }
});

const inspectionsApiMutex = new Mutex();

inspectionsRouter.get("/availableOptions", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
        if (req.user == null) {
            return res.status(401).json({message: "Non autorizzato"});
        }
        const db = DatabaseManager.instance.db;
        try {
            const permitsList = await getPermitsList(false);
            if (permitsList == null) {
                res.status(500).json({message: "Errore nel reperire elenco dei permessi"});
                return;
            }

            res.status(200).json({
                message: "Permessi acquisiti con successo",
                permits: permitsList
            });
        } catch (e) {
            res.status(500).json({message: "Errore nel reperire permessi: " + e});
        }
    }
);


