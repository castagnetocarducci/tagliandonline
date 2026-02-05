import {boolean, date, index, integer, pgSchema, pgTable, primaryKey, text, timestamp, varchar} from "drizzle-orm/pg-core";
import {commonColumns} from "./common.columns.ts";

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
})

// export const permitsHistory = toSchema.table("permitsHistory", {
//     id: commonColumns.idAutoIncr(),
//     permitId: integer().notNull().references(() => permits.id),
//     createdAt: commonColumns.createdAt(),
//     updatedAt: commonColumns.updatedAt(),
//     modifiedByAuthUserId: integer().notNull().references(() => authUsers.id),
//
//     description: varchar({length: 128}).notNull(),
//     platesAmount: integer().notNull(),
//     disabled: commonColumns.disabled(),
// approveEmailTemplateId: integer().notNull().references(() => emailTemplates.id),
//     revokeEmailTemplateId: integer().notNull().references(() => emailTemplates.id),
    // refuseEmailTemplateId: integer().notNull().references(() => emailTemplates.id),
//     voucherTemplateId: integer().notNull().references(() => docTemplates.id),
//     authorizationTemplateId: integer().notNull().references(() => docTemplates.id),
//     numerationRegisterId: integer().notNull().references(() => numerationRegisters.id),
// }, (t) => [
//     index("permitsHistoryPermitIdIndex").on(t.permitId)
// ])

export const emailTemplates = toSchema.table("emailTemplates", {
    id: commonColumns.idAutoIncr(),
    description: varchar({length: 64}).notNull(),
    disabled: commonColumns.disabled(),
    object: varchar({length: 512}).notNull(),
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
    nextNumber: integer().default(0).notNull(),
    description: varchar({length: 32}).notNull(),
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
    email: varchar({length: 128}).notNull(),
    username: varchar({length: 32}).notNull(),
    passwordHash: varchar({length: 60}).notNull(), //length of bcrypt hash
    roleId: integer().notNull().references(() => roles.id),
})

export const roles = toSchema.table("roles", {
    id: commonColumns.idAutoIncr(),
    description: varchar({length: 32}).notNull(),
})

export const loginHistory = toSchema.table("loginHistory", {
    id: commonColumns.idAutoIncr(),
    createdAt: commonColumns.createdAt(),
    clientIp: varchar({length: 32}).notNull(),
    userId: integer().notNull().references(() => authUsers.id),
})


export const vehicles = toSchema.table("vehicles", {
    id: commonColumns.idAutoIncr(),
    plate: varchar({length: 10}).notNull(),
    model: varchar({length: 10}).notNull(),
    brand: varchar({length: 10}).notNull(),
}, (t) => [
    index("vehiclesPlateIndex").on(t.plate),
    index("vehiclesModelIndex").on(t.model),
    index("vehiclesBrandIndex").on(t.brand),
])


export const applications = toSchema.table("applications", {
    id: commonColumns.idAutoIncr(),
    requestDate: commonColumns.createdAt(),
    outcomeDate: date(),
    registerNumber: varchar({length: 16}).notNull(), //numero di protocollo
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
}, (t) => [
    index("applicationsRegisterNumberIndex").on(t.registerNumber),
    index("applicationsRegisterDateIndex").on(t.registerDate),
    index("applicationsCfIndex").on(t.cf),
    index("applicationsFirstnameIndex").on(t.firstname),
    index("applicationsLastnameIndex").on(t.lastname),
    index("applicationsEmailIndex").on(t.email),
    index("applicationsVoucherIdIndex").on(t.voucherId),
])

export const applicationsToVehicles = toSchema.table("applicationsToVehicles",
    {
        applicationId: integer().notNull().references(() => applications.id),
        vehicleId: integer().notNull().references(() => vehicles.id),
    },
    (t) => [primaryKey({columns: [t.applicationId, t.vehicleId]})]
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
}, (t) => [
    index("vouchersNumberIndex").on(t.number),
])

export const vouchersToVehicles = toSchema.table("vouchersToVehicles",
    {
        voucherId: integer().notNull().references(() => vouchers.id),
        vehicleId: integer().notNull().references(() => vehicles.id),
    },
    (t) => [primaryKey({columns: [t.voucherId, t.vehicleId]})]
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



