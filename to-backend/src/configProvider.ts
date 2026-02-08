import dotenv from 'dotenv'
import {randomBytes} from "node:crypto";
import {join} from "node:path";
import {mkdirSync} from "node:fs";

type Configs = {
    port: number,
    pdfPrintTimeoutMs: number,
    dbPassword: string,
    dbUser: string,
    dbName: string,
    dbHost: string,
    dbPort: number,
    jwtSecret: string,
    sofficePath: string,
    replacingAdminPassword: string | undefined,
    dataPath: string,
    modelsPath: string,
    vouchersPath: string,
}

/**
 * Di base si vuole caricare tutto dall'env di docker. Quindi il file .env dovrebbe rimanere vuoto e serve solo per
 * quando l'utente vuole setuppare il server fuori da docker.
 */
export class ConfigProvider {
    static #instance: ConfigProvider;
    configs: Configs;

    public static get instance(): ConfigProvider {
        if (!ConfigProvider.#instance) {
            ConfigProvider.#instance = new ConfigProvider();
        }
        return ConfigProvider.#instance;
    }

    private constructor() {
        dotenv.config();
        this.configs = {
            // il valore di destra verrà usato in docker
            port: ConfigProvider.loadNumber(process.env.PORT, 80),
            pdfPrintTimeoutMs: ConfigProvider.loadNumber(process.env.PDF_PRINT_TIMEOUT_MS, 10000),
            dbPassword: ConfigProvider.loadString(process.env.DB_PASSWORD, "secretpassword4D7qR9Vo3sNxZTDixH"),
            dbUser: ConfigProvider.loadString(process.env.DB_USER, "tagliandonline"),
            dbName: ConfigProvider.loadString(process.env.DB_NAME, "tagliandonline"),
            dbHost: ConfigProvider.loadString(process.env.DB_HOST, "localhost"),
            dbPort: ConfigProvider.loadNumber(process.env.DB_PORT, 5432),
            jwtSecret: ConfigProvider.loadString(process.env.JWT_SECRET, randomBytes(24).toString("hex")),
            sofficePath: ConfigProvider.loadString(process.env.SOFFICE_PATH, "/usr/bin/soffice"),
            replacingAdminPassword: process.env.REPLACING_ADMIN_PASSWORD,
            dataPath: ConfigProvider.loadString(process.env.DATA_PATH, "../data"),
            modelsPath: join(ConfigProvider.loadString(process.env.DATA_PATH, "../data"), "models"),
            vouchersPath: join(ConfigProvider.loadString(process.env.DATA_PATH, "../data"), "vouchers"),
        }
        this.prepareDataPath();
    }

    private prepareDataPath() {
        mkdirSync(this.configs.modelsPath, {recursive: true});
        mkdirSync(this.configs.vouchersPath, {recursive: true});
    }

    public getDBUrl(): string {
        return `postgres://${this.configs.dbUser}:${this.configs.dbPassword}@${this.configs.dbHost}:${this.configs.dbPort}/${this.configs.dbName}`;
    }

    private static loadNumber(value: string | undefined, defaultValue: number): number {
        if (value != null) {
            const converted = parseInt(value);
            if (!isNaN(converted)) {
                return converted;
            } else {
                console.error("Invalid value in configuration: " + value);
            }
        }
        return defaultValue;
    }

    private static loadString(value: string | undefined, defaultValue: string): string {
        if (value != null) {
            return value;
        }
        return defaultValue;
    }
}
