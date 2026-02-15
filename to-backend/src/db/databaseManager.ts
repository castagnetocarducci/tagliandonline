import {drizzle} from "drizzle-orm/node-postgres";
import {ConfigProvider} from "../configProvider.ts";
import {relations} from "./relations.ts";
import {populateDefaultData} from "./defaultData.ts";
import {authUsers, roles} from "./schema.ts";
import {and, eq, or} from "drizzle-orm";
import {generatePasswordHash} from "../utils/pswHashing.ts";

/**
 * singleton
 */
export class DatabaseManager {
    static #instance: DatabaseManager;
    db;

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
    }

}
