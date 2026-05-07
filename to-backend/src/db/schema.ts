import {
    type AnyPgColumn,
    date,
    index,
    integer,
    pgSchema,
    primaryKey,
    text,
    timestamp,
    uniqueIndex,
    varchar
} from "drizzle-orm/pg-core";
import {commonColumns} from "./common.columns.ts";
import {generatePasswordResetToken, passwordResetTokenByteLength} from "../utils/pswHashing.ts";
import {sqlLower} from "./common.functions.ts";

export const toSchema = pgSchema("tagliandonline");

export const permits = toSchema.table("permits", {
    id: commonColumns.idAutoIncr(),
    createdAt: commonColumns.createdAt(),
    updatedAt: commonColumns.updatedAt(),
    description: varchar({length: 128}).notNull(),
    printedName: varchar({length: 128}).notNull(),
    simultaneousPlatesAmount: integer().notNull(),
    applicationPlatesAmount: integer().notNull(),
    disabled: commonColumns.disabled(),
    notes: commonColumns.notes(),
    voucherDurationDays: integer(),
    voucherExpiryDate: date(),
    approveEmailTemplateId: integer().notNull().references(() => emailTemplates.id),
    revokeEmailTemplateId: integer().notNull().references(() => emailTemplates.id),
    refuseEmailTemplateId: integer().notNull().references(() => emailTemplates.id),
    voucherTemplateId: integer().notNull().references(() => docTemplates.id),
    authorizationTemplateId: integer().notNull().references(() => docTemplates.id),
    numerationRegisterId: integer().notNull().references(() => numerationRegisters.id),
    lastPermitHistoryId: integer().references((): AnyPgColumn => permitsHistory.id), // self references need anypgcolumn due to typescript limitations
})

export const permitsHistory = toSchema.table("permitsHistory", {
    id: commonColumns.idAutoIncr(),
    permitId: integer().notNull().references(() => permits.id),
    createdAt: commonColumns.createdAt(),
    modifiedByAuthUserId: integer().notNull().references(() => authUsers.id),

    description: varchar({length: 128}).notNull(),
    printedName: varchar({length: 128}).notNull(),
    simultaneousPlatesAmount: integer().notNull(),
    applicationPlatesAmount: integer().notNull(),
    disabled: commonColumns.disabled(),
    notes: commonColumns.notes(),
    voucherDurationDays: integer(),
    voucherExpiryDate: date(),
    approveEmailTemplateId: integer().notNull().references(() => emailTemplates.id),
    revokeEmailTemplateId: integer().notNull().references(() => emailTemplates.id),
    refuseEmailTemplateId: integer().notNull().references(() => emailTemplates.id),
    voucherTemplateId: integer().notNull().references(() => docTemplates.id),
    authorizationTemplateId: integer().notNull().references(() => docTemplates.id),
    numerationRegisterId: integer().notNull().references(() => numerationRegisters.id),
}, (t) => [
    index("permitsHistoryPermitIdIndex").on(t.permitId)
])

export const emailTemplates = toSchema.table("emailTemplates", {
    id: commonColumns.idAutoIncr(),
    createdAt: commonColumns.createdAt(),
    updatedAt: commonColumns.updatedAt(),
    description: varchar({length: 64}).notNull(),
    disabled: commonColumns.disabled(),
    subject: varchar({length: 512}).notNull(),
    body: text().notNull(),
})


export const docTemplates = toSchema.table("docTemplates", {
    id: commonColumns.idAutoIncr(),
    createdAt: commonColumns.createdAt(),
    updatedAt: commonColumns.updatedAt(),
    disabled: commonColumns.disabled(),
    description: varchar({length: 64}).notNull(),
    path: commonColumns.path512(),
})

export const numerationRegisters = toSchema.table("numerationRegisters", {
    id: commonColumns.idAutoIncr(),
    createdAt: commonColumns.createdAt(),
    updatedAt: commonColumns.updatedAt(),
    description: varchar({length: 32}).notNull(),
    nextNumber: integer().default(1).notNull(),
    disabled: commonColumns.disabled(),
})

export const inspections = toSchema.table("inspections", {
    id: commonColumns.idAutoIncr(),
    startDate: commonColumns.createdAt(),
    endDate: timestamp({withTimezone: true}),
    description: varchar({length: 128}).notNull(),
})

// Rimosso perché non è più necessario individuare precisamente chi partecipa all'ispezione:
//   di fatti basta riportare nei singoli rilievi chi li ha effettuati
// export const inspectionsToAuthUsers = toSchema.table("inspectionsToAuthUsers",
//     {
//         inspectionId: integer().notNull().references(() => inspections.id),
//         authUserId: integer().notNull().references(() => authUsers.id),
//     },
//     (t) => [primaryKey({columns: [t.inspectionId, t.authUserId]})]
// )


