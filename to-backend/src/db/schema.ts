import {
    type AnyPgColumn,
    date,
    index,
    integer,
    pgSchema,
    primaryKey,
    text,
    timestamp,
    varchar
} from "drizzle-orm/pg-core";
import {commonColumns} from "./common.columns.ts";
import {generatePasswordResetToken, passwordResetTokenByteLength} from "../utils/pswHashing.ts";

export const toSchema = pgSchema("tagliandonline");

export const permits = toSchema.table("permits", {
    id: commonColumns.idAutoIncr(),
    description: varchar({length: 128}).notNull(),
    platesAmount: integer().notNull(),
    disabled: commonColumns.disabled(),
    notes: commonColumns.notes(),
    approveEmailTemplateId: integer().notNull().references(() => emailTemplates.id),
    revokeEmailTemplateId: integer().notNull().references(() => emailTemplates.id),
    refuseEmailTemplateId: integer().notNull().references(() => emailTemplates.id),
    voucherTemplateId: integer().notNull().references(() => docTemplates.id),
    authorizationTemplateId: integer().notNull().references(() => docTemplates.id),
    numerationRegisterId: integer().notNull().references(() => numerationRegisters.id),
    lastPermitHistoryId: integer().notNull().references((): AnyPgColumn => permitsHistory.id), // self references need anypgcolumn due to typescript limitations
})

export const permitsHistory = toSchema.table("permitsHistory", {
    id: commonColumns.idAutoIncr(),
    permitId: integer().notNull().references(() => permits.id),
    createdAt: commonColumns.createdAt(),
    modifiedByAuthUserId: integer().notNull().references(() => authUsers.id),

    description: varchar({length: 128}).notNull(),
    platesAmount: integer().notNull(),
    disabled: commonColumns.disabled(),
    notes: commonColumns.notes(),
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
})

export const inspections = toSchema.table("inspections", {
    id: commonColumns.idAutoIncr(),
    startDate: commonColumns.createdAt(),
    endDate: timestamp(),
})

export const inspectionsToAuthUsers = toSchema.table("inspectionsToAuthUsers",
    {
        inspectionId: integer().notNull().references(() => inspections.id),
        authUserId: integer().notNull().references(() => authUsers.id),
    },
    (t) => [primaryKey({columns: [t.inspectionId, t.authUserId]})]
)


export const authUsers = toSchema.table("authUsers", {
    id: commonColumns.idAutoIncr(),
    createdAt: commonColumns.createdAt(),
    updatedAt: commonColumns.updatedAt(),
    disabled: commonColumns.disabled(),
    cf: commonColumns.cfVarchar(),
    firstname: commonColumns.firstnameVarchar(),
    lastname: commonColumns.lastnameVarchar(),
    email: varchar({length: 128}).notNull().unique(),
    username: varchar({length: 32}).notNull().unique(),
    passwordHash: varchar({length: 60}).notNull(), //length of bcrypt hash
    lastPasswordResetDate: commonColumns.createdAt(),
    passwordResetToken: varchar({length: passwordResetTokenByteLength * 2}).default(generatePasswordResetToken()),
    passwordResetTokenGenerationDate: commonColumns.createdAt(),
    roleId: integer().notNull().references(() => roles.id),
}, (t) => [
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
    plate: varchar({length: 10}).notNull(),
    model: varchar({length: 10}).notNull(),
    brand: varchar({length: 10}).notNull(),
    lastVehiclesHistoryId: integer().notNull().references((): AnyPgColumn => vehiclesHistory.id),
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

    plate: varchar({length: 10}).notNull(),
    model: varchar({length: 10}).notNull(),
    brand: varchar({length: 10}).notNull(),
}, (t) => [
    index("vehiclesHistoryVehicleIdIndex").on(t.vehicleId),
    index("vehiclesHistoryPlateIndex").on(t.plate),
    index("vehiclesHistoryModelIndex").on(t.model),
    index("vehiclesHistoryBrandIndex").on(t.brand),
])

