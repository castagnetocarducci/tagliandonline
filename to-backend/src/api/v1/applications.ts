import {type AuthRequest, middlewareAuthCheck} from "./auth.ts";
import {DatabaseManager} from "../../db/databaseManager.ts";
import {
    applications,
    applicationsEmailsHistory,
    applicationsHistory,
    applicationsHistoryToVehiclesHistory,
    applicationsToVehicles,
    vehicles,
    vouchers
} from "../../db/schema.ts";
import {and, count, eq, exists, gte, ilike, lte} from "drizzle-orm";
import {Router} from "express";
import {getPermit, getPermitsList} from "./permits.ts";
import {createNewVoucher, getLastVoucherHistoryId, updateVoucherWithApplication} from "./vouchers.ts";
import {getLastVehicleHistoryId} from "./vehicles.ts";
import {ConfigProvider} from "../../configProvider.ts";
import type {HistoryEvent, HistoryModificationMap} from "../../utils/commonTypes.ts";
import {checkAndUpdateValueModificationsMap} from "../../utils/commonFunctions.ts";

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
// type ApplicationPermitListEntry = {
//     id: number,
//     description: string,
//     disabled: boolean,
// }

type ApplicationListEntry = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    requestDate: Date,
    outcomeDate: Date | null,
    registerNumber: number,
    registerDate: Date,
    cf: string,
    firstname: string,
    lastname: string,
    email: string,
    targetHousePlace: string,
    targetHouseLandRegistrySheet: string,
    targetHouseLandRegistryMap: string,
    targetHouseLandRegistrySubaltern: string,
    targetHouseLandRegistryCategory: string,
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
    }[],
    vehicles: {
        id: number,
        createdAt: Date,
        updatedAt: Date,
        plate: string,
        model: string,
        brand: string,
    }[],
}

type ApplicationDetails = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    requestDate: Date,
    outcomeDate: Date | null,
    registerNumber: number,
    registerDate: Date,
    cf: string,
    firstname: string,
    lastname: string,
    email: string,
    birthDate: Date | null,
    birthCity: string | null,
    residencePlace: string | null,
    targetHousePlace: string | null,
    targetHouseLandRegistrySheet: string | null,
    targetHouseLandRegistryMap: string | null,
    targetHouseLandRegistrySubaltern: string | null,
    targetHouseLandRegistryCategory: string | null,
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
    }[],
    vehicles: {
        id: number,
        createdAt: Date,
        updatedAt: Date,
        plate: string,
        model: string,
        brand: string,
    }[],
}