export const authUsers = toSchema.table("authUsers", {
    id: commonColumns.idAutoIncr(),
    createdAt: commonColumns.createdAt(),
    updatedAt: commonColumns.updatedAt(),
    disabled: commonColumns.disabled(),
    cf: commonColumns.cfVarchar(),
    firstname: commonColumns.firstnameVarchar(),
    lastname: commonColumns.lastnameVarchar(),
    email: varchar({length: 128}).notNull(),
    username: varchar({length: 32}).notNull().unique(),
    passwordHash: varchar({length: 60}).notNull(), //length of bcrypt hash
    lastPasswordResetDate: commonColumns.createdAt(),
    passwordResetToken: varchar({length: passwordResetTokenByteLength * 2}).default(generatePasswordResetToken()),
    passwordResetTokenGenerationDate: commonColumns.createdAt(),
    roleId: integer().notNull().references(() => roles.id),
}, (t) => [
    uniqueIndex('emailUniqueIndex').on(sqlLower(t.email)),
    index("authUsersEmailIndex").on(t.email),
    index("authUsersUsernameIndex").on(t.username),
]);

export const roles = toSchema.table("roles", {
    id: commonColumns.idAutoIncr(),
    description: varchar({length: 32}).notNull().unique(),
})

export const loginHistory = toSchema.table("loginHistory", {
    id: commonColumns.idAutoIncr(),
    createdAt: commonColumns.createdAt(),
    clientIp: varchar({length: 32}).notNull(),
    userId: integer().notNull().references(() => authUsers.id),
}, (t) => [
    index("loginHistoryUserIdIndex").on(t.userId),
    index("loginHistoryClientIpIndex").on(t.clientIp)
])


export const vehicles = toSchema.table("vehicles", {
    id: commonColumns.idAutoIncr(),
    createdAt: commonColumns.createdAt(),
    updatedAt: commonColumns.updatedAt(),
    plate: varchar({length: 16}).notNull(),
    model: varchar({length: 40}).notNull(),
    brand: varchar({length: 24}).notNull(),
    lastVehiclesHistoryId: integer().references((): AnyPgColumn => vehiclesHistory.id),
}, (t) => [
    index("vehiclesPlateIndex").on(t.plate),
    index("vehiclesModelIndex").on(t.model),
    index("vehiclesBrandIndex").on(t.brand),
])

export const vehiclesHistory = toSchema.table("vehiclesHistory", {
    id: commonColumns.idAutoIncr(),
    vehicleId: integer().notNull().references(() => vehicles.id),
    createdAt: commonColumns.createdAt(),
    modifiedByAuthUserId: integer().notNull().references(() => authUsers.id),

    plate: varchar({length: 16}).notNull(),
    model: varchar({length: 40}).notNull(),
    brand: varchar({length: 24}).notNull(),
}, (t) => [
    index("vehiclesHistoryVehicleIdIndex").on(t.vehicleId),
    index("vehiclesHistoryPlateIndex").on(t.plate),
    index("vehiclesHistoryModelIndex").on(t.model),
    index("vehiclesHistoryBrandIndex").on(t.brand),
])

export const applications = toSchema.table("applications", {
    id: commonColumns.idAutoIncr(),
    createdAt: commonColumns.createdAt(),
    updatedAt: commonColumns.updatedAt(),
    requestDate: date().defaultNow().notNull(),
    outcomeDate: date(),
    registerNumber: integer().notNull(), //numero di protocollo
    registerDate: date().notNull(), //data di protocollazione
    cf: commonColumns.cfVarchar(),
    firstname: commonColumns.firstnameVarchar(),
    lastname: commonColumns.lastnameVarchar(),
    email: varchar({length: 256}).notNull(),
    companyCF: varchar({length: 16}).default(""),
    companyName: varchar({length: 64}).default(""),
    birthDate: date(),
    birthCity: varchar({length: 64}),
    residenceCity: varchar({length: 64}),
    residencePlace: varchar({length: 128}),
    targetHousePlace: varchar({length: 128}),
    targetHouseLandRegistrySheet: varchar({length: 8}),
    targetHouseLandRegistryMap: varchar({length: 8}),
    targetHouseLandRegistrySubaltern: varchar({length: 8}),
    targetHouseLandRegistryCategory: varchar({length: 8}),
    notes: commonColumns.notes(),
    permitId: integer().notNull().references(() => permits.id),
    outcomeId: integer().notNull().references(() => applicationOutcome.id),
    typeId: integer().notNull().references(() => applicationTypes.id),
    outcomeAuthUserId: integer().references(() => authUsers.id),
    voucherId: integer().references(() => vouchers.id),
    lastApplicationHistoryId: integer().references((): AnyPgColumn => applicationsHistory.id),
}, (t) => [
    index("applicationsRegisterNumberIndex").on(t.registerNumber),
    index("applicationsRegisterDateIndex").on(t.registerDate),
    index("applicationsCfIndex").on(t.cf),
    index("applicationsFirstnameIndex").on(t.firstname),
    index("applicationsLastnameIndex").on(t.lastname),
    index("applicationsEmailIndex").on(t.email),
    index("applicationsPermitIdIndex").on(t.permitId),
    index("applicationsVoucherIdIndex").on(t.voucherId),
])

