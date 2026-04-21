import {type AuthRequest, middlewareAuthCheck} from "./auth.ts";
import {DatabaseManager, type DbTransactionType} from "../../db/databaseManager.ts";
import type {HistoryEvent, HistoryModificationMap} from "../../utils/commonTypes.ts";
import {checkAndUpdateValueModificationsMap} from "../../utils/commonFunctions.ts";
import {
    applications,
    applicationsToVehicles, inspectionChecks, inspections,
    vehicles,
    vouchers,
    vouchersEmailsHistory,
    vouchersHistory,
    vouchersHistoryToVehiclesHistory,
    vouchersToVehicles
} from "../../db/schema.ts";
import {and, count, desc, eq, exists, gte, ilike, lte} from "drizzle-orm";
import {Router} from "express";
import {ConfigProvider} from "../../configProvider.ts";
import {getVoucherNumerationNewData} from "./numerations.ts";
import {getLastVehicleHistoryId} from "./vehicles.ts";
import {getPermit, getPermitsList} from "./permits.ts";
import {adjustPathForDownload} from "./downloadFile.ts";
import {
    deleteFileByPath,
    deleteFilesFields,
    type FileFieldsType,
    getFileFromMulterFields,
    uploadVouchersMulter
} from "../../files/filesStorages.ts";
import {
    generateEmailFromTemplate,
    generateVoucherDocumentFromTemplate,
    type VoucherTemplateData
} from "../../reportsGeneration.ts";
import {convertPDF} from "../../pdfConversion.ts";
import {Mutex} from "../../utils/mutex.ts";
import {SmtpManager} from "../../smtpManager.ts";
import path from "node:path";
import {existsSync} from "node:fs";
import {getVoucherCurrentState} from "./vouchers.ts";

export const inspectionsRouter = Router();

type InspectionCurrentState = "Pronta" | "In corso" | "Conclusa";

type InspectionListEntry = {
    id: number,
    startDate: Date,
    endDate: Date | null,
    description: string,
    currentState: InspectionCurrentState
}

type InspectionCheck = {
    id: number,
    createdAt: Date,
    vehicleHistory: {
        vehicleId: number,
        plate: string,
        model: string,
        brand: string,
    },
    voucherHistory: {
        voucherId: number,
        number: number,
        revoked: boolean,
        currentState: string,
        validFromDate: Date,
        validToDate: Date,
        permitHistory: {
            permitId: number,
            description: string,
            disabled: boolean,
            simultaneousPlatesAmount: number,
            applicationPlatesAmount: number,
            voucherDurationDays: number
        },
    },
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

type InspectionDetailsAnomalies = InspectionDetails & {
    anomalyInspectionChecks: InspectionCheck[]
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
        page,
    } = req.body;
    const db = DatabaseManager.instance.db;
    const resultsPerPage = ConfigProvider.instance.configs.resultsPerPage;

    const totalAmount = await db.select({count: count()}).from(inspections);
    if (totalAmount == null || totalAmount.length !== 1 || totalAmount[0] == null) {
        return res.status(500).json({message: "Errore nel conteggio dei risultati"});
    }

    // query section
    const inspectionsArr = await db.query.inspections.findMany({
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

export const getDetailedOngoingInspectionFull = async (tx: DbTransactionType) => {
    const inspections = await tx.query.inspections.findMany({
        where: {
            endDate: {isNotNull: true},
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
type DetailedOngoingInspectionsQueryResult = Awaited<ReturnType<typeof getDetailedOngoingInspectionFull>>;

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
            if (check == null || check.vehicleHistory == null || check.checkedByAuthUser == null || check.voucherHistory == null || check.voucherHistory.permitHistory == null) {
                throw new Error("Errore nel reperire le associazioni di un rilievo");
            }
            const voucherCurrentState = getVoucherCurrentState(check.voucherHistory.revoked, check.voucherHistory.validFromDate, check.voucherHistory.validToDate);

            return {
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
                        voucherDurationDays: check.voucherHistory.permitHistory.voucherDurationDays
                    },
                },
                checkedByAuthUser: {
                    username: check.checkedByAuthUser.username,
                    firstname: check.checkedByAuthUser.firstname,
                    lastname: check.checkedByAuthUser.lastname
                },
            }}),
    };
    return inspectionDetails;
}

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
                if (check == null || check.vehicleHistory == null || check.checkedByAuthUser == null || check.voucherHistory == null || check.voucherHistory.permitHistory == null) {
                    throw new Error("Errore nel reperire le associazioni di un rilievo");
                }
                const voucherCurrentState = getVoucherCurrentState(check.voucherHistory.revoked, check.voucherHistory.validFromDate, check.voucherHistory.validToDate);
                return {
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
                            voucherDurationDays: check.voucherHistory.permitHistory.voucherDurationDays
                        },
                    },
                    checkedByAuthUser: {
                        username: check.checkedByAuthUser.username,
                        firstname: check.checkedByAuthUser.firstname,
                        lastname: check.checkedByAuthUser.lastname
                    },
                }}),
        });
    }
    return inspectionsDetails;
}

const getInspectionPagedDetails = (inspectionData: DetailedInspectionPagedQueryResult) => {
    if (inspectionData == null || inspectionData.inspection == null || inspectionData.pageData == null) {
        throw new Error("Ispezione non trovata");
    }
    const inspectionDetails = getInspectionDetails(inspectionData.inspection);
    return {
        inspection: inspectionDetails,
        pageData: inspectionData.pageData
    };
}

const updateVoucherHistory = async (tx: DbTransactionType, voucher: VoucherQueryResult, vehicles: number[], modifiedByAuthUserId: number, permitLastHistoryID: number | null = null) => {
    if (voucher == null) {
        throw new Error("Errore nel reperire il tagliando in fase di aggiornamento dello storico");
    }

    let permitLastHistoryId: number = 0;
    if (permitLastHistoryID == null) {
        const permit = await getPermit(tx, voucher.permitId);
        if (permit == null || permit.lastPermitHistoryId == null) {
            throw new Error("Errore nel reperire il permesso del tagliando in fase di aggiornamento dello storico");
        }
        permitLastHistoryId = permit.lastPermitHistoryId;
    } else {
        permitLastHistoryId = permitLastHistoryID;
    }

    const updatedVoucherHistory = await tx.insert(vouchersHistory).values({
        voucherId: voucher.id,
        modifiedByAuthUserId: modifiedByAuthUserId,

        number: voucher.number,
        revoked: voucher.revoked,
        validFromDate: voucher.validFromDate,
        validToDate: voucher.validToDate,
        notes: voucher.notes,
        permitHistoryId: permitLastHistoryId,
        generatedVoucherTemplatePath: voucher.generatedVoucherTemplatePath,
        generatedAuthorizationTemplatePath: voucher.generatedAuthorizationTemplatePath,
        generatedVoucherPdfPath: voucher.generatedVoucherPdfPath,
        generatedAuthorizationPdfPath: voucher.generatedAuthorizationPdfPath,
        signedAuthorizationPath: voucher.signedAuthorizationPath,
    }).returning();
    if (updatedVoucherHistory == null || updatedVoucherHistory.length !== 1 || updatedVoucherHistory[0] == null) {
        throw new Error("Errore durante l'aggiornamento dello storico del tagliando");
    }
    const updatedVoucherHistoryId = updatedVoucherHistory[0].id;
    const updateResult = await tx.update(vouchers)
        .set({lastVoucherHistoryId: updatedVoucherHistoryId})
        .where(eq(vouchers.id, voucher.id));
    if (updateResult == null || updateResult.rowCount !== 1) {
        throw new Error("Errore durante l'aggiornamento del tagliando con lo storico");
    }
    const vehiclesToInsertVoucherHistory: {
        voucherHistoryId: number,
        vehicleHistoryId: number
    }[] = [];
    for (const vehicleId of vehicles) {
        const vehicleHistoryId = await getLastVehicleHistoryId(tx, vehicleId);
        vehiclesToInsertVoucherHistory.push({
            voucherHistoryId: updatedVoucherHistoryId,
            vehicleHistoryId: vehicleHistoryId,
        });
    }
    const insertVSVSResult = await tx.insert(vouchersHistoryToVehiclesHistory).values(vehiclesToInsertVoucherHistory);
    if (insertVSVSResult == null || insertVSVSResult.rowCount !== vehicles.length) {
        throw new Error("Errore durante l'aggiornamento delle associazioni tra storico tagliando e storico veicoli");
    }
    return updatedVoucherHistoryId;
}

