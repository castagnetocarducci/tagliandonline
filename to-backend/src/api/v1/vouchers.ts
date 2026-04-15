import {type AuthRequest, middlewareAuthCheck} from "./auth.ts";
import {DatabaseManager, type DbTransactionType} from "../../db/databaseManager.ts";
import type {HistoryEvent, HistoryModificationMap} from "../../utils/commonTypes.ts";
import {checkAndUpdateValueModificationsMap} from "../../utils/commonFunctions.ts";
import {
    applications,
    applicationsToVehicles,
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
import {generateVoucherDocumentFromTemplate, type VoucherTemplateData} from "../../reportsGeneration.ts";
import {convertPDF} from "../../pdfConversion.ts";

export const vouchersRouter = Router();

type VoucherPublicCheck = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    number: number,
    revoked: boolean,
    currentState: string,
    validFromDate: Date,
    validToDate: Date,
    permit: {
        id: number,
        description: string,
        disabled: boolean,
        simultaneousPlatesAmount: number,
        applicationPlatesAmount: number,
        voucherDurationDays: number
    },
    vehicles: {
        id: number,
        plate: string,
        model: string,
        brand: string,
    }[]
}

type VoucherListEntry = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    number: number,
    revoked: boolean,
    currentState: string,
    validFromDate: Date,
    validToDate: Date,
    permit: {
        id: number,
        description: string,
        disabled: boolean
    },
    vehicles: {
        id: number,
        plate: string,
        model: string,
        brand: string,
    }[],
    applications: {
        id: number,
        registerNumber: number,
        registerDate: Date,
        cf: string,
        firstname: string,
        lastname: string,
        email: string,
    }[]
}

type VoucherDetails = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    number: number,
    revoked: boolean,
    currentState: string,
    validFromDate: Date,
    validToDate: Date,
    notes: string,
    generatedVoucherTemplatePath: string | null,
    generatedAuthorizationTemplatePath: string | null,
    generatedVoucherPdfPath: string | null,
    generatedAuthorizationPdfPath: string | null,
    signedAuthorizationPath: string | null,
    permit: {
        id: number,
        description: string,
        printedName: string,
        disabled: boolean,
        simultaneousPlatesAmount: number,
        applicationPlatesAmount: number,
        voucherDurationDays: number
    },
    applications: {
        id: number,
        registerNumber: number,
        registerDate: Date,
        cf: string,
        firstname: string,
        lastname: string,
        email: string,
        outcomeDate: Date | null,
        outcomeDescription: string,
        typeDescription: string,
        vehicles: {
            id: number,
            createdAt: Date,
            updatedAt: Date,
            plate: string,
            model: string,
            brand: string,
        }[],
    }[],
    vehicles: {
        id: number,
        createdAt: Date,
        updatedAt: Date,
        plate: string,
        model: string,
        brand: string,
    }[],
    emails: {
        id: number,
        to: string,
        subject: string,
        attachmentsPresent: boolean,
    }[],
}

// /*
// export const vouchers = toSchema.table("vouchers", {
//     id: commonColumns.idAutoIncr(),
//     createdAt: commonColumns.createdAt(),
//     updatedAt: commonColumns.updatedAt(),
//     number: integer().notNull(),
//     revoked: commonColumns.disabled(),
//     validFromDate: date().notNull(),
//     validToDate: date().notNull(),
//     notes: commonColumns.notes(),
//     permitId: integer().notNull().references(() => permits.id),
//     generatedVoucherTemplatePath: commonColumns.path512(),
//     generatedAuthorizationTemplatePath: commonColumns.path512(),
//     generatedVoucherPdfPath: commonColumns.path512(),
//     generatedAuthorizationPdfPath: commonColumns.path512(),
//     signedAuthorizationPath: commonColumns.path512(),
//     lastVoucherHistoryId: integer().references((): AnyPgColumn => vouchersHistory.id),
// }, (t) => [
//     index("vouchersNumberIndex").on(t.number),
//     index("vouchersPermitIdIndex").on(t.permitId),
// ])
//
// vouchers: {
//     permit: r.one.permits({
//         from: r.vouchers.permitId,
//         to: r.permits.id
//     }),
//     applications: r.many.applications(),
//     vehicles: r.many.vehicles({
//         from: r.vouchers.id.through(r.vouchersToVehicles.voucherId),
//         to: r.vehicles.id.through(r.vouchersToVehicles.vehicleId)
//     }),
//     emails: r.many.vouchersEmailsHistory(),
//     voucherHistory: r.many.vouchersHistory({
//         alias: "voucherHistoryRel",
//     }),
//     lastVoucherHistory: r.one.vouchersHistory({ //non speculare
//         from: r.vouchers.lastVoucherHistoryId,
//         to: r.vouchersHistory.id,
//         alias: "lastVoucherHistoryRel",
//     })
// },
//
// */