export const applicationsHistory = toSchema.table("applicationsHistory", {
    id: commonColumns.idAutoIncr(),
    applicationId: integer().notNull().references(() => applications.id),
    createdAt: commonColumns.createdAt(),
    modifiedByAuthUserId: integer().notNull().references(() => authUsers.id),

    requestDate: date().defaultNow().notNull(),
    outcomeDate: date(),
    registerNumber: integer().notNull(), //numero di protocollo
    registerDate: date(),
    cf: commonColumns.cfVarchar(),
    firstname: commonColumns.firstnameVarchar(),
    lastname: commonColumns.lastnameVarchar(),
    email: varchar({length: 256}).notNull(),
    companyCF: varchar({length: 16}).default(""),
    companyName: varchar({length: 64}).default(""),
    birthDate: date(),
    birthCity: varchar({length: 64}),
    residenceCity: varchar({length: 64}),
    residencePlace: varchar({length: 128}),
    targetHousePlace: varchar({length: 128}),
    targetHouseLandRegistrySheet: varchar({length: 8}),
    targetHouseLandRegistryMap: varchar({length: 8}),
    targetHouseLandRegistrySubaltern: varchar({length: 8}),
    targetHouseLandRegistryCategory: varchar({length: 8}),
    notes: commonColumns.notes(),
    permitHistoryId: integer().notNull().references(() => permitsHistory.id),
    outcomeId: integer().notNull().references(() => applicationOutcome.id),
    typeId: integer().notNull().references(() => applicationTypes.id),
    outcomeAuthUserId: integer().references(() => authUsers.id),
    voucherHistoryId: integer().references(() => vouchersHistory.id),
}, (t) => [
    index("applicationHistoryApplicationIdIndex").on(t.applicationId),
    index("applicationsHistoryRegisterNumberIndex").on(t.registerNumber),
    index("applicationsHistoryRegisterDateIndex").on(t.registerDate),
    index("applicationsHistoryCfIndex").on(t.cf),
    index("applicationsHistoryFirstnameIndex").on(t.firstname),
    index("applicationsHistoryLastnameIndex").on(t.lastname),
    index("applicationsHistoryEmailIndex").on(t.email),
    index("applicationsHistoryPermitHistoryIdIndex").on(t.permitHistoryId),
    index("applicationsHistoryVoucherHistoryIdIndex").on(t.voucherHistoryId),
])

export const applicationsToVehicles = toSchema.table("applicationsToVehicles",
    {
        applicationId: integer().notNull().references(() => applications.id),
        vehicleId: integer().notNull().references(() => vehicles.id),
    },
    (t) => [
        primaryKey({columns: [t.applicationId, t.vehicleId]}),
        index("applicationsToVehiclesApplicationsIdIndex").on(t.applicationId),
        index("applicationsToVehiclesVehicleIdIndex").on(t.vehicleId),
    ]
)

export const applicationsHistoryToVehiclesHistory = toSchema.table("applicationsHistoryToVehiclesHistory",
    {
        applicationHistoryId: integer().notNull().references(() => applicationsHistory.id),
        vehicleHistoryId: integer().notNull().references(() => vehiclesHistory.id),
    },
    (t) => [
        primaryKey({columns: [t.applicationHistoryId, t.vehicleHistoryId]}),
        index("applicationsHistoryToVehiclesApplicationsIdIndex").on(t.applicationHistoryId),
        index("applicationsHistoryToVehiclesVehicleIdIndex").on(t.vehicleHistoryId),
    ]
)

export const applicationOutcome = toSchema.table("applicationOutcome", {
    id: commonColumns.idAutoIncr(),
    disabled: commonColumns.disabled(),
    description: varchar({length: 32}).notNull(),
})

export const applicationTypes = toSchema.table("applicationType", {
    id: commonColumns.idAutoIncr(),
    disabled: commonColumns.disabled(),
    description: varchar({length: 32}).notNull(),
})

export const applicationsEmailsHistory = toSchema.table("applicationsEmailsHistory", {
    id: commonColumns.idAutoIncr(),
    createdAt: commonColumns.createdAt(),
    sentDate: timestamp({withTimezone: true}),
    to: varchar({length: 512}).notNull(),
    subject: varchar({length: 512}).notNull(),
    body: text().notNull(),
    attachments: varchar({length: 2048}),
    applicationId: integer().notNull().references(() => applications.id),
}, (t) => [
    index("emailApplicationIdIndex").on(t.applicationId)
])