vouchersRouter.get("/byID/:voucherID", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    if (req.params.voucherID == null || ("" + req.params.voucherID).trim() == "") {
        res.status(400).json({message: "Tagliando non trovato"});
        return;
    }
    const voucherID = parseInt(req.params.voucherID as string);
    if (isNaN(voucherID)) {
        res.status(400).json({message: "ID tagliando non valido"});
        return;
    }

    const db = DatabaseManager.instance.db;
    const voucher = await db.query.vouchers.findFirst({
        where: {
            id: voucherID
        },
        with: {
            vehicles: true,
            applications: {
                orderBy: {outcomeDate: "desc", id: "desc"}, // choose application with most recent outcomeDate or ID
            },
            permit: true,
            emails: true
        }
    });
    if (voucher == null || voucher.permit == null) {
        return res.status(500).json({message: "Errore nel reperire il tagliando"});
    }
    const currentState = getVoucherCurrentState(voucher.revoked, voucher.validFromDate, voucher.validToDate);
    const voucherEntry: VoucherListEntry = {
        id: voucher.id,
        createdAt: voucher.createdAt,
        updatedAt: voucher.updatedAt,

        number: voucher.number,
        revoked: voucher.revoked,
        currentState: currentState,
        validFromDate: new Date(voucher.validFromDate),
        validToDate: new Date(voucher.validToDate),

        applications: voucher.applications.map(a => ({
            id: a.id,
            registerNumber: a.registerNumber,
            registerDate: new Date(a.registerDate),
            cf: a.cf ?? "",
            firstname: a.firstname,
            lastname: a.lastname,
            email: a.email,
            targetHousePlace: a.targetHousePlace,
            targetHouseLandRegistrySheet: a.targetHouseLandRegistrySheet,
            targetHouseLandRegistryMap: a.targetHouseLandRegistryMap,
            targetHouseLandRegistrySubaltern: a.targetHouseLandRegistrySubaltern,
            targetHouseLandRegistryCategory: a.targetHouseLandRegistryCategory
        })),

        permit: {
            id: voucher.permit.id,
            description: voucher.permit.description,
            disabled: voucher.permit.disabled,
        },
        // emails: voucher.emails.map(e => ({
        //     id: e.id,
        //     to: e.to,
        //     subject: e.subject,
        //     attachmentsPresent: e.attachments != null && e.attachments.length > 0,
        // })),
        vehicles: voucher.vehicles.map(v => ({
            id: v.id,
            createdAt: v.createdAt,
            updatedAt: v.updatedAt,
            plate: v.plate,
            model: v.model,
            brand: v.brand,
        })),
    };


    res.json({
        message: "Tagliando acquisito con successo",
        voucher: voucherEntry
    });
});

vouchersRouter.get("/detail/:voucherID", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    if (req.params.voucherID == null || ("" + req.params.voucherID).trim() == "") {
        res.status(400).json({message: "Tagliando non trovato"});
        return;
    }
    const voucherID = parseInt(req.params.voucherID as string);
    if (isNaN(voucherID)) {
        res.status(400).json({message: "ID tagliando non valido"});
        return;
    }

    const db = DatabaseManager.instance.db;
    const voucherDetails = await db.transaction(async (tx) => {
        const detailedVoucherQuery = await getDetailedVoucher(tx, voucherID);
        return await getVoucherDetails(detailedVoucherQuery);
    });

    res.json({
        message: "Tagliando acquisito con successo",
        voucher: voucherDetails
    });
});

vouchersRouter.get("/check/:voucherID", async (req, res) => {
    // if (req.user == null) {
    //     res.status(401).json({message: "Non autorizzato"});
    //     return;
    // }
    if (req.params.voucherID == null || ("" + req.params.voucherID).trim() == "") {
        res.status(400).json({message: "Tagliando non trovato"});
        return;
    }
    const voucherID = parseInt(req.params.voucherID as string);
    if (isNaN(voucherID)) {
        res.status(400).json({message: "ID tagliando non valido"});
        return;
    }

    const db = DatabaseManager.instance.db;
    const voucher = await db.query.vouchers.findFirst({
        where: {
            id: voucherID,
        },
        with: {
            vehicles: true,
            permit: true
        },
    });
    if (voucher == null) {
        res.status(500).json({message: "Tagliando non trovato"});
        return;
    }
    if (voucher.permit == null) {
        res.status(500).json({message: "Errore nel reperire le associazioni del tagliando"});
        return;
    }

    const currentState = getVoucherCurrentState(voucher.revoked, voucher.validFromDate, voucher.validToDate);

    const voucherPublicCheck: VoucherPublicCheck = {
        id: voucher.id,
        createdAt: voucher.createdAt,
        updatedAt: voucher.updatedAt,
        number: voucher.number,
        revoked: voucher.revoked,
        currentState: currentState,
        validFromDate: new Date(voucher.validFromDate),
        validToDate: new Date(voucher.validToDate),
        permit: {
            id: voucher.permit.id,
            description: voucher.permit.description,
            disabled: voucher.permit.disabled,
            simultaneousPlatesAmount: voucher.permit.simultaneousPlatesAmount,
            applicationPlatesAmount: voucher.permit.applicationPlatesAmount,
            voucherDurationDays: voucher.permit.voucherDurationDays
        },
        vehicles: voucher.vehicles.map(v => ({
            id: v.id,
            createdAt: v.createdAt,
            updatedAt: v.updatedAt,
            plate: v.plate,
            model: v.model,
            brand: v.brand,
        })),
    };

    res.json({
        message: "Tagliando acquisito con successo",
        voucherPublicCheck: voucherPublicCheck
    });
});

