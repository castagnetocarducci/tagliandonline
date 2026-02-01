import {ConfigProvider} from "./configProvider.js";

/**
 * singleton
 */
class DatabaseManager {
    static #instance: DatabaseManager;
    #dbUrl: string;

    public static get instance(): DatabaseManager {
        if (!DatabaseManager.#instance) {
            DatabaseManager.#instance = new DatabaseManager();
        }
        return DatabaseManager.#instance;
    }

    private constructor() {
        this.#dbUrl = "postgres://" +
            ConfigProvider.instance.configs.dbUser + ":" + ConfigProvider.instance.configs.dbPassword +
            "@" + ConfigProvider.instance.configs.dbHost + ":" + ConfigProvider.instance.configs.dbPort +
            "/" + ConfigProvider.instance.configs.dbName;
        // this.#sequelize = new Sequelize(this.#dbUrl, {
        //     logging: console.log,
        // });
    }

    public async connect() {
        try {
            // await this.#sequelize.authenticate();
        } catch (e) {
            console.error("Database connection failed: ", e);
        }
    }

    /**
     * chiamato automaticamente alla chiusura dell'applicazione da Sequelize.
     */
    public async disconnect() {
        // await this.#sequelize.close();
    }



}
