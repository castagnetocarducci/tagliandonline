import dotenv from 'dotenv'

type Configs = {
    port: number,
    pdfPrintTimeoutMs: number
}

/**
 * Di base si vuole caricare tutto dall'env di docker. Quindi il file .env dovrebbe rimanere vuoto e serve solo per
 * quando l'utente vuole setuppare il server fuori da docker.
 */
export class ConfigProvider {
    static #instance: ConfigProvider;
    configs: Configs;

    private constructor() {
        dotenv.config();
        this.configs = {
            // il valore di destra verrà usato in docker
            port: ConfigProvider.loadNumber(process.env.PORT, 80),
            pdfPrintTimeoutMs: ConfigProvider.loadNumber(process.env.PDF_PRINT_TIMEOUT_MS, 10000),
        }
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

    public static get instance(): ConfigProvider {
        if (!ConfigProvider.#instance) {
            ConfigProvider.#instance = new ConfigProvider();
        }
        return ConfigProvider.#instance;
    }
}