vouchersRouter.get("/history/:voucherID", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    if (req.params.voucherID == null || ("" + req.params.voucherID).trim() == "") {
        res.status(400).json({message: "Tagliando non trovato"});
        return;
    }
    const voucherID = parseInt(req.params.voucherID as string);
    if (isNaN(voucherID)) {
        res.status(400).json({message: "ID tagliando non valido"});
        return;
    }

    try {
        const db = DatabaseManager.instance.db;
        const voucherHistory = await db.query.vouchersHistory.findMany(
            {
                where: {
                    voucherId: voucherID,
                },
                with: {
                    vehiclesHistory: true,
                    applicationsHistory: {
                        with: {
                            outcome: true,
                            type: true,
                            outcomeAuthUser: true
                        }
                    },
                    permitHistory: true,
                    modifiedByAuthUser: true
                },
                orderBy: {createdAt: "asc"},
            });
        if (voucherHistory == null || voucherHistory.length === 0) {
            res.status(500).json({message: "Storico tagliando non trovato"});
            return;
        }

        const voucherHistoryRes: HistoryEvent[] = [];
        const currModificationEntries: HistoryModificationMap = {};
        voucherHistory.forEach((historyElem) => {
            const diffModificationEntries: HistoryModificationMap = {};

            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "number", {
                description: "Numero",
                value: "" + historyElem.number
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "revoked", {
                description: "Revocato",
                value: "" + historyElem.revoked
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "validFromDate", {
                description: "Valido da",
                value: historyElem.validFromDate
            });

            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "validToDate", {
                description: "Valido fino al",
                value: historyElem.validToDate
            });

            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "notes", {
                description: "Note",
                value: historyElem.notes
            });

            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "generatedVoucherTemplatePath", {
                description: "Modello tagliando generato",
                value: "" + historyElem.generatedVoucherTemplatePath
            });

            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "generatedAuthorizationTemplatePath", {
                description: "Modello autorizzazione generato",
                value: "" + historyElem.generatedAuthorizationTemplatePath
            });

            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "generatedVoucherPdfPath", {
                description: "PDF tagliando generato",
                value: "" + historyElem.generatedVoucherPdfPath
            });

            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "generatedAuthorizationPdfPath", {
                description: "PDF autorizzazione generato",
                value: "" + historyElem.generatedAuthorizationPdfPath
            });

            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "signedAuthorizationPath", {
                description: "Autorizzazione firmata",
                value: "" + historyElem.signedAuthorizationPath
            });

            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "permitHistory", {
                description: "Permesso",
                value: historyElem.permitHistory != null ? historyElem.permitHistory.description : ""
            });

            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "vehicles", {
                description: "Veicoli",
                value: "" + historyElem.vehiclesHistory != null ? ("[" + historyElem.vehiclesHistory.map((v) => v.vehicleId + ": " + v.plate + ", " + v.model + ", " + v.brand).join("; ") + "]") : ""
            });

            historyElem.applicationsHistory.forEach((applicationHistoryElem) => {
                checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "registerNumber", {
                    description: applicationHistoryElem.applicationId + " - Numero protocollo",
                    value: "" + applicationHistoryElem.registerNumber
                });
                checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "registerDate", {
                    description: applicationHistoryElem.applicationId + " - Data protocollo",
                    value: applicationHistoryElem.registerDate != null ? applicationHistoryElem.registerDate : ""
                });
                checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "cf", {
                    description: applicationHistoryElem.applicationId + " - CF",
                    value: applicationHistoryElem.cf != null ? applicationHistoryElem.cf : ""
                });
                checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "firstname", {
                    description: applicationHistoryElem.applicationId + " - Nome",
                    value: applicationHistoryElem.firstname
                });
                checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "lastname", {
                    description: applicationHistoryElem.applicationId + " - Cognome",
                    value: applicationHistoryElem.lastname
                });
                checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "email", {
                    description: applicationHistoryElem.applicationId + " - Email",
                    value: applicationHistoryElem.email
                });
                checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "outcome", {
                    description: applicationHistoryElem.applicationId + " - Esito",
                    value: applicationHistoryElem.outcome != null ? applicationHistoryElem.outcome.description : ""
                });
                checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "type", {
                    description: applicationHistoryElem.applicationId + " - Tipo",
                    value: applicationHistoryElem.type != null ? applicationHistoryElem.type.description : ""
                });
                checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "targetHousePlace", {
                    description: applicationHistoryElem.applicationId + "Luogo abitazione designata",
                    value: applicationHistoryElem.targetHousePlace != null ? applicationHistoryElem.targetHousePlace : ""
                });
            });

            voucherHistoryRes.push({
                userId: historyElem.modifiedByAuthUser ? historyElem.modifiedByAuthUser.id : 0,
                username: historyElem.modifiedByAuthUser ? historyElem.modifiedByAuthUser.username : "unknown",
                timestamp: historyElem.createdAt,
                modificationsMap: diffModificationEntries
            });
        });

        res.status(200).json({
            message: "Storico del tagliando acquisito con successo",
            voucherHistory: voucherHistoryRes
        });
    } catch (e) {
        res.status(500).json({message: "Errore nel reperire lo storico della domanda: " + e});
        return;
    }
});

vouchersRouter.get("/generateTemplates/:voucherID", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    if (req.params.voucherID == null || ("" + req.params.voucherID).trim() == "") {
        res.status(400).json({message: "Tagliando non trovato"});
        return;
    }
    const voucherID = parseInt(req.params.voucherID as string);
    if (isNaN(voucherID)) {
        res.status(400).json({message: "ID tagliando non valido"});
        return;
    }

    let generatedVoucherTemplatePath: string | undefined = undefined;
    let generatedAuthorizationTemplatePath: string | undefined = undefined;
    try {
        const db = DatabaseManager.instance.db;
        const modifiedByAuthUserId = req.user.id;
        const updatedVoucherDetails = await db.transaction(async (tx) => {
            const detailedVoucherQuery = await getDetailedVoucher(tx, voucherID);
            if (detailedVoucherQuery == null) {
                throw new Error("Tagliando non trovato");
            }
            const newTemplatesPaths = await generateTemplates(detailedVoucherQuery);
            generatedVoucherTemplatePath = newTemplatesPaths.generatedVoucherTemplatePath;
            generatedAuthorizationTemplatePath = newTemplatesPaths.generatedAuthorizationTemplatePath;
            const updatedVoucherResult = await tx.update(vouchers).set({
                ...(generatedVoucherTemplatePath !== null && {generatedVoucherTemplatePath: generatedVoucherTemplatePath}),
                ...(generatedAuthorizationTemplatePath !== null && {generatedAuthorizationTemplatePath: generatedAuthorizationTemplatePath}),
            }).where(eq(vouchers.id, voucherID));
            if (updatedVoucherResult == null || updatedVoucherResult.rowCount !== 1) {
                throw new Error("Errore durante l'aggiornamento del tagliando");
            }
            detailedVoucherQuery.generatedVoucherTemplatePath = generatedVoucherTemplatePath;
            detailedVoucherQuery.generatedAuthorizationTemplatePath = generatedAuthorizationTemplatePath;
            const voucherDetails = await getVoucherDetails(detailedVoucherQuery);
            const updatedVoucherHistoryId = await updateVoucherHistory(tx, detailedVoucherQuery,
                voucherDetails.vehicles.map(v => v.id), modifiedByAuthUserId);
            return voucherDetails;
        });
        if (updatedVoucherDetails == null) {
            res.status(500).json({message: "Errore durante l'aggiornamento del tagliando"});
            deleteFileByPath(generatedVoucherTemplatePath);
            deleteFileByPath(generatedAuthorizationTemplatePath);
            return;
        }
        res.status(200).json({
            message: "Modelli generati con successo",
            voucherDetails: updatedVoucherDetails,
            needPdfConversion: true
        });
    } catch (e) {
        res.status(500).json({message: "Errore nella generazione dei modelli: " + e});
        deleteFileByPath(generatedVoucherTemplatePath);
        deleteFileByPath(generatedAuthorizationTemplatePath);
        return;
    }
});

