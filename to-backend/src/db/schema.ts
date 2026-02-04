import {integer, pgSchema, pgTable, varchar} from "drizzle-orm/pg-core";
import {commonColumns} from "./common.columns.ts";

export const toSchema = pgSchema("tagliandonline");

export const authUsers = toSchema.table("authUsers", {
    id: commonColumns.idAutoIncr(),
    createdAt: commonColumns.createdAt(),
    updatedAt: commonColumns.updatedAt(),
    disabled: commonColumns.disabled(),
    cfVarchar: commonColumns.cfVarchar(),
    email: varchar({length: 128}).notNull(),
    username: varchar({length: 32}).notNull(),
    passwordHash: varchar({length: 60}).notNull(), //length of bcrypt hash
    firstname: varchar({length: 32}).notNull(),
    lastname: varchar({length: 32}).notNull(),
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


export const vehicles = toSchema.table("vehicles", {})


export const applicationOutcome = toSchema.table("applicationOutcome", {
    id: commonColumns.idAutoIncr(),
    disabled: commonColumns.disabled(),
    description: varchar({length: 32}).notNull(),
})

export const applicationType = toSchema.table("applicationType", {
    id: commonColumns.idAutoIncr(),
    disabled: commonColumns.disabled(),
    description: varchar({length: 32}).notNull(),
})


