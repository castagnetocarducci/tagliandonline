import {boolean, integer, timestamp, varchar} from "drizzle-orm/pg-core";

export const commonColumns = {
    updatedAt: () => timestamp().defaultNow().notNull().$onUpdate(() => new Date()),
    createdAt: () => timestamp().defaultNow().notNull(),
    deletedAt: () => timestamp(),
    disabled: () => boolean().default(false).notNull(),
    cfVarchar: () => varchar({length: 16}),
    idAutoIncr: () => integer().primaryKey().generatedAlwaysAsIdentity(),

}