vouchersRouter.post("/upload/:voucherID", middlewareAuthCheck(["admin", "operatore"]),
    uploadVouchersMulter.fields([
        {name: "generatedVoucherTemplate", maxCount: 1},
        {name: "generatedAuthorizationTemplate", maxCount: 1},
        {name: "signedAuthorization", maxCount: 1}
    ]),
    async (req: AuthRequest, res) => {
        if (req.user == null) {
            res.status(401).json({message: "Non autorizzato"});
            return;
        }
        const modifiedByAuthUserId = req.user.id;

        if (req.params.voucherID == null || ("" + req.params.voucherID).trim() == "") {
            res.status(400).json({message: "Tagliando non trovato"});
            return;
        }
        const voucherID = parseInt(req.params.voucherID as string);

        const reqFilesFields = req.files as unknown as FileFieldsType;
        if ((reqFilesFields["generatedVoucherTemplate"] == null || reqFilesFields["generatedVoucherTemplate"].length === 0) &&
            (reqFilesFields["generatedAuthorizationTemplate"] == null || reqFilesFields["generatedAuthorizationTemplate"].length === 0) &&
            (reqFilesFields["signedAuthorization"] == null || reqFilesFields["signedAuthorization"].length === 0)) {
            res.status(200).json({message: "Nessuna modifica effettuata"});
            return;
        }
        const generatedVoucherTemplate = getFileFromMulterFields(reqFilesFields, "generatedVoucherTemplate");
        const generatedAuthorizationTemplate = getFileFromMulterFields(reqFilesFields, "generatedAuthorizationTemplate");
        const signedAuthorization = getFileFromMulterFields(reqFilesFields, "signedAuthorization");
        const needPdfConversion = generatedVoucherTemplate != null || generatedAuthorizationTemplate != null;
        const db = DatabaseManager.instance.db;
        try {
            const updatedVoucherDetails = await db.transaction(async (tx) => {
                const updatedVoucherResult = await tx.update(vouchers).set({
                    ...(generatedVoucherTemplate !== null && {generatedVoucherTemplatePath: generatedVoucherTemplate.path}),
                    ...(generatedAuthorizationTemplate !== null && {generatedAuthorizationTemplatePath: generatedAuthorizationTemplate.path}),
                    ...(signedAuthorization !== null && {signedAuthorizationPath: signedAuthorization.path})
                }).where(eq(vouchers.id, voucherID));
                if (updatedVoucherResult == null || updatedVoucherResult.rowCount !== 1) {
                    throw new Error("Errore durante l'aggiornamento del tagliando");
                }
                const detailedVoucherQuery = await getDetailedVoucher(tx, voucherID);
                if (detailedVoucherQuery == null) {
                    throw new Error("Tagliando non trovato");
                }
                const voucherDetails = await getVoucherDetails(detailedVoucherQuery);
                const updatedVoucherHistoryId = await updateVoucherHistory(tx, detailedVoucherQuery,
                    voucherDetails.vehicles.map(v => v.id), modifiedByAuthUserId);
                return voucherDetails;
            });
            if (updatedVoucherDetails == null) {
                res.status(500).json({message: "Errore durante l'aggiornamento del tagliando"});
                deleteFilesFields(reqFilesFields);
                return;
            }
            res.status(200).json({
                message: "File caricati con successo",
                voucherDetails: updatedVoucherDetails,
                needPdfConversion: needPdfConversion
            });

            return;
        } catch (e) {
            res.status(500).json({message: "Errore durante l'aggiornamento del tagliando: " + e});
            deleteFilesFields(reqFilesFields);
            return;
        }


    });


vouchersRouter.get("/convertPDFs/:voucherID", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    if (req.params.voucherID == null || ("" + req.params.voucherID).trim() == "") {
        res.status(400).json({message: "Tagliando non trovato"});
        return;
    }
    const voucherID = parseInt(req.params.voucherID as string);
    if (isNaN(voucherID)) {
        res.status(400).json({message: "ID tagliando non valido"});
        return;
    }

    let generatedVoucherPdfPath: string | undefined = undefined;
    let generatedAuthorizationPdfPath: string | undefined = undefined;
    try {
        const db = DatabaseManager.instance.db;
        const modifiedByAuthUserId = req.user.id;
        const updatedVoucherDetails = await db.transaction(async (tx) => {
            const detailedVoucherQuery = await getDetailedVoucher(tx, voucherID);
            if (detailedVoucherQuery == null) {
                throw new Error("Tagliando non trovato");
            }
            if (detailedVoucherQuery.generatedVoucherTemplatePath == null || detailedVoucherQuery.generatedAuthorizationTemplatePath == null) {
                throw new Error("Modello tagliando o autorizzazione non trovati");
            }
            const newPDFPaths = await convertVoucherPDF(detailedVoucherQuery.generatedVoucherTemplatePath, detailedVoucherQuery.generatedAuthorizationTemplatePath);
            generatedVoucherPdfPath = newPDFPaths.generatedVoucherPdfPath;
            generatedAuthorizationPdfPath = newPDFPaths.generatedAuthorizationPdfPath;
            const updatedVoucherResult = await tx.update(vouchers).set({
                ...(generatedVoucherPdfPath !== null && {generatedVoucherPdfPath: generatedVoucherPdfPath}),
                ...(generatedAuthorizationPdfPath !== null && {generatedAuthorizationPdfPath: generatedAuthorizationPdfPath}),
            }).where(eq(vouchers.id, voucherID));
            if (updatedVoucherResult == null || updatedVoucherResult.rowCount !== 1) {
                throw new Error("Errore durante l'aggiornamento del tagliando");
            }
            detailedVoucherQuery.generatedVoucherPdfPath = generatedVoucherPdfPath;
            detailedVoucherQuery.generatedAuthorizationPdfPath = generatedAuthorizationPdfPath;
            const voucherDetails = await getVoucherDetails(detailedVoucherQuery);
            const updatedVoucherHistoryId = await updateVoucherHistory(tx, detailedVoucherQuery,
                voucherDetails.vehicles.map(v => v.id), modifiedByAuthUserId);
            return voucherDetails;
        });
        if (updatedVoucherDetails == null) {
            res.status(500).json({message: "Errore durante l'aggiornamento del tagliando"});
            deleteFileByPath(generatedVoucherPdfPath);
            deleteFileByPath(generatedAuthorizationPdfPath);
            return;
        }
        res.status(200).json({
            message: "PDF creati con successo",
            voucherDetails: updatedVoucherDetails
        });
    } catch (e) {
        res.status(500).json({message: "Errore nella conversione in PDF: " + e});
        deleteFileByPath(generatedVoucherPdfPath);
        deleteFileByPath(generatedAuthorizationPdfPath);
        return;
    }
});

