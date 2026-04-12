import {type AuthRequest, middlewareAuthCheck} from "./auth.ts";
import {DatabaseManager} from "../../db/databaseManager.ts";
import type {HistoryEvent, HistoryModificationMap} from "../../utils/commonTypes.ts";
import {checkAndUpdateValueModificationsMap} from "../../utils/commonFunctions.ts";
import {
    applications, applicationsEmailsHistory, applicationsHistoryToVehiclesHistory,
    applicationsToVehicles, numerationRegisters,
    permits,
    vehicles,
    vehiclesHistory,
    vouchers, vouchersEmailsHistory,
    vouchersHistory, vouchersHistoryToVehiclesHistory, vouchersToVehicles
} from "../../db/schema.ts";
import {and, count, desc, eq, exists, gte, ilike, lte} from "drizzle-orm";
import {Router} from "express";
import {ConfigProvider} from "../../configProvider.ts";
import {date, PgAsyncTransaction, text, varchar} from "drizzle-orm/pg-core";
import {commonColumns} from "../../db/common.columns.ts";
import {getVoucherNumerationNewData} from "./numerations.ts";
import {getLastVehicleHistoryId} from "./vehicles.ts";
import {getPermit} from "./permits.ts";

export const vouchersRouter = Router();

type VoucherListEntry = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    number: number,
    revoked: boolean,
    validFromDate: Date,
    validToDate: Date,
    permit: {
        id: number,
        description: string,
        disabled: boolean,
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
    validFromDate: Date,
    validToDate: Date,
    notes: string,
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
        registerNumber: number,
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
            applications: true,
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
        vouchersList.push({
            id: vouch.id,
            createdAt: vouch.createdAt,
            updatedAt: vouch.updatedAt,

            number: vouch.number,
            revoked: vouch.revoked,
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
//         applications: vehicle.applications.map((app) => app.id),
//         vouchers: vehicle.vouchers.map((voucher) => voucher.id),
//     };
//
//     res.json({
//         message: "Veicolo acquisito con successo",
//         vehicle: vehicleDetails
//     });
// });
//
//
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
//
// vehiclesRouter.post("/edit/:vehicleID", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
//     if (req.user == null) {
//         res.status(401).json({message: "Non autorizzato"});
//         return;
//     }
//     const modifiedByAuthUserId = req.user.id;
//
//     if (req.params.vehicleID == null || ("" + req.params.vehicleID).trim() == "") {
//         res.status(400).json({message: "Veicolo non trovato"});
//         return;
//     }
//     const vehicleID = parseInt(req.params.vehicleID as string);
//
//
//     if (req.body.plate == null || req.body.plate.trim() === "" ||
//         req.body.model == null || req.body.model.trim() === "" ||
//         req.body.brand == null || req.body.brand.trim() === "") {
//         res.status(400).json({message: "Richiesta con campi mancanti"});
//         return;
//     }
//     let {
//         plate,
//         model,
//         brand,
//     } = req.body;
//     plate = plate.toUpperCase();
//     const db = DatabaseManager.instance.db;
//     try {
//         const toUpdateVehicle = await db.query.vehicles.findFirst(
//             {
//                 where: {id: vehicleID}
//             });
//         if (toUpdateVehicle == null) {
//             res.status(500).json({message: "Veicolo non trovato"});
//             return;
//         }
//         if (plate === toUpdateVehicle.plate &&
//             model === toUpdateVehicle.model &&
//             brand === toUpdateVehicle.brand) {
//             res.status(200).json({message: "Nessuna modifica effettuata"});
//             return;
//         }
//
//         const updatedVehicleId = await db.transaction(async (tx) => {
//             const updatedVehicle = await tx.update(vehicles).set({
//                 plate,
//                 model,
//                 brand,
//             }).where(eq(vehicles.id, vehicleID)).returning();
//             if (updatedVehicle == null || updatedVehicle.length !== 1 || updatedVehicle[0] == null) {
//                 console.log("Errore durante l'aggiornamento del veicolo");
//                 tx.rollback();
//                 return null;
//             }
//             const updatedVehicleHistory = await tx.insert(vehiclesHistory).values({
//                 vehicleId: updatedVehicle[0].id,
//                 modifiedByAuthUserId: modifiedByAuthUserId,
//
//                 plate: updatedVehicle[0].plate,
//                 model: updatedVehicle[0].model,
//                 brand: updatedVehicle[0].brand,
//             }).returning();
//             if (updatedVehicleHistory == null || updatedVehicleHistory.length !== 1 || updatedVehicleHistory[0] == null) {
//                 console.log("Errore durante l'aggiornamento dello storico del veicolo");
//                 tx.rollback();
//                 return null;
//             }
//             const updateResult = await tx.update(vehicles)
//                 .set({lastVehiclesHistoryId: updatedVehicleHistory[0].id})
//                 .where(eq(vehicles.id, updatedVehicle[0].id));
//             if (updateResult == null || updateResult.rowCount !== 1) {
//                 console.log("Errore durante l'aggiornamento del veicolo con lo storico");
//                 tx.rollback();
//                 return null;
//             }
//             return updatedVehicle[0].id;
//         });
//         if (updatedVehicleId == null) {
//             res.status(500).json({message: "Errore durante l'inserimento del veicolo"});
//             return;
//         }
//         res.status(200).json({message: "Veicolo aggiornato con successo"});
//         return;
//     } catch (e) {
//         res.status(500).json({message: "Errore durante l'aggiornamento: " + e});
//         return;
//     }
//
// });
//
//
// vouchersRouter.post("/new", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
//     if (req.user == null) {
//         res.status(401).json({message: "Non autorizzato"});
//         return;
//     }
//     const modifiedByAuthUserId = req.user.id;
//
//     /**
//      * validFromDate: date().notNull(),
//      *     validToDate: date().notNull(),
//      *     notes: commonColumns.notes(),
//      *     permitId: integer().notNull().references(() => permits.id),
//      */
//
//
//     if (req.body.validFromDate == null || req.body.validFromDate.trim() === "" ||
//         req.body.validToDate == null || req.body.validToDate.trim() === "" ||
//         req.body.notes == null ||
//         req.body.permitId == null || isNaN(parseInt(req.body.permitId))) {
//         res.status(400).json({message: "Richiesta con campi mancanti"});
//         return;
//     }
//     const {
//         validFromDate,
//         validToDate,
//         notes,
//         permitId,
//     } = req.body;
//
//     const db = DatabaseManager.instance.db;
//     try {
//
//
//         const insertedVehicleId = await db.transaction(async (tx) => {
//             const insertedVehicle = await tx.insert(vehicles).values({
//                 plate,
//                 model,
//                 brand,
//             }).returning();
//             if (insertedVehicle == null || insertedVehicle.length !== 1 || insertedVehicle[0] == null) {
//                 console.log("Errore durante l'inserimento del veicolo");
//                 tx.rollback();
//                 return null;
//             }
//             const insertedVehicleHistory = await tx.insert(vehiclesHistory).values({
//                 vehicleId: insertedVehicle[0].id,
//                 modifiedByAuthUserId: modifiedByAuthUserId,
//
//                 plate: insertedVehicle[0].plate,
//                 model: insertedVehicle[0].model,
//                 brand: insertedVehicle[0].brand
//             }).returning();
//             if (insertedVehicleHistory == null || insertedVehicleHistory.length !== 1 || insertedVehicleHistory[0] == null) {
//                 console.log("Errore durante l'inserimento dello storico del veicolo");
//                 tx.rollback();
//                 return null;
//             }
//             const updateResult = await tx.update(vehicles)
//                 .set({lastVehiclesHistoryId: insertedVehicleHistory[0].id})
//                 .where(eq(vehicles.id, insertedVehicle[0].id));
//             if (updateResult == null || updateResult.rowCount !== 1) {
//                 console.log("Errore durante l'aggiornamento del veicolo con lo storico");
//                 tx.rollback();
//                 return null;
//             }
//             return insertedVehicle[0].id;
//         });
//
//         if (insertedVehicleId == null) {
//             res.status(500).json({message: "Errore durante l'inserimento del veicolo"});
//             return;
//         }
//         res.status(200).json({message: "Veicolo inserito con successo", id: insertedVehicleId});
//         return;
//     } catch (e) {
//         res.status(500).json({message: "Errore durante l'inserimento: " + e});
//         return;
//     }
// });
//
//

export type VoucherCreationData = {
    permitId: number,
    permitHistoryId: number,
    permitApplicationPlatesAmount: number,
    validFromDate: string,
    notes: string,
    modifiedByAuthUserId: number,
    vehicles: number[]
};

export const createNewVoucher = async (tx: PgAsyncTransaction<any>, creationData: VoucherCreationData): Promise<{
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
    const expiryDateT: Date = new Date(validFromDateT);
    expiryDateT.setDate(expiryDateT.getDate() + durationDays);
    const createdVoucher = await tx.insert(vouchers).values({
        number: number,
        revoked: false,
        validFromDate: validFromDateT.toDateString(),
        validToDate: expiryDateT.toDateString(),
        notes: "",
        permitId: creationData.permitId,
        generatedVoucherTemplatePath: "",
        generatedAuthorizationTemplatePath: "",
        generatedVoucherPdfPath: "",
        generatedAuthorizationPdfPath: "",
        signedAuthorizationPath: "",
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

    const createdVoucherHistory = await tx.insert(vouchersHistory).values({
        voucherId: createdVoucherId,
        modifiedByAuthUserId: creationData.modifiedByAuthUserId,

        number: createdVoucher[0].number,
        revoked: createdVoucher[0].revoked,
        validFromDate: createdVoucher[0].validFromDate,
        validToDate: createdVoucher[0].validToDate,
        notes: createdVoucher[0].notes,
        permitHistoryId: creationData.permitHistoryId,
        generatedVoucherTemplatePath: createdVoucher[0].generatedVoucherTemplatePath,
        generatedAuthorizationTemplatePath: createdVoucher[0].generatedAuthorizationTemplatePath,
        generatedVoucherPdfPath: createdVoucher[0].generatedVoucherPdfPath,
        generatedAuthorizationPdfPath: createdVoucher[0].generatedAuthorizationPdfPath,
        signedAuthorizationPath: createdVoucher[0].signedAuthorizationPath,
    }).returning();
    if (createdVoucherHistory == null || createdVoucherHistory.length !== 1 || createdVoucherHistory[0] == null) {
        throw new Error("Creazione storico tagliando fallita: " + JSON.stringify(createdVoucherHistory));
    }
    const createdVoucherHistoryId = createdVoucherHistory[0].id;
    const updateResult = await tx.update(vouchers)
        .set({lastVoucherHistoryId: createdVoucherHistoryId})
        .where(eq(vouchers.id, createdVoucher[0].id));
    const vehiclesToInsertVoucherHistory: { voucherHistoryId: number, vehicleHistoryId: number }[] = [];
    for (const vehicleId of creationData.vehicles) {
        const vehicleHistoryId = await getLastVehicleHistoryId(tx, vehicleId);
        vehiclesToInsertVoucherHistory.push({
            voucherHistoryId: createdVoucherHistoryId,
            vehicleHistoryId: vehicleHistoryId,
        });
    }
    const insertASVSResult = await tx.insert(vouchersHistoryToVehiclesHistory).values(vehiclesToInsertVoucherHistory);
    if (insertASVSResult == null || insertASVSResult.rowCount !== creationData.vehicles.length) {
        throw new Error("Errore durante l'aggiornamento delle associazioni tra storico tagliando e storico veicoli");
    }
    if (updateResult == null || updateResult.rowCount !== 1) {
        throw new Error("Errore durante l'aggiornamento del tagliando con lo storico");
    }
    return {
        newVoucherId: createdVoucherId,
        newVoucherHistoryId: createdVoucherHistoryId,
    };
}

export const getLastVoucherHistoryId = async (tx: PgAsyncTransaction<any>, voucherId: number): Promise<number> => {
    const foundVouchers = await tx.select().from(vouchers).where(eq(vouchers.id, voucherId));
    if (foundVouchers == null || foundVouchers.length !== 1 || foundVouchers[0] == null || foundVouchers[0].lastVoucherHistoryId == null) {
        throw new Error("Errore tagliando non trovato");
    }
    return foundVouchers[0].lastVoucherHistoryId;
}

export const updateVoucherWithApplication = async (tx: PgAsyncTransaction<any>, voucherId: number, modifiedByAuthUserId: number): Promise<void> => {
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
    const updatedVoucherId = updatedVoucher[0].id;

    const createdVoucherHistory = await tx.insert(vouchersHistory).values({
        voucherId: updatedVoucherId,
        modifiedByAuthUserId: modifiedByAuthUserId,

        number: updatedVoucher[0].number,
        revoked: updatedVoucher[0].revoked,
        validFromDate: updatedVoucher[0].validFromDate,
        validToDate: updatedVoucher[0].validToDate,
        notes: updatedVoucher[0].notes,
        permitHistoryId: permit.lastPermitHistoryId as number,
        generatedVoucherTemplatePath: updatedVoucher[0].generatedVoucherTemplatePath,
        generatedAuthorizationTemplatePath: updatedVoucher[0].generatedAuthorizationTemplatePath,
        generatedVoucherPdfPath: updatedVoucher[0].generatedVoucherPdfPath,
        generatedAuthorizationPdfPath: updatedVoucher[0].generatedAuthorizationPdfPath,
        signedAuthorizationPath: updatedVoucher[0].signedAuthorizationPath,
    }).returning();
    if (createdVoucherHistory == null || createdVoucherHistory.length !== 1 || createdVoucherHistory[0] == null) {
        throw new Error("Creazione storico tagliando fallita: " + JSON.stringify(createdVoucherHistory));
    }
    const createdVoucherHistoryId = createdVoucherHistory[0].id;
    const updateResult = await tx.update(vouchers)
        .set({lastVoucherHistoryId: createdVoucherHistoryId})
        .where(eq(vouchers.id, updatedVoucher[0].id));
    const vehiclesToInsertVoucherHistory: { voucherHistoryId: number, vehicleHistoryId: number }[] = [];
    for (const elem of vehiclesToInsertVoucher) {
        const vehicleHistoryId = await getLastVehicleHistoryId(tx, elem.vehicleId);
        vehiclesToInsertVoucherHistory.push({
            voucherHistoryId: createdVoucherHistoryId,
            vehicleHistoryId: vehicleHistoryId,
        });
    }
    const insertASVSResult = await tx.insert(vouchersHistoryToVehiclesHistory).values(vehiclesToInsertVoucherHistory);
    if (insertASVSResult == null || insertASVSResult.rowCount !== vehiclesToInsertVoucherHistory.length) {
        throw new Error("Errore durante l'aggiornamento delle associazioni tra storico tagliando e storico veicoli");
    }
    if (updateResult == null || updateResult.rowCount !== 1) {
        throw new Error("Errore durante l'aggiornamento del tagliando con lo storico");
    }
}