export const applications = toSchema.table("applications", {
    id: commonColumns.idAutoIncr(),
    requestDate: commonColumns.createdAt(),
    outcomeDate: date(),
    registerNumber: varchar({length: 32}).notNull(), //numero di protocollo
    registerDate: date(), //data di protocollazione
    cf: commonColumns.cfVarchar(),
    firstname: commonColumns.firstnameVarchar(),
    lastname: commonColumns.lastnameVarchar(),
    email: varchar({length: 256}).notNull(),
    birthDate: date(),
    birthCity: varchar({length: 64}),
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
    lastApplicationHistoryId: integer().notNull().references((): AnyPgColumn => applicationsHistory.id),
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

    requestDate: commonColumns.createdAt(),
    outcomeDate: date(),
    registerNumber: varchar({length: 32}).notNull(),
    registerDate: date(),
    cf: commonColumns.cfVarchar(),
    firstname: commonColumns.firstnameVarchar(),
    lastname: commonColumns.lastnameVarchar(),
    email: varchar({length: 256}).notNull(),
    birthDate: date(),
    birthCity: varchar({length: 64}),
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
    (t) => [primaryKey({columns: [t.applicationId, t.vehicleId]})]
)

export const applicationsHistoryToVehiclesHistory = toSchema.table("applicationsHistoryToVehiclesHistory",
    {
        applicationHistoryId: integer().notNull().references(() => applicationsHistory.id),
        vehicleHistoryId: integer().notNull().references(() => vehiclesHistory.id),
    },
    (t) => [primaryKey({columns: [t.applicationHistoryId, t.vehicleHistoryId]})]
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
    sentDate: timestamp(),
    to: varchar({length: 512}).notNull(),
    object: varchar({length: 512}).notNull(),
    body: text().notNull(),
    attachments: varchar({length: 2048}),
    applicationId: integer().notNull().references(() => applications.id),
}, (t) => [
    index("emailApplicationIdIndex").on(t.applicationId)
])


export const vouchers = toSchema.table("vouchers", {
    id: commonColumns.idAutoIncr(),
    number: integer().notNull(),
    revoked: commonColumns.disabled(),
    validFromDate: date().notNull(),
    validToDate: date().notNull(),
    notes: commonColumns.notes(),
    generatedVoucherTemplatePath: commonColumns.path512(),
    generatedAuthorizationTemplatePath: commonColumns.path512(),
    generatedVoucherPdfPath: commonColumns.path512(),
    generatedAuthorizationPdfPath: commonColumns.path512(),
    signedAuthorizationPath: commonColumns.path512(),
    lastVoucherHistoryId: integer().notNull().references((): AnyPgColumn => vouchersHistory.id),
}, (t) => [
    index("vouchersNumberIndex").on(t.number),
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
    generatedVoucherTemplatePath: commonColumns.path512(),
    generatedAuthorizationTemplatePath: commonColumns.path512(),
    generatedVoucherPdfPath: commonColumns.path512(),
    generatedAuthorizationPdfPath: commonColumns.path512(),
    signedAuthorizationPath: commonColumns.path512(),
}, (t) => [
    index("voucherHistoryVoucherIdIndex").on(t.voucherId),
    index("vouchersHistoryNumberIndex").on(t.number),
])

export const vouchersToVehicles = toSchema.table("vouchersToVehicles",
    {
        voucherId: integer().notNull().references(() => vouchers.id),
        vehicleId: integer().notNull().references(() => vehicles.id),
    },
    (t) => [primaryKey({columns: [t.voucherId, t.vehicleId]})]
)

export const vouchersHistoryToVehiclesHistory = toSchema.table("vouchersHistoryToVehiclesHistory",
    {
        voucherHistoryId: integer().notNull().references(() => vouchersHistory.id),
        vehicleHistoryId: integer().notNull().references(() => vehiclesHistory.id),
    },
    (t) => [primaryKey({columns: [t.voucherHistoryId, t.vehicleHistoryId]})]
)

export const vouchersEmailsHistory = toSchema.table("vouchersEmailsHistory", {
    id: commonColumns.idAutoIncr(),
    createdAt: commonColumns.createdAt(),
    sentDate: timestamp(),
    to: varchar({length: 512}).notNull(),
    object: varchar({length: 512}).notNull(),
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
    checkedByAuthUserId: integer().notNull().references(() => authUsers.id),
})

