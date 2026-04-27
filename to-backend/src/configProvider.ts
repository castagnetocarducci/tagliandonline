import dotenv from 'dotenv'
import {randomBytes} from "node:crypto";
import {join} from "node:path";
import {mkdirSync, writeFileSync} from "node:fs";

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
    filenameLength: number,
    resultsPerPage: number,
    baseUrl: string,
    smtpHost: string,
    smtpPort: number,
    smtpUser: string,
    smtpPassword: string,
    smtpSecure: boolean,
    frontend: {
        paName: string,
        paLink: string,
        pa2Name: string,
        pa2Link: string,
    }
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
            jwtSecret: ConfigProvider.loadString(process.env.JWT_SECRET, randomBytes(32).toString("hex")),
            sofficePath: ConfigProvider.loadString(process.env.SOFFICE_PATH, "/usr/bin/soffice"),
            replacingAdminPassword: process.env.REPLACING_ADMIN_PASSWORD,
            dataPath: ConfigProvider.loadString(process.env.DATA_PATH, "../data"),
            modelsPath: join(ConfigProvider.loadString(process.env.DATA_PATH, "../data"), "models"),
            vouchersPath: join(ConfigProvider.loadString(process.env.DATA_PATH, "../data"), "vouchers"),
            filenameLength: 64,
            resultsPerPage: 10,
            baseUrl: ConfigProvider.loadString(process.env.BASE_URL, "http://localhost:80"),
            smtpHost: ConfigProvider.loadString(process.env.SMTP_HOST, "smtp.example.com"),
            smtpPort: ConfigProvider.loadNumber(process.env.SMTP_PORT, 587),
            smtpUser: ConfigProvider.loadString(process.env.SMTP_USER, "email@example.com"),
            smtpPassword: ConfigProvider.loadString(process.env.SMTP_PASSWORD, "examplepassword"),
            smtpSecure: ConfigProvider.loadBoolean(process.env.SMTP_SECURE, true),
            frontend: {
                paName: ConfigProvider.loadString(process.env.PA_NAME, ""),
                paLink: ConfigProvider.loadString(process.env.PA_LINK, ""),
                pa2Name: ConfigProvider.loadString(process.env.PA2_NAME, ""),
                pa2Link: ConfigProvider.loadString(process.env.PA2_LINK, "")
            }
        }
        this.prepareDataPath();
        this.checkBaseUrl();
        this.createConfig();
    }

    private prepareDataPath() {
        if (this.configs.dataPath.endsWith("/") || this.configs.dataPath.endsWith("\\")) {
            this.configs.dataPath = this.configs.dataPath.slice(0, -1);
        }
        mkdirSync(this.configs.modelsPath, {recursive: true});
        mkdirSync(this.configs.vouchersPath, {recursive: true});
    }

    private checkBaseUrl() {
        if (this.configs.baseUrl.endsWith("/")) {
            this.configs.baseUrl = this.configs.baseUrl.slice(0, -1);
        }
        if (!this.configs.baseUrl.startsWith("http://") && !this.configs.baseUrl.startsWith("https://")) {
            this.configs.baseUrl = "http://" + this.configs.baseUrl;
        }
    }

    private createConfig() {
        const toWrite = JSON.stringify({...this.configs.frontend});
        writeFileSync("./public/config.json", toWrite);
        console.log("Frontend config file created");
    }

    public getDBUrl(): string {
        return `postgres://${this.configs.dbUser}:${this.configs.dbPassword}@${this.configs.dbHost}:${this.configs.dbPort}/${this.configs.dbName}`;
    }

    private getVoucherFolderPath(voucherID: number): string {
        return join(this.configs.vouchersPath, "" + voucherID);
    }

    public prepareVoucherFolderPath(voucherID: number): string {
        const voucherFolderPath = this.getVoucherFolderPath(voucherID);
        mkdirSync(voucherFolderPath, {recursive: true});
        return voucherFolderPath;
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

    private static loadBoolean(value: string | undefined, defaultValue: boolean): boolean {
        if (value != null) {
            if (value.toLowerCase() === "true") {
                return true;
            } else if (value.toLowerCase() === "false") {
                return false;
            }
        }
        return defaultValue;
    }
}