applicationsRouter.post("/list", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        return res.status(401).json({message: "Non autorizzato"});
    }
    /*
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
    }[],
    vehicles: {
        id: number,
        createdAt: Date,
        updatedAt: Date,
        plate: string,
        model: string,
        brand: string,
    }[],

     */

    const {
        idFrom,
        idTo,
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
        permitId,
        outcomeId,
        typeId,
        voucherId,
        voucherNumber,
        emailTo,
        vehicleId,
        vehiclePlate,
        vehicleModel,
        vehicleBrand,
        page,
    } = req.body;
    const db = DatabaseManager.instance.db;
    const resultsPerPage = ConfigProvider.instance.configs.resultsPerPage;
    // const countConditions = [], queryConditions = [];
    const applicationsCountConditions = [], applicationsQueryConditions = [];
    const vehiclesCountConditions = [], vehiclesQueryConditions = [];
    const vouchersCountConditions = [], vouchersQueryConditions = [];
    const emailsCountConditions = [], emailsQueryConditions = [];
    if (idFrom != null && !isNaN(parseInt(idFrom))) {
        applicationsCountConditions.push(gte(applications.id, parseInt(idFrom)));
        applicationsQueryConditions.push({id: {gte: idFrom}});
    }
    if (idTo != null && !isNaN(parseInt(idTo))) {
        applicationsCountConditions.push(lte(applications.id, parseInt(idTo)));
        applicationsQueryConditions.push({id: {lte: idTo}});
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
    if (birthDate != null && new Date(birthDate).toString() !== "Invalid Date") {
        applicationsCountConditions.push(eq(applications.birthDate, new Date(birthDate).toLocaleDateString()));
        applicationsQueryConditions.push({birthDate: new Date(birthDate).toLocaleDateString()});
    }
    if (birthCity != null && birthCity.trim() !== "") {
        applicationsCountConditions.push(ilike(applications.birthCity, `%${birthCity}%`));
        applicationsQueryConditions.push({birthCity: {ilike: `%${birthCity}%`}});
    }
    if (residencePlace != null && residencePlace.trim() !== "") {
        applicationsCountConditions.push(ilike(applications.residencePlace, `%${residencePlace}%`));
        applicationsQueryConditions.push({residencePlace: {ilike: `%${residencePlace}%`}});
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
    if (permitId != null && !isNaN(parseInt(permitId))) {
        applicationsCountConditions.push(eq(applications.permitId, parseInt(permitId)));
        applicationsQueryConditions.push({permitId: parseInt(permitId)});
    }
    if (outcomeId != null && !isNaN(parseInt(outcomeId))) {
        applicationsCountConditions.push(eq(applications.outcomeId, parseInt(outcomeId)));
        applicationsQueryConditions.push({outcomeId: parseInt(outcomeId)});
    }
    if (typeId != null && !isNaN(parseInt(typeId))) {
        applicationsCountConditions.push(eq(applications.typeId, parseInt(typeId)));
        applicationsQueryConditions.push({typeId: parseInt(typeId)});
    }
    if (voucherId != null && !isNaN(parseInt(voucherId))) {
        applicationsCountConditions.push(eq(applications.voucherId, parseInt(voucherId)));
        applicationsQueryConditions.push({voucherId: parseInt(voucherId)});
    }

    if (voucherNumber != null && !isNaN(parseInt(voucherNumber))) {
        vouchersCountConditions.push(eq(vouchers.number, voucherNumber));
        vouchersQueryConditions.push({number: parseInt(voucherNumber)});
        // const vouchersSubQuery = db.select({id: vouchers.id}).from(vouchers).where(eq(vouchers.number, parseInt(voucherNumber)));
        // applicationsCountConditions.push(exists(vouchersSubQuery.where(eq(applications.voucherId, vouchers.id))));
    }

    if (emailTo != null && emailTo.trim() !== "") {
        emailsCountConditions.push(ilike(applicationsEmailsHistory.to, `%${emailTo}%`));
        emailsQueryConditions.push({to: {ilike: `%${emailTo}%`}});
        // const emailsSubQuery = db.select({id: applicationsEmailsHistory.id}).from(applicationsEmailsHistory).where(ilike(applicationsEmailsHistory.to, `%${emailTo}%`));
        // applicationsCountConditions.push(exists(emailsSubQuery.where(eq(applications.id, applicationsEmailsHistory.applicationId))));
    }

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
    const vehiclesCountFilterSubQuery = db.select().from(applicationsToVehicles)
        .leftJoin(vehicles, eq(applicationsToVehicles.vehicleId, vehicles.id))
        .where(and(eq(applications.id, applicationsToVehicles.applicationId), ...vehiclesCountConditions));
    const vouchersCountFilterSubQuery = db.select().from(vouchers)
        .where(and(eq(applications.voucherId, vouchers.id), ...vouchersCountConditions));
    const emailsCountFilterSubQuery = db.select().from(applicationsEmailsHistory)
        .where(and(eq(applications.id, applicationsEmailsHistory.applicationId), ...emailsCountConditions));

    const totalAmount = await db.select({count: count()}).from(applications)
        .where(and(...applicationsCountConditions,
            exists(vehiclesCountFilterSubQuery),
            exists(vouchersCountFilterSubQuery),
            exists(emailsCountFilterSubQuery)
        ));
    if (totalAmount == null || totalAmount.length !== 1 || totalAmount[0] == null) {
        return res.status(500).json({message: "Errore nel conteggio dei risultati"});
    }

    // const vehiclesArr = await db.select().from(applications)
    //     .where(and(...applicationsSearchConditions))
    //     .orderBy(desc(applications.id))
    //     .offset(page != null ? (page - 1) * resultsPerPage : 0).limit(resultsPerPage);

    // query section
    const applicationsArr = await db.query.applications.findMany({
        where: {
            AND: [
                ...applicationsQueryConditions,
            ]
        },
        with: {
            vehicles: {
                where: {AND: [...vehiclesQueryConditions],},
            },
            permit: true,
            outcome: true,
            type: true,
            voucher: {
                where: {AND: [...vouchersQueryConditions]},
            },
            emails: {
                where: {AND: [...emailsQueryConditions]},
            },
        },
        orderBy: {id: "desc"},
        offset: page != null ? (page - 1) * resultsPerPage : 0,
        limit: resultsPerPage,
    });
    if (applicationsArr == null) {
        return res.status(500).json({message: "Errore nel reperire le domande"});
    }
    const applicationsList: ApplicationListEntry[] = [];
    for (const app of applicationsArr) {
        if (app.permit == null || app.outcome == null || app.type == null) {
            return res.status(500).json({message: "Errore nel reperire le associazioni di una delle domande"});
        }
        applicationsList.push({
            id: app.id,
            createdAt: app.createdAt,
            updatedAt: app.updatedAt,
            requestDate: new Date(app.requestDate),
            outcomeDate: app.outcomeDate != null ? new Date(app.outcomeDate) : null,
            registerNumber: app.registerNumber,
            registerDate: new Date(app.registerDate),
            cf: app.cf ?? "",
            firstname: app.firstname,
            lastname: app.lastname,
            email: app.email,
            targetHousePlace: app.targetHousePlace ?? "",
            targetHouseLandRegistrySheet: app.targetHouseLandRegistrySheet ?? "",
            targetHouseLandRegistryMap: app.targetHouseLandRegistryMap ?? "",
            targetHouseLandRegistrySubaltern: app.targetHouseLandRegistrySubaltern ?? "",
            targetHouseLandRegistryCategory: app.targetHouseLandRegistryCategory ?? "",
            permit: {
                id: app.permit.id,
                description: app.permit.description,
                disabled: app.permit.disabled,
            },
            outcome: {
                id: app.outcome.id,
                description: app.outcome.description,
            },
            type: {
                id: app.type.id,
                description: app.type.description,
            },
            voucher: app.voucher ? {
                id: app.voucher.id,
                number: app.voucher.number,
                revoked: app.voucher.revoked,
                validFromDate: new Date(app.voucher.validFromDate),
                validToDate: new Date(app.voucher.validToDate),
            } : null,
            emails: app.emails.map(e => ({
                id: e.id,
                to: e.to,
                subject: e.subject,
                attachmentsPresent: e.attachments != null && e.attachments.length > 0,
            })),
            vehicles: app.vehicles.map(v => ({
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
        message: "Domande acquisite con successo",
        applicationsList: applicationsList,
        pageData: {
            currentPage: page != null ? page : 1,
            totalPages: Math.ceil(totalAmount[0].count / resultsPerPage),
        }
    });
});

applicationsRouter.get("/detail/:applicationID", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    if (req.params.applicationID == null || ("" + req.params.applicationID).trim() == "") {
        res.status(400).json({message: "Domanda non trovata"});
        return;
    }
    const applicationID = parseInt(req.params.applicationID as string);
    if (isNaN(applicationID)) {
        res.status(400).json({message: "ID domanda non valido"});
        return;
    }

    const db = DatabaseManager.instance.db;
    const application = await db.query.applications.findFirst({
        where: {
            id: applicationID,
        },
        with: {
            vehicles: true,
            permit: true,
            outcome: true,
            type: true,
            voucher: true,
            emails: true,
            outcomeAuthUser: true,
        }
    });
    if (application == null) {
        res.status(500).json({message: "Domanda non trovata"});
        return;
    }
    if (application.permit == null || application.outcome == null || application.type == null) {
        res.status(500).json({message: "Errore nel reperire le associazioni della domanda"});
        return;
    }
    const applicationDetails: ApplicationDetails = {
        id: application.id,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
        requestDate: new Date(application.requestDate),
        outcomeDate: application.outcomeDate != null ? new Date(application.outcomeDate) : null,
        outcomeAuthUser: application.outcomeAuthUser != null ? {
            id: application.outcomeAuthUser.id,
            username: application.outcomeAuthUser.username
        } : null,
        registerNumber: application.registerNumber,
        registerDate: new Date(application.registerDate),
        cf: application.cf ?? "",
        firstname: application.firstname,
        lastname: application.lastname,
        email: application.email,
        birthDate: application.birthDate != null ? new Date(application.birthDate) : null,
        birthCity: application.birthCity,
        residencePlace: application.residencePlace,
        targetHousePlace: application.targetHousePlace,
        targetHouseLandRegistrySheet: application.targetHouseLandRegistrySheet,
        targetHouseLandRegistryMap: application.targetHouseLandRegistryMap,
        targetHouseLandRegistrySubaltern: application.targetHouseLandRegistrySubaltern,
        targetHouseLandRegistryCategory: application.targetHouseLandRegistryCategory,
        notes: application.notes,
        permit: {
            id: application.permit.id,
            description: application.permit.description,
            disabled: application.permit.disabled,
        },
        outcome: {
            id: application.outcome.id,
            description: application.outcome.description,
        },
        type: {
            id: application.type.id,
            description: application.type.description,
        },
        voucher: application.voucher ? {
            id: application.voucher.id,
            number: application.voucher.number,
            revoked: application.voucher.revoked,
            validFromDate: new Date(application.voucher.validFromDate),
            validToDate: new Date(application.voucher.validToDate),
        } : null,
        emails: application.emails.map(e => ({
            id: e.id,
            to: e.to,
            subject: e.subject,
            attachmentsPresent: e.attachments != null && e.attachments.length > 0,
        })),
        vehicles: application.vehicles.map(v => ({
            id: v.id,
            createdAt: v.createdAt,
            updatedAt: v.updatedAt,
            plate: v.plate,
            model: v.model,
            brand: v.brand,
        })),
    };

    res.json({
        message: "Domanda acquisita con successo",
        vehicle: applicationDetails
    });
});


applicationsRouter.get("/history/:applicationID", middlewareAuthCheck(["admin", "operatore", "vigile"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    if (req.params.applicationID == null || ("" + req.params.applicationID).trim() == "") {
        res.status(400).json({message: "Domanda non trovata"});
        return;
    }
    const applicationID = parseInt(req.params.applicationID as string);
    if (isNaN(applicationID)) {
        res.status(400).json({message: "ID domanda non valido"});
        return;
    }

    try {
        const db = DatabaseManager.instance.db;
        const applicationHistory = await db.query.applicationsHistory.findMany(
            {
                where: {applicationId: applicationID},
                with: {
                    modifiedByAuthUser: true,
                    vehiclesHistory: true,
                    permitHistory: true,
                    outcome: true,
                    type: true,
                    voucherHistory: true,
                    outcomeAuthUser: true,
                },
                orderBy: {createdAt: "asc"},
            });
        if (applicationHistory == null || applicationHistory.length === 0) {
            res.status(500).json({message: "Storico domanda non trovato"});
            return;
        }

        const vehicleHistoryRes: HistoryEvent[] = [];
        const currModificationEntries: HistoryModificationMap = {};
        applicationHistory.forEach((historyElem) => {
            const diffModificationEntries: HistoryModificationMap = {};

            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "requestDate", {
                description: "Data richiesta",
                value: historyElem.registerDate != null ? historyElem.registerDate : ""
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "outcomeDate", {
                description: "Data completamento",
                value: historyElem.outcomeDate != null ? historyElem.outcomeDate : ""
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "outcomeAuthUser", {
                description: "Utente completamento",
                value: historyElem.outcomeAuthUser != null ? historyElem.outcomeAuthUser.username : ""
            });

            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "registerNumber", {
                description: "Numero protocollo",
                value: "" + historyElem.registerNumber
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "registerDate", {
                description: "Data protocollo",
                value: historyElem.registerDate != null ? historyElem.registerDate : ""
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "cf", {
                description: "CF",
                value: historyElem.cf != null ? historyElem.cf : ""
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "firstname", {
                description: "Nome",
                value: historyElem.firstname
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "lastname", {
                description: "Cognome",
                value: historyElem.lastname
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "email", {
                description: "Email",
                value: historyElem.email
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "birthDate", {
                description: "Data di nascita",
                value: historyElem.birthDate != null ? historyElem.birthDate : ""
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "birthCity", {
                description: "Luogo di nascita",
                value: historyElem.birthCity != null ? historyElem.birthCity : ""
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "residencePlace", {
                description: "Luogo di residenza",
                value: historyElem.residencePlace != null ? historyElem.residencePlace : ""
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "targetHousePlace", {
                description: "Luogo abitazione designata",
                value: historyElem.targetHousePlace != null ? historyElem.targetHousePlace : ""
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "targetHouseLandRegistrySheet", {
                description: "Foglio abitazione designata",
                value: historyElem.targetHouseLandRegistrySheet != null ? historyElem.targetHouseLandRegistrySheet : ""
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "targetHouseLandRegistryMap", {
                description: "Mappale abitazione designata",
                value: historyElem.targetHouseLandRegistryMap != null ? historyElem.targetHouseLandRegistryMap : ""
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "targetHouseLandRegistrySubaltern", {
                description: "Subalterno abitazione designata",
                value: historyElem.targetHouseLandRegistrySubaltern != null ? historyElem.targetHouseLandRegistrySubaltern : ""
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "targetHouseLandRegistryCategory", {
                description: "Categoria abitazione designata",
                value: historyElem.targetHouseLandRegistryCategory != null ? historyElem.targetHouseLandRegistryCategory : ""
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "notes", {
                description: "Note",
                value: historyElem.notes
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "permitHistory", {
                description: "Permesso",
                value: historyElem.permitHistory != null ? historyElem.permitHistory.description : ""
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "outcome", {
                description: "Esito",
                value: historyElem.outcome != null ? historyElem.outcome.description : ""
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "type", {
                description: "Tipo",
                value: historyElem.type != null ? historyElem.type.description : ""
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "voucherHistory", {
                description: "Tagliando",
                value: historyElem.voucherHistory != null ? (historyElem.voucherHistory.number + " " + "(" + historyElem.voucherHistory.voucherId + ")") : ""
            });
            checkAndUpdateValueModificationsMap(diffModificationEntries, currModificationEntries, "vehicles", {
                description: "Veicoli",
                value: historyElem.vehiclesHistory != null ? ("["+historyElem.vehiclesHistory.map((v) =>v.vehicleId + ": " + v.plate + ", " + v.model + ", " + v.brand).join("; ") + "]") : ""
            });

            vehicleHistoryRes.push({
                userId: historyElem.modifiedByAuthUser ? historyElem.modifiedByAuthUser.id : 0,
                username: historyElem.modifiedByAuthUser ? historyElem.modifiedByAuthUser.username : "unknown",
                timestamp: historyElem.createdAt,
                modificationsMap: diffModificationEntries
            });
        });

        res.status(200).json({
            message: "Storico della domanda acquisito con successo",
            vehicleHistory: vehicleHistoryRes
        });
    } catch (e) {
        res.status(500).json({message: "Errore nel reperire lo storico della domanda: " + e});
        return;
    }
});

const checkApplicationParameters = (req: AuthRequest) => {
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
    if (req.body.requestDate != null && req.body.requestDate.trim()=== "") {req.body.requestDate = null;}
    if (req.body.outcomeDate != null && req.body.outcomeDate.trim()=== "") {req.body.outcomeDate = null;}
    if (req.body.birthDate != null && req.body.birthDate.trim()=== "") {req.body.birthDate = null;}

    if (
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
        // outcomeAuthUserId,
        voucherId,
        vehicles,
        //EXTRA
        createVoucher, //boolean for creating a voucher for this application
        //updateVoucher,
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
            // outcomeAuthUserId === toUpdateApplication.outcomeAuthUserId &&
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
            const vehiclesToInsertApplicationHistory: { applicationHistoryId: number, vehicleHistoryId: number }[] = [];
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
        res.status(200).json({message: "Domanda aggiornata con successo"});
        return;
    } catch (e) {
        res.status(500).json({message: "Errore durante l'aggiornamento della domanda: " + e});
        return;
    }
});

applicationsRouter.post("/new", middlewareAuthCheck(["admin", "operatore"]), async (req: AuthRequest, res) => {
    if (req.user == null) {
        res.status(401).json({message: "Non autorizzato"});
        return;
    }
    const modifiedByAuthUserId = req.user.id;

    if (!checkApplicationParameters(req)) {
        res.status(400).json({message: "Parametri di creazione non validi"});
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
        // outcomeAuthUserId,
        voucherId,
        vehicles,
        //EXTRA
        createVoucher, //boolean for creating a voucher for this application
        //updateVoucher,
    } = req.body;

    const db = DatabaseManager.instance.db;
    try {

        const createdApplicationId = await db.transaction(async (tx) => {
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

            const createdApplication = await tx.insert(applications).values({
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
                outcomeAuthUserId: modifiedByAuthUserId,
            }).returning();
            if (createdApplication == null || createdApplication.length !== 1 || createdApplication[0] == null) {
                console.log("Errore durante la creazione della domanda");
                tx.rollback();
                return null;
            }
            const createdApplicationId = createdApplication[0].id;

            // const deleteResult = await tx.delete(applicationsToVehicles).where(eq(applicationsToVehicles.applicationId, applicationID));
            const vehiclesToInsertApplication = (vehicles as number[]).map((vehicleId) => {
                return {
                    applicationId: createdApplicationId,
                    vehicleId: vehicleId as number,
                }
            });

            //if (createdVoucherId == null) {
            //    await updateVoucherWithApplication(tx, voucherId, modifiedByAuthUserId);
            //}

            const insertResult = await tx.insert(applicationsToVehicles).values(vehiclesToInsertApplication);
            if (insertResult == null || insertResult.rowCount !== vehicles.length) {
                console.log("Errore durante l'inserimento delle associazioni tra domanda e veicoli");
                tx.rollback();
                return null;
            }

            let voucherHistoryId: number | null = null;
            if (voucherId != null) {
                voucherHistoryId = await getLastVoucherHistoryId(tx, voucherId);
            }

            const createdApplicationHistory = await tx.insert(applicationsHistory).values({
                applicationId: createdApplication[0].id,
                modifiedByAuthUserId: modifiedByAuthUserId,

                requestDate: createdApplication[0].requestDate,
                outcomeDate: createdApplication[0].outcomeDate,
                registerNumber: createdApplication[0].registerNumber,
                registerDate: createdApplication[0].registerDate,
                cf: createdApplication[0].cf,
                firstname: createdApplication[0].firstname,
                lastname: createdApplication[0].lastname,
                email: createdApplication[0].email,
                birthDate: createdApplication[0].birthDate,
                birthCity: createdApplication[0].birthCity,
                residencePlace: createdApplication[0].residencePlace,
                targetHousePlace: createdApplication[0].targetHousePlace,
                targetHouseLandRegistrySheet: createdApplication[0].targetHouseLandRegistrySheet,
                targetHouseLandRegistryMap: createdApplication[0].targetHouseLandRegistryMap,
                targetHouseLandRegistrySubaltern: createdApplication[0].targetHouseLandRegistrySubaltern,
                targetHouseLandRegistryCategory: createdApplication[0].targetHouseLandRegistryCategory,
                notes: createdApplication[0].notes,
                permitHistoryId: permitHistoryId,
                outcomeId: createdApplication[0].outcomeId,
                typeId: createdApplication[0].typeId,
                outcomeAuthUserId: createdApplication[0].outcomeAuthUserId,
                voucherHistoryId: (createdVoucherHistoryId != null ? createdVoucherHistoryId : voucherHistoryId),
            }).returning();
            if (createdApplicationHistory == null || createdApplicationHistory.length !== 1 || createdApplicationHistory[0] == null) {
                console.log("Errore durante l'inserimento dello storico della domanda");
                tx.rollback();
                return null;
            }
            const updatedApplicationHistoryId = createdApplicationHistory[0].id;
            const updateResult = await tx.update(applications)
                .set({lastApplicationHistoryId: updatedApplicationHistoryId})
                .where(eq(applications.id, createdApplication[0].id));
            const vehiclesToInsertApplicationHistory: { applicationHistoryId: number, vehicleHistoryId: number }[] = [];
            for (const vehicleId of vehicles) {
                const vehicleHistoryId = await getLastVehicleHistoryId(tx, vehicleId);
                vehiclesToInsertApplicationHistory.push({
                    applicationHistoryId: updatedApplicationHistoryId,
                    vehicleHistoryId: vehicleHistoryId,
                });
            }

            const insertASVSResult = await tx.insert(applicationsHistoryToVehiclesHistory).values(vehiclesToInsertApplicationHistory);
            if (insertASVSResult == null || insertASVSResult.rowCount !== vehicles.length) {
                console.log("Errore durante l'inserimento delle associazioni tra storico domanda e storico veicoli");
                tx.rollback();
                return null;
            }

            if (updateResult == null || updateResult.rowCount !== 1) {
                console.log("Errore durante l'aggiornamento della domanda con lo storico");
                tx.rollback();
                return null;
            }
            return createdApplication[0].id;
        });
        if (createdApplicationId == null) {
            res.status(500).json({message: "Errore durante l'inserimento della domanda"});
            return;
        }
        res.status(200).json({message: "Domanda creata con successo"});
        return;
    } catch (e) {
        res.status(500).json({message: "Errore durante la creazione della domanda: " + e});
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
                applicationTypes: applicationTypeList,
                applicationOutcomes: applicationOutcomeList,
                permits: permitsList
            });
        } catch (e) {
            res.status(500).json({message: "Errore nel reperire permessi, tipi o esiti domande: " + e});
        }
    }
);


