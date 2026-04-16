import {boolean, integer, timestamp, varchar} from "drizzle-orm/pg-core";

export const commonColumns = {
    updatedAt: () => timestamp().defaultNow().notNull().$onUpdate(() => new Date()),
    createdAt: () => timestamp().defaultNow().notNull(),
    deletedAt: () => timestamp(),
    disabled: () => boolean().default(false).notNull(),
    cfVarchar: () => varchar({length: 16}).notNull(),
    firstnameVarchar: () => varchar({length: 32}).notNull(),
    lastnameVarchar: () => varchar({length: 32}).notNull(),
    idAutoIncr: () => integer().primaryKey().generatedAlwaysAsIdentity(),
    path512: () => varchar({length: 512}).notNull(),
    path512Nullable: () => varchar({length: 512}),
    notes: () => varchar({length: 512}).notNull(),
}