const getVoucherTemplateDataFromDetailedQuery = (voucher: DetailedVoucherQueryResult): VoucherTemplateData => {
    if (voucher == null || voucher.permit == null || voucher.applications == null) {
        throw new Error("Errore nel reperire il tagliando o le sue associazioni");
    }
    if (voucher.applications.length === 0) {
        throw new Error("Il tagliando non ha domande associate");
    }

    const targetApplication = voucher.applications[0];
    if (targetApplication == null) {
        throw new Error("Errore nel reperire la domanda associata al tagliando");
    }

    const dateToLocaleStringOrEmpty = (dateStr: string | null): string => {
        if (dateStr == null || dateStr.trim() === "") {
            return "";
        }
        const date = new Date(dateStr);
        if (date.toString() === "Invalid Date") {
            return "";
        }
        return date.toLocaleDateString();
    }

    const voucherTemplateData: VoucherTemplateData = {
        numeroTagliandoStr: "" + voucher.number,
        descrizionePermessoStr: voucher.permit.printedName,
        tipologiaDomanda: targetApplication.type == null ? "N/A" : targetApplication.type.description,
        dataProtocolloStr: dateToLocaleStringOrEmpty(targetApplication.registerDate),
        numeroProtocolloStr: "" + targetApplication.registerNumber,
        dataCompletamentoStr: dateToLocaleStringOrEmpty(targetApplication.outcomeDate ?? voucher.validFromDate),
        dataInizioValiditaStr: dateToLocaleStringOrEmpty(voucher.validFromDate),
        dataFineValiditaStr: dateToLocaleStringOrEmpty(voucher.validToDate),
        cognomeIstruttoreStr: targetApplication.outcomeAuthUser == null ? "N/A" : targetApplication.outcomeAuthUser.lastname,
        nomeIstruttoreStr: targetApplication.outcomeAuthUser == null ? "N/A" : targetApplication.outcomeAuthUser.firstname,
        cognomeRichiedenteStr: targetApplication.lastname,
        nomeRichiedenteStr: targetApplication.firstname,
        comuneNascitaRichiedenteStr: targetApplication.birthCity == null ? "N/A" : targetApplication.birthCity,
        dataNascitaRichiedenteStr: targetApplication.birthDate == null ? "N/A" : dateToLocaleStringOrEmpty(targetApplication.birthDate),
        codiceFiscaleRichiedenteStr: targetApplication.cf == null ? "N/A" : targetApplication.cf,
        comuneResidenzaRichiedenteStr: targetApplication.residenceCity == null ? "N/A" : targetApplication.residenceCity,
        indirizzoResidenzaRichiedenteStr: targetApplication.residencePlace == null ? "N/A" : targetApplication.residencePlace,
        indirizzoAbitazioneDesignataStr: targetApplication.targetHousePlace == null ? "N/A" : targetApplication.targetHousePlace,
        catastoFoglioAbitazioneDesignataStr: targetApplication.targetHouseLandRegistrySheet == null ? "N/A" : targetApplication.targetHouseLandRegistrySheet,
        catastoMappaleAbitazioneDesignataStr: targetApplication.targetHouseLandRegistryMap == null ? "N/A" : targetApplication.targetHouseLandRegistryMap,
        catastoSubalternoAbitazioneDesignataStr: targetApplication.targetHouseLandRegistrySubaltern == null ? "N/A" : targetApplication.targetHouseLandRegistrySubaltern,
        catastoCategoriaAbitazioneDesignataStr: targetApplication.targetHouseLandRegistryCategory == null ? "N/A" : targetApplication.targetHouseLandRegistryCategory,
        targheArr: voucher.vehicles == null ? [] : voucher.vehicles.map(v => {
            return {
                marcaStr: v.brand,
                modelloStr: v.model,
                targaStr: v.plate,
            }
        }),
        verificationUrl: ConfigProvider.instance.configs.baseUrl + "/check-voucher/" + voucher.id,
    }
    return voucherTemplateData;
}

const generateTemplates = async (voucher: DetailedVoucherQueryResult): Promise<{
    generatedVoucherTemplatePath: string,
    generatedAuthorizationTemplatePath: string
}> => {
    if (voucher == null || voucher.permit == null) {
        throw new Error("Errore nel reperire il tagliando o le sue associazioni");
    }
    if (voucher.permit.voucherDocTemplate == null || voucher.permit.authorizationDocTemplate == null) {
        throw new Error("Errore nel reperire i modelli di tagliando e autorizzazione");
    }
    if (voucher.permit.voucherDocTemplate.disabled) {
        throw new Error("Il modello di tagliando " + voucher.permit.voucherDocTemplate.description + "(" + voucher.permit.voucherDocTemplate.id + ")" + " è disabilitato");
    }
    if (voucher.permit.authorizationDocTemplate.disabled) {
        throw new Error("Il modello di autorizzazione " + voucher.permit.authorizationDocTemplate.description + "(" + voucher.permit.authorizationDocTemplate.id + ")" + " è disabilitato");
    }

    const voucherBaseTemplatePath = voucher.permit.voucherDocTemplate.path;
    const authorizationBaseTemplatePath = voucher.permit.authorizationDocTemplate.path;

    const voucherTemplateData = getVoucherTemplateDataFromDetailedQuery(voucher);

    const resVoucher = await generateVoucherDocumentFromTemplate(voucherBaseTemplatePath, "tagliando", voucher.id, voucherTemplateData);
    if (!resVoucher.success) {
        throw new Error(resVoucher.err)
    }
    const resAuthorization = await generateVoucherDocumentFromTemplate(authorizationBaseTemplatePath, "autorizzazione", voucher.id, voucherTemplateData);
    if (!resAuthorization.success) {
        throw new Error(resAuthorization.err)
    }
    return {
        generatedVoucherTemplatePath: resVoucher.path,
        generatedAuthorizationTemplatePath: resAuthorization.path
    };
}

const convertVoucherPDF = async (generatedVoucherTemplate: string, generatedAuthorizationTemplate: string): Promise<{
    generatedVoucherPdfPath: string,
    generatedAuthorizationPdfPath: string
}> => {
    const voucherPdfPath = await convertPDF(generatedVoucherTemplate);
    if (voucherPdfPath == null) {
        throw new Error("Errore durante la conversione del modello del tagliando in PDF");
    }
    const authorizationPdfPath = await convertPDF(generatedAuthorizationTemplate);
    if (authorizationPdfPath == null) {
        throw new Error("Errore durante la conversione del modello dell'autorizzazione in PDF");
    }
    return {
        generatedVoucherPdfPath: voucherPdfPath,
        generatedAuthorizationPdfPath: authorizationPdfPath
    }
}

// const middlewareUploadVouchersMulter = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
//     if (req.params.voucherID == null || ("" + req.params.voucherID).trim() == "") {
//         res.status(400).json({message: "Tagliando non trovato"});
//         return;
//     }
//     const voucherID = parseInt(req.params.voucherID as string);
//
//     const multerRequestHandler = uploadVouchersMulterFactory(voucherID).fields([
//         {name: "generatedVoucherTemplate", maxCount: 1},
//         {name: "generatedAuthorizationTemplate", maxCount: 1},
//         {name: "signedAuthorizationPath", maxCount: 1}
//     ]);
//
//     multerRequestHandler(req, res, next);
// }


