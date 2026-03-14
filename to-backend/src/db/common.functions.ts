import {sql, type SQL} from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

export function sqlLower(email: AnyPgColumn): SQL {
    return sql`lower(${email})`;
}