export const vouchers = toSchema.table("vouchers", {
    id: commonColumns.idAutoIncr(),
    createdAt: commonColumns.createdAt(),
    updatedAt: commonColumns.updatedAt(),
    number: integer().notNull(),
    revoked: commonColumns.disabled(),
    validFromDate: date().notNull(),
    validToDate: date().notNull(),
    notes: commonColumns.notes(),
    permitId: integer().notNull().references(() => permits.id),
    generatedVoucherTemplatePath: commonColumns.path512Nullable(),
    generatedAuthorizationTemplatePath: commonColumns.path512Nullable(),
    generatedVoucherPdfPath: commonColumns.path512Nullable(),
    generatedAuthorizationPdfPath: commonColumns.path512Nullable(),
    signedAuthorizationPath: commonColumns.path512Nullable(),
    lastVoucherHistoryId: integer().references((): AnyPgColumn => vouchersHistory.id),
}, (t) => [
    index("vouchersNumberIndex").on(t.number),
    index("vouchersPermitIdIndex").on(t.permitId),
])

export const vouchersHistory = toSchema.table("vouchersHistory", {
    id: commonColumns.idAutoIncr(),
    voucherId: integer().notNull().references(() => vouchers.id),
    createdAt: commonColumns.createdAt(),
    modifiedByAuthUserId: integer().notNull().references(() => authUsers.id),

    number: integer().notNull(),
    revoked: commonColumns.disabled(),
    validFromDate: date().notNull(),
    validToDate: date().notNull(),
    notes: commonColumns.notes(),
    permitHistoryId: integer().notNull().references(() => permitsHistory.id),
    generatedVoucherTemplatePath: commonColumns.path512Nullable(),
    generatedAuthorizationTemplatePath: commonColumns.path512Nullable(),
    generatedVoucherPdfPath: commonColumns.path512Nullable(),
    generatedAuthorizationPdfPath: commonColumns.path512Nullable(),
    signedAuthorizationPath: commonColumns.path512Nullable(),
}, (t) => [
    index("voucherHistoryVoucherIdIndex").on(t.voucherId),
    index("vouchersHistoryNumberIndex").on(t.number),
    index("vouchersHistoryPermitHistoryIdIndex").on(t.permitHistoryId),
])

export const vouchersToVehicles = toSchema.table("vouchersToVehicles",
    {
        voucherId: integer().notNull().references(() => vouchers.id),
        vehicleId: integer().notNull().references(() => vehicles.id),
    },
    (t) => [
        primaryKey({columns: [t.voucherId, t.vehicleId]}),
        index("vouchersToVehiclesVoucherIdIndex").on(t.voucherId),
        index("vouchersToVehiclesVehicleIdIndex").on(t.vehicleId),
    ]
)

export const vouchersHistoryToVehiclesHistory = toSchema.table("vouchersHistoryToVehiclesHistory",
    {
        voucherHistoryId: integer().notNull().references(() => vouchersHistory.id),
        vehicleHistoryId: integer().notNull().references(() => vehiclesHistory.id),
    },
    (t) => [
        primaryKey({columns: [t.voucherHistoryId, t.vehicleHistoryId]}),
        index("vouchersHistoryToVehiclesVoucherIdIndex").on(t.voucherHistoryId),
        index("vouchersHistoryToVehiclesVehicleIdIndex").on(t.vehicleHistoryId),
    ]
)

export const vouchersEmailsHistory = toSchema.table("vouchersEmailsHistory", {
    id: commonColumns.idAutoIncr(),
    createdAt: commonColumns.createdAt(),
    sentDate: commonColumns.createdAt(),
    to: varchar({length: 512}).notNull(),
    subject: varchar({length: 512}).notNull(),
    body: text().notNull(),
    attachments: varchar({length: 2048}),
    voucherId: integer().notNull().references(() => vouchers.id),
}, (t) => [
    index("emailVoucherIdIndex").on(t.voucherId)
])


export const inspectionChecks = toSchema.table("inspectionChecks", {
    id: commonColumns.idAutoIncr(),
    createdAt: commonColumns.createdAt(),
    inspectionId: integer().notNull().references(() => inspections.id),
    vehicleHistoryId: integer().notNull().references(() => vehiclesHistory.id),
    voucherHistoryId: integer().notNull().references(() => vouchersHistory.id),
    permitHistoryId: integer().notNull().references(() => permitsHistory.id),
    checkedByAuthUserId: integer().notNull().references(() => authUsers.id),
}, (t) => [
    index("inspectionChecksInspectionIdIndex").on(t.inspectionId),
    index("inspectionChecksVehicleHistoryIdIndex").on(t.vehicleHistoryId),
    index("inspectionChecksVoucherHistoryIdIndex").on(t.voucherHistoryId),
])

