import { drizzle } from "drizzle-orm/node-postgres";
import {ConfigProvider} from "./configProvider.js";

/**
 * singleton
 */
class DatabaseManager {
    static #instance: DatabaseManager;
    db;

    public static get instance(): DatabaseManager {
        if (!DatabaseManager.#instance) {
            DatabaseManager.#instance = new DatabaseManager();
        }
        return DatabaseManager.#instance;
    }

    private constructor() {
        this.db = drizzle(ConfigProvider.instance.getDBUrl());
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
