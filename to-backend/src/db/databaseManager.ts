import { drizzle } from "drizzle-orm/node-postgres";
import {ConfigProvider} from "../configProvider.ts";
import {relations} from "./relations.ts";
import {populateDefaultData} from "./defaultData.ts";
import {generatePasswordHash} from "../auth.ts";
import {authUsers} from "./schema.ts";
import {eq} from "drizzle-orm";

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
            await this.db.update(authUsers).set({passwordHash: adminPasswordHash}).where(eq(authUsers.username, "admin"));
            console.log("Admin password updated");
        }
    }

    // public async connect() {
    //     try {
    //         // await this.#sequelize.authenticate();
    //     } catch (e) {
    //         console.error("Database connection failed: ", e);
    //     }
    // }
    //
    // /**
    //  * chiamato automaticamente alla chiusura dell'applicazione da Sequelize.
    //  */
    // public async disconnect() {
    //     // await this.#sequelize.close();
    // }



}