vouchersRouter.post("/edit/:voucherID", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    const modifiedByAuthUserId = req.user.id;

    if (req.params.voucherID == null || ("" + req.params.voucherID).trim() == "") {
        res.status(400).json({message: "Tagliando non trovato"});
        return;
    }
    const voucherID = parseInt(req.params.voucherID as string);

    if (req.body.validFromDate == null || new Date(req.body.validFromDate).toString() === "Invalid Date" ||
        req.body.validToDate == null || new Date(req.body.validToDate).toString() === "Invalid Date" ||
        req.body.revoked == null || ("" + req.body.revoked).trim() === "" ||
        req.body.notes == null || typeof req.body.notes !== "string" ||
        req.body.permitId == null || isNaN(parseInt(req.body.permitId)) ||
        req.body.vehicles == null || !Array.isArray(req.body.vehicles) || req.body.vehicles.some((elem: any) => typeof elem !== 'number')) {
        res.status(400).json({message: "Parametri di modifica non validi"});
        return;
    }
    if (req.body.revoked != null && typeof req.body.revoked === "string") {
        req.body.revoked = req.body.revoked === true;
    }
    if (new Date(req.body.validToDate) < new Date(req.body.validFromDate)) {
        res.status(400).json({message: "Data di scadenza antecedente alla data di inizio validità"});
        return;
    }

    const {
        validFromDate,
        validToDate,
        revoked,
        notes,
        permitId,
        vehicles,
    } = req.body;

    const db = DatabaseManager.instance.db;
    try {

        const toUpdateVoucher = await db.query.vouchers.findFirst({
            where: {id: voucherID},
            with: {vehicles: true, applications: true},
        });
        if (toUpdateVoucher == null) {
            res.status(500).json({message: "Tagliando non trovato"});
            return;
        }

        // controllare che non ci siano campi da aggiornare
        let parametersNeedUpdate = true;
        if (validFromDate === toUpdateVoucher.validFromDate &&
            validToDate === toUpdateVoucher.validToDate &&
            revoked === toUpdateVoucher.revoked &&
            notes === toUpdateVoucher.notes &&
            permitId === toUpdateVoucher.permitId &&
            toUpdateVoucher.vehicles.length === vehicles.length &&
            toUpdateVoucher.vehicles.map((vehicle) => vehicle.id).every((id) => vehicles.includes(id))) {
            parametersNeedUpdate = false;
        }

        // se non ci sono parametri da aggiornare e non ci sono nuovi file caricati esco subito
        if (!parametersNeedUpdate) {
            res.status(200).json({
                message: "Nessuna modifica effettuata",
                needTemplateGeneration: false
            });
            return;
        }

        const updatedVoucherId = await db.transaction(async (tx) => {
            const permit = await getPermit(tx, permitId);
            const permitHistoryId = permit.lastPermitHistoryId as number;

            if (permit.applicationPlatesAmount != vehicles.length) {
                throw new Error("Numero di veicoli non valido");
            }

            if (permitId !== toUpdateVoucher.permitId) {
                const applicationsUpdateResult = await tx.update(applications).set({
                    permitId: permitId
                }).where(eq(applications.voucherId, voucherID));
                if (applicationsUpdateResult.rowCount !== toUpdateVoucher.applications.length) {
                    throw new Error("Errore durante l'aggiornamento delle domande");
                }
            }

            const updatedVoucher = await tx.update(vouchers).set({
                validFromDate: validFromDate,
                validToDate: validToDate,
                revoked: revoked,
                notes: notes,
                permitId: permitId
            }).where(eq(vouchers.id, voucherID)).returning();
            if (updatedVoucher == null || updatedVoucher.length !== 1 || updatedVoucher[0] == null) {
                throw new Error("Errore durante l'aggiornamento del tagliando");
            }

            const deleteResult = await tx.delete(vouchersToVehicles).where(eq(vouchersToVehicles.voucherId, voucherID));
            const vehiclesToInsertVoucher = (vehicles as number[]).map((vehicleId) => {
                return {
                    voucherId: voucherID,
                    vehicleId: vehicleId as number,
                }
            });
            const insertResult = await tx.insert(vouchersToVehicles).values(vehiclesToInsertVoucher);
            if (insertResult == null || insertResult.rowCount !== vehicles.length) {
                throw new Error("Errore durante l'aggiornamento delle associazioni tra tagliando e veicoli");
            }

            const updatedVoucherHistoryId = await updateVoucherHistory(tx,
                updatedVoucher[0], vehicles,
                modifiedByAuthUserId, permitHistoryId);
            return updatedVoucher[0].id;
        });
        if (updatedVoucherId == null) {
            res.status(500).json({message: "Errore durante l'aggiornamento del tagliando"});
            return;
        }
        res.status(200).json({
            message: "Tagliando aggiornato con successo",
            needTemplateGeneration: true
        });
        return;
    } catch (e) {
        res.status(500).json({message: "Errore durante l'aggiornamento del tagliando: " + e});
        return;
    }
});


vouchersRouter.post("/new", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    const modifiedByAuthUserId = req.user.id;

    if (req.body.validFromDate == null || new Date(req.body.validFromDate).toString() === "Invalid Date" ||
        req.body.notes == null || typeof req.body.notes !== "string" ||
        req.body.permitId == null || isNaN(parseInt(req.body.permitId)) ||
        req.body.vehicles == null || !Array.isArray(req.body.vehicles) || req.body.vehicles.some((elem: any) => typeof elem !== 'number')) {
        res.status(400).json({message: "Parametri di creazione non validi"});
        return;
    }
    //validToDate can be null: in that case it will be generated from permit
    if (req.body.validToDate != null && (req.body.validToDate.trim() === "" || new Date(req.body.validToDate).toString() === "Invalid Date")) {
        req.body.validToDate = null;
    }
    if (req.body.validToDate != null && new Date(req.body.validToDate) < new Date(req.body.validFromDate)) {
        res.status(400).json({message: "Data di scadenza antecedente alla data di inizio validità"});
        return;
    }

    const {
        validFromDate,
        validToDate,
        notes,
        permitId,
        vehicles,
    } = req.body;

    const db = DatabaseManager.instance.db;
    try {
        const createdVoucherId = await db.transaction(async (tx) => {
            return await voucherNumerationMutex.runExclusive(async () => {
                const permit = await getPermit(tx, permitId);
                const permitHistoryId = permit.lastPermitHistoryId as number;

                if (permit.applicationPlatesAmount != vehicles.length) {
                    throw new Error("Numero di veicoli non valido");
                }

                const {newVoucherId, newVoucherHistoryId} = await createNewVoucher(tx, {
                    permitId: permitId,
                    permitHistoryId: permitHistoryId,
                    validFromDate: validFromDate,
                    validToDate: validToDate,
                    notes: notes,
                    permitApplicationPlatesAmount: permit.applicationPlatesAmount,
                    modifiedByAuthUserId: modifiedByAuthUserId,
                    vehicles: vehicles,
                });
                return newVoucherId;
            });
        });
        if (createdVoucherId == null) {
            res.status(500).json({message: "Errore durante l'inserimento del tagliando"});
            return;
        }
        res.status(200).json({
            message: "Tagliando creato con successo",
            id: createdVoucherId
        });
        return;
    } catch (e) {
        res.status(500).json({message: "Errore durante la creazione della tagliando: " + e});
        return;
    }
});

