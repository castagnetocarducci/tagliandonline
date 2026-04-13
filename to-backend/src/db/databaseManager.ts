import {drizzle} from "drizzle-orm/node-postgres";
import {ConfigProvider} from "../configProvider.ts";
import {relations} from "./relations.ts";
import {populateDefaultData} from "./defaultData.ts";
import {authUsers, roles} from "./schema.ts";
import {and, eq, or} from "drizzle-orm";
import {generatePasswordHash} from "../utils/pswHashing.ts";
import type {PgAsyncTransaction} from "drizzle-orm/pg-core";
import type {PostgresJsQueryResultHKT} from "drizzle-orm/postgres-js";

export type AuthUserCache = {
    id: number,
    username: string,
    role: string | null,
    disabled: boolean,
    lastPasswordResetDate: Date,
}

export type DbTransactionType = PgAsyncTransaction<PostgresJsQueryResultHKT, Record<string, never>, typeof relations>;

/**
 * singleton
 */
export class DatabaseManager {
    static #instance: DatabaseManager;
    db;
    authUsersCache: AuthUserCache[] = []


    public static get instance(): DatabaseManager {
        if (!DatabaseManager.#instance) {
            DatabaseManager.#instance = new DatabaseManager();
        }
        return DatabaseManager.#instance;
    }

    private constructor() {
        this.db = drizzle(ConfigProvider.instance.getDBUrl(), {relations});
    }

    public async init() {
        await populateDefaultData();
        const replacingAdminPassword = ConfigProvider.instance.configs.replacingAdminPassword;
        if (replacingAdminPassword != null && replacingAdminPassword.length > 0) {
            const adminPasswordHash = await generatePasswordHash(replacingAdminPassword);
            await this.db.update(authUsers).set({
                passwordHash: adminPasswordHash,
                disabled: false,
                lastPasswordResetDate: new Date(),
                roleId: roles.id,
            }).from(roles).where(and(or(eq(authUsers.id, 1), eq(authUsers.username, "admin")), eq(roles.description, "admin")));
            console.log("Admin password updated");
        }
        await this.loadAuthUsers();
    }

    public loadAuthUsers = async () => {
        const db = DatabaseManager.instance.db;
        try {
            const authUsers = await db.query.authUsers.findMany({with: {role: true}});
            if (authUsers == null || authUsers.length === 0) {
                throw new Error("Nessun utente trovato nel database");
            }
            this.authUsersCache = [];
            for (const u of authUsers) {
                const userCache = {id: u.id, username: u.username, role: u.role == null ? null : u.role.description, disabled: u.disabled, lastPasswordResetDate: u.lastPasswordResetDate}
                this.authUsersCache.push(userCache);
            }

        } catch (error) {
            console.error("Errore nel recupero degli utenti dal database", error);
            return;
        }
    }

}