const getVoucherCurrentState = (revoked: boolean, validFromDate: string, validToDate: string) => {
    if (revoked) {
        return "Revocato";
    } else if (new Date() > new Date(validToDate)) {
        return "Scaduto";
    } else if (new Date() < new Date(validFromDate)) {
        return "Non ancora valido";
    } else {
        return "Valido";
    }
}

vouchersRouter.post("/list", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        return res.status(401).json({message: "Non autorizzato"});
    }
    /*
    id: number,
    createdAt: Date,
    updatedAt: Date,

    number: number,

    revoked: boolean, non gestito

    validFromDate: Date,
    validToDate: Date,

    notes: string, non gestito


    permit: {
        id: number,
        description: string,
        printedName: string,
        disabled: boolean,
        simultaneousPlatesAmount: number,
        applicationPlatesAmount: number
    },
    generatedVoucherTemplatePath: string,
    generatedAuthorizationTemplatePath: string,
    generatedVoucherPdfPath: string,
    generatedAuthorizationPdfPath: string,
    signedAuthorizationPath: string,
    applications: {
        id: number,
        registerNumber: string,
        registerDate: Date,
        cf: string,
        firstname: string,
        lastname: string,
        email: string,
        outcomeDate: Date,
        outcomeDescription: string,
        typeDescription: string,
        emails: {
            id: number,
            to: string,
            subject: string,
            attachmentsPresent: boolean
        }[],
    }[],
    vehicles: {
        id: number,
        plate: string,
        model: string,
        brand: string,
    }[],
    emails: {
        id: number,
        to: string,
        subject: string,
        attachmentsPresent: boolean,
    }[],

     */

    const {
        idFrom,
        idTo,

        numberFrom,
        numberTo,

        validityStartedFromDate,
        validityStartedToDate,

        expiresFromDate,
        expiresToDate,

        emailTo,
        permitId,

        applicationId,
        requestDate,
        outcomeDate,
        registerNumber,
        registerDate,
        cf,
        firstname,
        lastname,
        email,
        targetHousePlace,
        targetHouseLandRegistrySheet,
        targetHouseLandRegistryMap,
        targetHouseLandRegistrySubaltern,
        targetHouseLandRegistryCategory,

        vehicleId,
        vehiclePlate,
        vehicleModel,
        vehicleBrand,

        page,
    } = req.body;
    const db = DatabaseManager.instance.db;
    const resultsPerPage = ConfigProvider.instance.configs.resultsPerPage;
    // const countConditions = [], queryConditions = [];
    const vouchersCountConditions = [], vouchersQueryConditions = [];
    const applicationsCountConditions = [], applicationsQueryConditions = [];
    const vehiclesCountConditions = [], vehiclesQueryConditions = [];
    const emailsCountConditions = [], emailsQueryConditions = [];

    // vouchers filters
    if (idFrom != null && !isNaN(parseInt(idFrom))) {
        vouchersCountConditions.push(gte(vouchers.id, parseInt(idFrom)));
        vouchersQueryConditions.push({id: {gte: idFrom}});
    }
    if (idTo != null && !isNaN(parseInt(idTo))) {
        vouchersCountConditions.push(lte(vouchers.id, parseInt(idTo)));
        vouchersQueryConditions.push({id: {lte: idTo}});
    }
    if (numberFrom != null && !isNaN(parseInt(numberFrom))) {
        vouchersCountConditions.push(gte(vouchers.number, parseInt(numberFrom)));
        vouchersQueryConditions.push({number: {gte: numberFrom}});
    }
    if (numberTo != null && !isNaN(parseInt(numberTo))) {
        vouchersCountConditions.push(gte(vouchers.number, parseInt(numberTo)));
        vouchersQueryConditions.push({number: {gte: numberTo}});
    }
    if (validityStartedFromDate != null && !isNaN(parseInt(validityStartedFromDate))) {
        vouchersCountConditions.push(gte(vouchers.validFromDate, new Date(validityStartedFromDate).toISOString()));
        vouchersQueryConditions.push({validFromDate: {gte: new Date(validityStartedFromDate).toISOString()}});
    }
    if (validityStartedToDate != null && !isNaN(parseInt(validityStartedToDate))) {
        vouchersCountConditions.push(gte(vouchers.validToDate, new Date(validityStartedToDate).toISOString()));
        vouchersQueryConditions.push({validToDate: {gte: new Date(validityStartedToDate).toISOString()}});
    }
    if (expiresFromDate != null && !isNaN(parseInt(expiresFromDate))) {
        vouchersCountConditions.push(gte(vouchers.validFromDate, new Date(expiresFromDate).toISOString()));
        vouchersQueryConditions.push({validFromDate: {gte: new Date(expiresFromDate).toISOString()}});
    }
    if (expiresToDate != null && !isNaN(parseInt(expiresToDate))) {
        vouchersCountConditions.push(gte(vouchers.validToDate, new Date(expiresToDate).toISOString()));
        vouchersQueryConditions.push({validToDate: {gte: new Date(expiresToDate).toISOString()}});
    }
    if (permitId != null && !isNaN(parseInt(permitId))) {
        vouchersCountConditions.push(eq(vouchers.permitId, parseInt(permitId)));
        vouchersQueryConditions.push({permitId: parseInt(permitId)});
    }

    //applications
    if (applicationId != null && !isNaN(parseInt(applicationId))) {
        applicationsCountConditions.push(eq(applications.id, parseInt(applicationId)));
        applicationsQueryConditions.push({id: parseInt(applicationId)});
    }
    if (requestDate != null && new Date(requestDate).toString() !== "Invalid Date") {
        applicationsCountConditions.push(eq(applications.requestDate, new Date(requestDate).toLocaleDateString()));
        applicationsQueryConditions.push({requestDate: new Date(requestDate).toLocaleDateString()});
    }
    if (outcomeDate != null && new Date(outcomeDate).toString() !== "Invalid Date") {
        applicationsCountConditions.push(eq(applications.outcomeDate, new Date(outcomeDate).toLocaleDateString()));
        applicationsQueryConditions.push({outcomeDate: new Date(outcomeDate).toLocaleDateString()});
    }
    if (registerNumber != null && !isNaN(parseInt(registerNumber))) {
        applicationsCountConditions.push(eq(applications.registerNumber, parseInt(registerNumber)));
        applicationsQueryConditions.push({registerNumber: parseInt(registerNumber)});
    }
    if (registerDate != null && new Date(registerDate).toString() !== "Invalid Date") {
        applicationsCountConditions.push(eq(applications.registerDate, new Date(registerDate).toLocaleDateString()));
        applicationsQueryConditions.push({registerDate: new Date(registerDate).toLocaleDateString()});
    }
    if (cf != null && cf.trim() !== "") {
        applicationsCountConditions.push(ilike(applications.cf, `%${cf}%`));
        applicationsQueryConditions.push({cf: {ilike: `%${cf}%`}});
    }
    if (firstname != null && firstname.trim() !== "") {
        applicationsCountConditions.push(ilike(applications.firstname, `%${firstname}%`));
        applicationsQueryConditions.push({firstname: {ilike: `%${firstname}%`}});
    }
    if (lastname != null && lastname.trim() !== "") {
        applicationsCountConditions.push(ilike(applications.lastname, `%${lastname}%`));
        applicationsQueryConditions.push({lastname: {ilike: `%${lastname}%`}});
    }
    if (email != null && email.trim() !== "") {
        applicationsCountConditions.push(ilike(applications.email, `%${email}%`));
        applicationsQueryConditions.push({email: {ilike: `%${email}%`}});
    }
    if (targetHousePlace != null && targetHousePlace.trim() !== "") {
        applicationsCountConditions.push(ilike(applications.targetHousePlace, `%${targetHousePlace}%`));
        applicationsQueryConditions.push({targetHousePlace: {ilike: `%${targetHousePlace}%`}});
    }
    if (targetHouseLandRegistrySheet != null && targetHouseLandRegistrySheet.trim() !== "") {
        applicationsCountConditions.push(ilike(applications.targetHouseLandRegistrySheet, `%${targetHouseLandRegistrySheet}%`));
        applicationsQueryConditions.push({targetHouseLandRegistrySheet: {ilike: `%${targetHouseLandRegistrySheet}%`}});
    }
    if (targetHouseLandRegistryMap != null && targetHouseLandRegistryMap.trim() !== "") {
        applicationsCountConditions.push(ilike(applications.targetHouseLandRegistryMap, `%${targetHouseLandRegistryMap}%`));
        applicationsQueryConditions.push({targetHouseLandRegistryMap: {ilike: `%${targetHouseLandRegistryMap}%`}});
    }
    if (targetHouseLandRegistrySubaltern != null && targetHouseLandRegistrySubaltern.trim() !== "") {
        applicationsCountConditions.push(ilike(applications.targetHouseLandRegistrySubaltern, `%${targetHouseLandRegistrySubaltern}%`));
        applicationsQueryConditions.push({targetHouseLandRegistrySubaltern: {ilike: `%${targetHouseLandRegistrySubaltern}%`}});
    }
    if (targetHouseLandRegistryCategory != null && targetHouseLandRegistryCategory.trim() !== "") {
        applicationsCountConditions.push(ilike(applications.targetHouseLandRegistryCategory, `%${targetHouseLandRegistryCategory}%`));
        applicationsQueryConditions.push({targetHouseLandRegistryCategory: {ilike: `%${targetHouseLandRegistryCategory}%`}});
    }

    // email history
    if (emailTo != null && emailTo.trim() !== "") {
        emailsCountConditions.push(ilike(vouchersEmailsHistory.to, `%${emailTo}%`));
        emailsQueryConditions.push({to: {ilike: `%${emailTo}%`}});
        // const emailsSubQuery = db.select({id: applicationsEmailsHistory.id}).from(applicationsEmailsHistory).where(ilike(applicationsEmailsHistory.to, `%${emailTo}%`));
        // applicationsCountConditions.push(exists(emailsSubQuery.where(eq(applications.id, applicationsEmailsHistory.applicationId))));
    }

    //vehicles
    if (vehicleId != null && !isNaN(parseInt(vehicleId))) {
        vehiclesCountConditions.push(eq(vehicles.id, parseInt(vehicleId)));
        vehiclesQueryConditions.push({id: parseInt(vehicleId)});
    }
    if (vehiclePlate != null && vehiclePlate.trim() !== "") {
        vehiclesCountConditions.push(ilike(vehicles.plate, `%${vehiclePlate}%`));
        vehiclesQueryConditions.push({plate: {ilike: `%${vehiclePlate}%`}});
    }
    if (vehicleModel != null && vehicleModel.trim() !== "") {
        vehiclesCountConditions.push(ilike(vehicles.model, `%${vehicleModel}%`));
        vehiclesQueryConditions.push({model: {ilike: `%${vehicleModel}%`}});
    }
    if (vehicleBrand != null && vehicleBrand.trim() !== "") {
        vehiclesCountConditions.push(ilike(vehicles.brand, `%${vehicleBrand}%`));
        vehiclesQueryConditions.push({brand: {ilike: `%${vehicleBrand}%`}});
    }

    // if (plate != null && plate.trim() !== "") { vehiclesCountConditions.push(ilike(vehicles.plate, `%${plate}%`)); vehiclesQueryConditions.push({plate: {ilike: `%${plate}%`}}); }
    // if (model != null && model.trim() !== "") { vehiclesCountConditions.push(ilike(vehicles.model, `%${model}%`)); vehiclesQueryConditions.push({model: {ilike: `%${model}%`}}); }
    // if (brand != null && brand.trim() !== "") { vehiclesCountConditions.push(ilike(vehicles.brand, `%${brand}%`)); vehiclesQueryConditions.push({brand: {ilike: `%${brand}%`}}); }

    //const totalAmount = await db.$count(applications, and(...applicationsCountConditions));


    // counting section
    const vehiclesCountFilterSubQuery = db.select().from(vouchersToVehicles)
        .leftJoin(vehicles, eq(vouchersToVehicles.vehicleId, vehicles.id))
        .where(and(eq(vouchers.id, vouchersToVehicles.voucherId), ...vehiclesCountConditions));
    const applicationsCountFilterSubQuery = db.select().from(applications)
        .where(and(eq(vouchers.id, applications.voucherId), ...applicationsCountConditions));
    const emailsCountFilterSubQuery = db.select().from(vouchersEmailsHistory)
        .where(and(eq(vouchers.id, vouchersEmailsHistory.voucherId), ...emailsCountConditions));

    const existsCountConditions = [];
    if (vehiclesCountConditions.length > 0) {
        existsCountConditions.push(exists(vehiclesCountFilterSubQuery));
    }
    if (applicationsCountConditions.length > 0) {
        existsCountConditions.push(exists(applicationsCountFilterSubQuery));
    }
    if (emailsCountConditions.length > 0) {
        existsCountConditions.push(exists(emailsCountFilterSubQuery));
    }

    const totalAmount = await db.select({count: count()}).from(vouchers)
        .where(and(...vouchersCountConditions, ...existsCountConditions));
    if (totalAmount == null || totalAmount.length !== 1 || totalAmount[0] == null) {
        return res.status(500).json({message: "Errore nel conteggio dei risultati"});
    }
    // console.log(totalAmount[0].count);

    // const vehiclesArr = await db.select().from(applications)
    //     .where(and(...applicationsSearchConditions))
    //     .orderBy(desc(applications.id))
    //     .offset(page != null ? (page - 1) * resultsPerPage : 0).limit(resultsPerPage);

    // query section
    const vouchersArr = await db.query.vouchers.findMany({
        where: {
            AND: [
                ...vouchersQueryConditions,
            ],
            vehicles: (vehiclesQueryConditions.length === 0 ? undefined : {
                AND: [...vehiclesQueryConditions]
            }),
            applications: (applicationsQueryConditions.length === 0 ? undefined : {
                AND: [...applicationsQueryConditions],
            }),
            emails: (emailsQueryConditions.length === 0 ? undefined : {
                AND: [...emailsQueryConditions],
            }),
        },

        with: {
            vehicles: true,
            applications: {
                orderBy: {outcomeDate: "desc", id: "desc"}, // choose application with most recent outcomeDate or ID
            },
            permit: true,
            emails: true
        },
        orderBy: {id: "desc"},
        offset: page != null ? (page - 1) * resultsPerPage : 0,
        limit: resultsPerPage,
    });
    if (vouchersArr == null) {
        return res.status(500).json({message: "Errore nel reperire i tagliandi"});
    }
    const vouchersList: VoucherListEntry[] = [];
    for (const vouch of vouchersArr) {
        if (vouch.permit == null) {
            return res.status(500).json({message: "Errore nel reperire le associazioni di uno dei tagliandi"});
        }
        const currentState = getVoucherCurrentState(vouch.revoked, vouch.validFromDate, vouch.validToDate);
        vouchersList.push({
            id: vouch.id,
            createdAt: vouch.createdAt,
            updatedAt: vouch.updatedAt,

            number: vouch.number,
            revoked: vouch.revoked,
            currentState: currentState,
            validFromDate: new Date(vouch.validFromDate),
            validToDate: new Date(vouch.validToDate),

            applications: vouch.applications.map(a => ({
                id: a.id,
                registerNumber: a.registerNumber,
                registerDate: new Date(a.registerDate),
                cf: a.cf ?? "",
                firstname: a.firstname,
                lastname: a.lastname,
                email: a.email,
            })),

            permit: {
                id: vouch.permit.id,
                description: vouch.permit.description,
                disabled: vouch.permit.disabled,
            },

            // emails: vouch.emails.map(e => ({
            //     id: e.id,
            //     to: e.to,
            //     subject: e.subject,
            //     attachmentsPresent: e.attachments != null && e.attachments.length > 0,
            // })),
            vehicles: vouch.vehicles.map(v => ({
                id: v.id,
                createdAt: v.createdAt,
                updatedAt: v.updatedAt,
                plate: v.plate,
                model: v.model,
                brand: v.brand,
            })),
        });
    }
    res.json({
        message: "Tagliandi acquisiti con successo",
        vouchersList: vouchersList,
        pageData: {
            currentPage: page != null ? page : 1,
            totalPages: Math.ceil(totalAmount[0].count / resultsPerPage),
        }
    });
});