vouchersRouter.get("/availableOptions", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
        if (req.user == null) {
            return res.status(401).json({message: "Non autorizzato"});
        }
        const db = DatabaseManager.instance.db;
        try {
            const permitsList = await getPermitsList();
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


export type VoucherCreationData = {
    permitId: number,
    permitHistoryId: number,
    permitApplicationPlatesAmount: number,
    validFromDate: string | null,
    validToDate: string | null,
    notes: string,
    modifiedByAuthUserId: number,
    vehicles: number[]
};

export const voucherNumerationMutex = new Mutex();
export const createNewVoucher = async (tx: DbTransactionType, creationData: VoucherCreationData): Promise<{
    newVoucherId: number,
    newVoucherHistoryId: number
}> => {
    if (creationData.permitApplicationPlatesAmount !== creationData.vehicles.length) {
        throw new Error("Numero di targhe nel permesso non corrispondente al numero di veicoli");
    }
    let validFromDateT: Date = new Date();
    if (creationData.validFromDate != null && creationData.validFromDate.trim() !== "") {
        validFromDateT = new Date(creationData.validFromDate);
    }
    if (validFromDateT.toString() === "Invalid Date") {
        throw new Error("Errore durante la creazione del tagliando: data inizio validità tagliando non valida");
    }
    const {number, durationDays} = await getVoucherNumerationNewData(tx, creationData.permitId);
    let expiryDateT: Date = new Date(validFromDateT);
    if (creationData.validToDate != null && creationData.validToDate.trim() !== "") {
        expiryDateT = new Date(creationData.validToDate);
    } else {
        expiryDateT.setDate(validFromDateT.getDate() + durationDays);
    }
    if (expiryDateT.toString() === "Invalid Date") {
        throw new Error("Errore durante la creazione del tagliando: data scadenza tagliando non valida");
    }
    const createdVoucher = await tx.insert(vouchers).values({
        number: number,
        revoked: false,
        validFromDate: validFromDateT.toDateString(),
        validToDate: expiryDateT.toDateString(),
        notes: "",
        permitId: creationData.permitId,
        generatedVoucherTemplatePath: null,
        generatedAuthorizationTemplatePath: null,
        generatedVoucherPdfPath: null,
        generatedAuthorizationPdfPath: null,
        signedAuthorizationPath: null,
    }).returning();
    if (createdVoucher == null || createdVoucher.length !== 1 || createdVoucher[0] == null) {
        throw new Error("Creazione tagliando fallita: " + JSON.stringify(createdVoucher));
    }
    const createdVoucherId = createdVoucher[0].id;
    // const deleteResult = await tx.delete(vouchersToVehicles).where(eq(vouchersToVehicles.voucherId, createdVoucherId));
    const vehiclesToInsertVoucher = creationData.vehicles.map((vehicleId) => {
        return {
            voucherId: createdVoucherId,
            vehicleId: vehicleId,
        }
    });
    const insertResult = await tx.insert(vouchersToVehicles).values(vehiclesToInsertVoucher);
    if (insertResult == null || insertResult.rowCount !== creationData.vehicles.length) {
        throw new Error("Errore durante l'aggiornamento delle associazioni tra tagliando e veicoli");
    }
    const createdVoucherHistoryId = await updateVoucherHistory(tx, createdVoucher[0],
        vehiclesToInsertVoucher.map(v => v.vehicleId),
        creationData.modifiedByAuthUserId, creationData.permitHistoryId);
    return {
        newVoucherId: createdVoucherId,
        newVoucherHistoryId: createdVoucherHistoryId,
    };

}

export const getLastVoucherHistoryId = async (tx: DbTransactionType, voucherId: number): Promise<number> => {
    const foundVouchers = await tx.select().from(vouchers).where(eq(vouchers.id, voucherId));
    if (foundVouchers == null || foundVouchers.length !== 1 || foundVouchers[0] == null || foundVouchers[0].lastVoucherHistoryId == null) {
        throw new Error("Errore tagliando non trovato");
    }
    return foundVouchers[0].lastVoucherHistoryId;
}

export const updateVoucherWithApplication = async (tx: DbTransactionType, applicationId: number, voucherId: number, modifiedByAuthUserId: number): Promise<void> => {
    const foundVouchers = await tx.select().from(vouchers).where(eq(vouchers.id, voucherId));//.rightJoin(vouchersToVehicles, eq(vouchers.id, vouchersToVehicles.voucherId));
    if (foundVouchers == null || foundVouchers.length !== 1 || foundVouchers[0] == null) {
        throw new Error("Errore tagliando non trovato");
    }
    const foundVoucher = foundVouchers[0];
    const foundVoucherVehicles = await tx.select().from(vouchersToVehicles).where(eq(vouchersToVehicles.voucherId, foundVoucher.id));
    if (foundVoucherVehicles == null) {
        throw new Error("Errore veicoli non trovati per il tagliando");
    }
    const foundApplications = await tx.select().from(applications).where(and(eq(applications.id, applicationId), eq(applications.voucherId, voucherId))).orderBy(desc(applications.outcomeDate), desc(applications.id));//.rightJoin(applicationsToVehicles, eq(applications.id, applicationsToVehicles.applicationId));
    if (foundApplications == null || foundApplications.length === 0 || foundApplications[0] == null) {
        throw new Error("Errore domanda non trovata");
    }
    if (foundApplications[0].voucherId !== voucherId) {
        throw new Error("Tagliando associato alla domanda non corrispondente");
    }
    const foundApplication = foundApplications[0];
    const foundApplicationVehicles = await tx.select().from(applicationsToVehicles).where(eq(applicationsToVehicles.applicationId, foundApplication.id));
    if (foundApplicationVehicles == null) {
        throw new Error("Errore veicoli non trovati per il tagliando");
    }

    if (foundApplication.permitId === foundVoucher.permitId &&
        foundApplication.outcomeDate === foundVoucher.validFromDate &&
        foundApplicationVehicles.length === foundVoucherVehicles.length &&
        foundVoucherVehicles.every((voucherVehicle) => {
            let found = false;
            foundApplicationVehicles.forEach((applicationVehicle) => {
                if (applicationVehicle.vehicleId === voucherVehicle.vehicleId) {
                    found = true;
                }
            });
            return found;
        })
    ) {
        console.log("Nessuna modifica effettuata al tagliando");
        return;
    }

    const deleteResult = await tx.delete(vouchersToVehicles).where(eq(vouchersToVehicles.voucherId, foundVoucher.id));
    const vehiclesToInsertVoucher = foundApplicationVehicles.map((elem) => {
        return {
            voucherId: foundVoucher.id,
            vehicleId: elem.vehicleId,
        }
    });
    const insertResult = await tx.insert(vouchersToVehicles).values(vehiclesToInsertVoucher);
    if (insertResult == null || insertResult.rowCount !== foundApplicationVehicles.length) {
        throw new Error("Errore durante l'aggiornamento delle associazioni tra tagliando e veicoli");
    }

    const permit = await getPermit(tx, foundApplication.permitId);

    if (foundApplication.outcomeDate == null) {
        throw new Error("Errore durante l'aggiornamento del tagliando: data esito non presente");
    }
    const validFromDateT: Date = new Date(foundApplication.outcomeDate);
    if (validFromDateT.toString() === "Invalid Date") {
        throw new Error("Errore durante l'aggiornamento del tagliando: data esito non valida");
    }
    const expiryDateT: Date = new Date(validFromDateT);
    expiryDateT.setDate(expiryDateT.getDate() + permit.voucherDurationDays);

    const updatedVoucher = await tx.update(vouchers).set({
        number: foundVoucher.number,
        revoked: false,
        validFromDate: validFromDateT.toDateString(),
        validToDate: expiryDateT.toDateString(),
        notes: foundVoucher.notes,
        permitId: foundApplication.permitId,
        generatedVoucherTemplatePath: foundVoucher.generatedVoucherTemplatePath,
        generatedAuthorizationTemplatePath: foundVoucher.generatedAuthorizationTemplatePath,
        generatedVoucherPdfPath: foundVoucher.generatedVoucherPdfPath,
        generatedAuthorizationPdfPath: foundVoucher.generatedAuthorizationPdfPath,
        signedAuthorizationPath: foundVoucher.signedAuthorizationPath,
    }).where(eq(vouchers.id, foundVoucher.id)).returning();
    if (updatedVoucher == null || updatedVoucher.length !== 1 || updatedVoucher[0] == null) {
        throw new Error("Creazione tagliando fallita: " + JSON.stringify(updatedVoucher));
    }
    const updatedVoucherHistoryId = await updateVoucherHistory(tx, updatedVoucher[0],
        vehiclesToInsertVoucher.map(v => v.vehicleId), modifiedByAuthUserId, permit.lastPermitHistoryId);
}

vouchersRouter.get("/generateEmail/:voucherID", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    if (req.params.voucherID == null || ("" + req.params.voucherID).trim() == "") {
        res.status(400).json({message: "Tagliando non trovato"});
        return;
    }
    const voucherID = parseInt(req.params.voucherID as string);
    if (isNaN(voucherID)) {
        res.status(400).json({message: "ID tagliando non valido"});
        return;
    }

    try {
        const db = DatabaseManager.instance.db;
        const generatedEmail = await db.transaction(async (tx) => {
            const detailedVoucherQuery = await getDetailedVoucher(tx, voucherID);
            return generateEmail(detailedVoucherQuery);
        });

        res.json({
            message: "Mail generata con successo",
            email: generatedEmail
        });
    } catch (e) {
        res.status(500).json({message: "Errore nella generazione della mail: " + e});
        return;
    }
});

const generateEmail = (voucher: DetailedVoucherQueryResult): Email => {
    if (voucher == null || voucher.permit == null) {
        throw new Error("Errore nel reperire il tagliando o le sue associazioni");
    }
    if (voucher.permit.approveEmailTemplate == null || voucher.permit.refuseEmailTemplate == null || voucher.permit.revokeEmailTemplate == null) {
        throw new Error("Errore nel reperire i modelli di email del permesso");
    }
    if (voucher.applications.length === 0) {
        throw new Error("Il tagliando non ha domande associate");
    }
    const targetApplication = voucher.applications[0];
    if (targetApplication == null) {
        throw new Error("Errore nel reperire la domanda associata al tagliando");
    }
    if (voucher.generatedVoucherPdfPath == null || voucher.generatedVoucherPdfPath.trim() === "") {
        throw new Error("PDF del tagliando non generato");
    }
    if (voucher.signedAuthorizationPath == null || voucher.signedAuthorizationPath.trim() === "") {
        throw new Error("Autorizzazione firmata non presente");
    }
    const voucherTemplateData = getVoucherTemplateDataFromDetailedQuery(voucher);

    const currentState = getVoucherCurrentState(voucher.revoked, voucher.validFromDate, voucher.validToDate);
    const emailAttachments: EmailAttachment[] = [];
    if (currentState !== "Revocato") {
        emailAttachments.push({
            filename: "Tagliando " + voucher.number + ".pdf",
            downloadPath: adjustPathForDownload(voucher.generatedVoucherPdfPath),
            path: voucher.generatedVoucherPdfPath
        });
        emailAttachments.push({
            filename: "Autorizzazione firmata" + path.extname(voucher.signedAuthorizationPath),
            downloadPath: adjustPathForDownload(voucher.signedAuthorizationPath),
            path: voucher.signedAuthorizationPath
        });
    }
    const targetEmailTemplate = currentState === "Revocato" ? voucher.permit.revokeEmailTemplate : voucher.permit.approveEmailTemplate;

    if (targetEmailTemplate.disabled) {
        throw new Error("Il modello di email " + targetEmailTemplate.description + "(" + targetEmailTemplate.id + ")" + " è disabilitato");
    }

    const generatedTemplate = generateEmailFromTemplate(targetEmailTemplate.subject, targetEmailTemplate.body, voucherTemplateData);
    return {
        to: targetApplication.email,
        subject: generatedTemplate.subject,
        body: generatedTemplate.body,
        attachments: emailAttachments
    }
}

vouchersRouter.post("/sendEmail/:voucherID", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    if (req.params.voucherID == null || ("" + req.params.voucherID).trim() == "") {
        res.status(400).json({message: "Tagliando non trovato"});
        return;
    }
    const voucherID = parseInt(req.params.voucherID as string);
    if (isNaN(voucherID)) {
        res.status(400).json({message: "ID tagliando non valido"});
        return;
    }

    /*
    subject: string,
    body: string,
    attachments: EmailAttachment[],
     */
    if (req.body.subject == null || typeof req.body.subject !== "string" || req.body.subject.trim() === "" ||
        req.body.body == null || typeof req.body.body !== "string" || req.body.body.trim() === "" ||
        req.body.to == null || typeof req.body.to !== "string" || req.body.to.trim() === "" ||
        req.body.attachments == null || !Array.isArray(req.body.attachments)) {
        res.status(400).json({message: "Parametri non validi"});
        return;
    }
    for (const attachment of req.body.attachments) {
        /*
    filename: string,
    path: string
         */
        if (attachment.filename == null || typeof attachment.filename !== "string" || attachment.filename.trim() === "" ||
            attachment.path == null || typeof attachment.path !== "string" || attachment.path.trim() === "" ||
            !existsSync(attachment.path)) {
            res.status(400).json({message: "Allegati non validi"});
            return;
        }
    }

    const emailToSend: Email = {
        to: req.body.to,
        subject: req.body.subject,
        body: req.body.body,
        attachments: req.body.attachments
    }

    // let sent = false;
    // let saved = false;
    try {
        // salvataggio in emailHistory
        const db = DatabaseManager.instance.db;
        const voucherDetails = await db.transaction(async (tx) => {
            const detailedVoucherQuery = await getDetailedVoucher(tx, voucherID);
            const voucherDetails = await getVoucherDetails(detailedVoucherQuery);
            // invio della mail
            const sendResult = await SmtpManager.instance.sendMail({
                from: ConfigProvider.instance.configs.smtpUser,
                to: emailToSend.to,
                subject: emailToSend.subject,
                html: emailToSend.body,
                attachments: emailToSend.attachments.map(attachment => ({
                    filename: attachment.filename,
                    path: attachment.path
                })),
            });
            if (sendResult.err != null) {
                throw new Error(sendResult.err);
            }
            const attachments = JSON.stringify(emailToSend.attachments);
            const updatedVoucherEmailHistory = await tx.insert(vouchersEmailsHistory).values({
                voucherId: voucherID,
                to: emailToSend.to,
                subject: emailToSend.subject,
                body: emailToSend.body,
                attachments: attachments,
            }).returning();
            if (updatedVoucherEmailHistory == null || updatedVoucherEmailHistory.length !== 1 || updatedVoucherEmailHistory[0] == null) {
                throw new Error("Errore durante l'aggiornamento dello storico del tagliando");
            }
            return voucherDetails;
        });
        res.json({
            message: "Mail inviata con successo",
            voucherDetails: voucherDetails
        });
    } catch (e) {
        res.status(500).json({message: "Errore nell'invio o nel salvataggio della mail: " + e});
        return;
    }
});