const getDetailedVoucher = async (tx: DbTransactionType, voucherID: number) => {
    const voucher = await tx.query.vouchers.findFirst({
        where: {
            id: voucherID,
        },
        with: {
            vehicles: true,
            applications: {
                with: {
                    vehicles: true,
                    outcome: true,
                    type: true,
                    outcomeAuthUser: true
                },
                orderBy: {outcomeDate: "desc", id: "desc"}, // choose application with most recent outcomeDate or ID
            },
            permit: {
                with: {
                    voucherDocTemplate: true,
                    authorizationDocTemplate: true
                },
            },
            emails: true
        },
    });
    return voucher;
}

type DetailedVoucherQueryResult = Awaited<ReturnType<typeof getDetailedVoucher>>;

const getVoucher = async (tx: DbTransactionType, voucherID: number) => {
    const voucher = await tx.query.vouchers.findFirst({
        where: {
            id: voucherID,
        }
    });
    return voucher;
}

type VoucherQueryResult = Awaited<ReturnType<typeof getVoucher>>;

const getVoucherDetails = async (voucher: DetailedVoucherQueryResult) => {
    if (voucher == null) {
        throw new Error("Tagliando non trovato");
    }
    if (voucher.permit == null) {
        throw new Error("Errore nel reperire le associazioni del tagliando");
    }
    const currentState = getVoucherCurrentState(voucher.revoked, voucher.validFromDate, voucher.validToDate);
    const voucherDetails: VoucherDetails = {
        id: voucher.id,
        createdAt: voucher.createdAt,
        updatedAt: voucher.updatedAt,
        number: voucher.number,
        revoked: voucher.revoked,
        currentState: currentState,
        validFromDate: new Date(voucher.validFromDate),
        validToDate: new Date(voucher.validToDate),
        notes: voucher.notes,
        generatedVoucherTemplatePath: voucher.generatedVoucherTemplatePath == null ? null : adjustPathForDownload(voucher.generatedVoucherTemplatePath),
        generatedAuthorizationTemplatePath: voucher.generatedAuthorizationTemplatePath == null ? null : adjustPathForDownload(voucher.generatedAuthorizationTemplatePath),
        generatedVoucherPdfPath: voucher.generatedVoucherPdfPath == null ? null : adjustPathForDownload(voucher.generatedVoucherPdfPath),
        generatedAuthorizationPdfPath: voucher.generatedAuthorizationPdfPath == null ? null : adjustPathForDownload(voucher.generatedAuthorizationPdfPath),
        signedAuthorizationPath: voucher.signedAuthorizationPath == null ? null : adjustPathForDownload(voucher.signedAuthorizationPath),
        permit: {
            id: voucher.permit.id,
            description: voucher.permit.description,
            printedName: voucher.permit.printedName,
            disabled: voucher.permit.disabled,
            simultaneousPlatesAmount: voucher.permit.simultaneousPlatesAmount,
            applicationPlatesAmount: voucher.permit.applicationPlatesAmount,
            voucherDurationDays: voucher.permit.voucherDurationDays
        },
        applications: voucher.applications.map(a => ({
            id: a.id,
            registerNumber: a.registerNumber,
            registerDate: new Date(a.registerDate),
            cf: a.cf ?? "",
            firstname: a.firstname,
            lastname: a.lastname,
            email: a.email,
            outcomeDate: a.outcomeDate == null ? null : new Date(a.outcomeDate),
            outcomeDescription: a.outcome == null ? "" : a.outcome.description,
            typeDescription: a.type == null ? "" : a.type.description,
            vehicles: a.vehicles == null ? [] : a.vehicles.map(v => ({
                id: v.id,
                createdAt: v.createdAt,
                updatedAt: v.updatedAt,
                plate: v.plate,
                model: v.model,
                brand: v.brand,
            })),
        })),
        emails: voucher.emails.map(e => ({
            id: e.id,
            to: e.to,
            subject: e.subject,
            attachmentsPresent: e.attachments != null && e.attachments.length > 0,
        })),
        vehicles: voucher.vehicles.map(v => ({
            id: v.id,
            createdAt: v.createdAt,
            updatedAt: v.updatedAt,
            plate: v.plate,
            model: v.model,
            brand: v.brand,
        })),
    };
    return voucherDetails;
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
                console.log("Tagliando non trovato");
                tx.rollback();
                return null;
            }
            const newTemplatesPaths = await generateTemplates(detailedVoucherQuery);
            generatedVoucherTemplatePath = newTemplatesPaths.generatedVoucherTemplatePath;
            generatedAuthorizationTemplatePath = newTemplatesPaths.generatedAuthorizationTemplatePath;
            const updatedVoucherResult = await tx.update(vouchers).set({
                ...(generatedVoucherTemplatePath !== null && {generatedVoucherTemplatePath: generatedVoucherTemplatePath}),
                ...(generatedAuthorizationTemplatePath !== null && {generatedAuthorizationTemplatePath: generatedAuthorizationTemplatePath}),
            }).where(eq(vouchers.id, voucherID));
            if (updatedVoucherResult == null || updatedVoucherResult.rowCount !== 1) {
                console.log("Errore durante l'aggiornamento del tagliando");
                deleteFileByPath(generatedVoucherTemplatePath);
                deleteFileByPath(generatedAuthorizationTemplatePath);
                tx.rollback();
                return null;
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
                    console.log("Errore durante l'aggiornamento del tagliando");
                    deleteFilesFields(reqFilesFields);
                    tx.rollback();
                    return null;
                }
                const detailedVoucherQuery = await getDetailedVoucher(tx, voucherID);
                if (detailedVoucherQuery == null) {
                    console.log("Tagliando non trovato");
                    tx.rollback();
                    return null;
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
                console.log("Tagliando non trovato");
                tx.rollback();
                return null;
            }
            if (detailedVoucherQuery.generatedVoucherTemplatePath == null || detailedVoucherQuery.generatedAuthorizationTemplatePath == null) {
                console.log("Modello tagliando o autorizzazione non trovati");
                tx.rollback();
                return null;
            }
            const newPDFPaths = await convertVoucherPDF(detailedVoucherQuery.generatedVoucherTemplatePath, detailedVoucherQuery.generatedAuthorizationTemplatePath);
            generatedVoucherPdfPath = newPDFPaths.generatedVoucherPdfPath;
            generatedAuthorizationPdfPath = newPDFPaths.generatedAuthorizationPdfPath;
            const updatedVoucherResult = await tx.update(vouchers).set({
                ...(generatedVoucherPdfPath !== null && {generatedVoucherPdfPath: generatedVoucherPdfPath}),
                ...(generatedAuthorizationPdfPath !== null && {generatedAuthorizationPdfPath: generatedAuthorizationPdfPath}),
            }).where(eq(vouchers.id, voucherID));
            if (updatedVoucherResult == null || updatedVoucherResult.rowCount !== 1) {
                console.log("Errore durante l'aggiornamento del tagliando");
                deleteFileByPath(generatedVoucherPdfPath);
                deleteFileByPath(generatedAuthorizationPdfPath);
                tx.rollback();
                return null;
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


const generateTemplates = async (voucher: DetailedVoucherQueryResult): Promise<{
    generatedVoucherTemplatePath: string,
    generatedAuthorizationTemplatePath: string
}> => {

    if (voucher == null || voucher.permit == null || voucher.applications == null) {
        throw new Error("Errore nel reperire il tagliando o le sue associazioni");
    }
    if (voucher.applications.length === 0) {
        throw new Error("Il tagliando non ha domande associate");
    }
    if (voucher.permit.voucherDocTemplate == null || voucher.permit.authorizationDocTemplate == null) {
        throw new Error("Errore nel reperire i modelli di tagliando e autorizzazione");
    }
    const voucherBaseTemplatePath = voucher.permit.voucherDocTemplate.path;
    const authorizationBaseTemplatePath = voucher.permit.authorizationDocTemplate.path;

    const targetApplication = voucher.applications[0];
    if (targetApplication == null) {
        throw new Error("Errore nel reperire la domanda associata al tagliando");
    }

    const voucherTemplateData: VoucherTemplateData = {
        numeroTagliandoStr: "" + voucher.number,
        descrizionePermessoStr: voucher.permit.printedName,
        tipologiaDomanda: targetApplication.type == null ? "N/A" : targetApplication.type.description,
        dataProtocolloStr: targetApplication.registerDate,
        numeroProtocolloStr: "" + targetApplication.registerNumber,
        dataCompletamentoStr: targetApplication.outcomeDate ?? voucher.validFromDate,
        dataInizioValiditaStr: voucher.validFromDate,
        dataFineValiditaStr: voucher.validToDate,
        cognomeIstruttoreStr: targetApplication.outcomeAuthUser == null ? "N/A" : targetApplication.outcomeAuthUser.lastname,
        nomeIstruttoreStr: targetApplication.outcomeAuthUser == null ? "N/A" : targetApplication.outcomeAuthUser.firstname,
        cognomeRichiedenteStr: targetApplication.lastname,
        nomeRichiedenteStr: targetApplication.firstname,
        comuneNascitaRichiedenteStr: targetApplication.birthCity == null ? "N/A" : targetApplication.birthCity,
        dataNascitaRichiedenteStr: targetApplication.birthDate == null ? "N/A" : targetApplication.birthDate,
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
        req.body.revoked == null || typeof req.body.revoked !== "boolean" ||
        req.body.notes == null || typeof req.body.notes !== "string" ||
        req.body.permitId == null || isNaN(parseInt(req.body.permitId)) ||
        req.body.vehicles == null || !Array.isArray(req.body.vehicles) || req.body.vehicles.some((elem: any) => typeof elem !== 'number')) {
        res.status(400).json({message: "Parametri di creazione non validi"});
        return;
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
            with: {vehicles: true},
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
                res.status(400).json({message: "Numero di veicoli non valido"});
                tx.rollback();
                return;
            }

            const updatedVoucher = await tx.update(vouchers).set({
                validFromDate: validFromDate,
                validToDate: validToDate,
                revoked: revoked,
                notes: notes,
                permitId: permitId
            }).where(eq(vouchers.id, voucherID)).returning();
            if (updatedVoucher == null || updatedVoucher.length !== 1 || updatedVoucher[0] == null) {
                console.log("Errore durante l'aggiornamento del tagliando");
                tx.rollback();
                return null;
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
                console.log("Errore durante l'aggiornamento delle associazioni tra tagliando e veicoli");
                tx.rollback();
                return null;
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
            const permit = await getPermit(tx, permitId);
            const permitHistoryId = permit.lastPermitHistoryId as number;

            if (permit.applicationPlatesAmount != vehicles.length) {
                res.status(400).json({message: "Numero di veicoli non valido"});
                tx.rollback();
                return;
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
        if (createdVoucherId == null) {
            res.status(500).json({message: "Errore durante l'inserimento del tagliando"});
            return;
        }
        res.status(200).json({message: "Tagliando creato con successo"});
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
    validFromDate: string,
    validToDate: string | null,
    notes: string,
    modifiedByAuthUserId: number,
    vehicles: number[]
};

export const createNewVoucher = async (tx: DbTransactionType, creationData: VoucherCreationData): Promise<{
    newVoucherId: number,
    newVoucherHistoryId: number
}> => {
    if (creationData.permitApplicationPlatesAmount !== creationData.vehicles.length) {
        throw new Error("Numero di targhe nel permesso non corrispondente al numero di veicoli");
    }
    const validFromDateT: Date = new Date(creationData.validFromDate);
    if (validFromDateT.toString() === "Invalid Date") {
        throw new Error("Errore durante la creazione del tagliando: data esito non valida");
    }
    const {number, durationDays} = await getVoucherNumerationNewData(tx, creationData.permitId);
    let expiryDateT: Date = new Date(validFromDateT);
    if (creationData.validToDate != null && creationData.validToDate.trim() !== "" && new Date(creationData.validToDate).toString() != "Invalid Date") {
        expiryDateT = new Date(creationData.validToDate);
    } else {
        expiryDateT.setDate(validFromDateT.getDate() + durationDays);
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

export const updateVoucherWithApplication = async (tx: DbTransactionType, voucherId: number, modifiedByAuthUserId: number): Promise<void> => {
    const foundVouchers = await tx.select().from(vouchers).where(eq(vouchers.id, voucherId));//.rightJoin(vouchersToVehicles, eq(vouchers.id, vouchersToVehicles.voucherId));
    if (foundVouchers == null || foundVouchers.length !== 1 || foundVouchers[0] == null) {
        throw new Error("Errore tagliando non trovato");
    }
    const foundVoucher = foundVouchers[0];
    const foundVoucherVehicles = await tx.select().from(vouchersToVehicles).where(eq(vouchersToVehicles.voucherId, foundVoucher.id));
    if (foundVoucherVehicles == null) {
        throw new Error("Errore veicoli non trovati per il tagliando");
    }
    const foundApplications = await tx.select().from(applications).where(eq(applications.voucherId, voucherId)).orderBy(desc(applications.outcomeDate));//.rightJoin(applicationsToVehicles, eq(applications.id, applicationsToVehicles.applicationId));
    if (foundApplications == null || foundApplications.length === 0 || foundApplications[0] == null) {
        throw new Error("Errore domanda non trovata");
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




