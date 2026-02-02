import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import {ConfigProvider} from "./src/configProvider.ts"; //need to be .ts for npx drizzle-kit to be able to import it

export default defineConfig({
    out: './drizzle',
    schema: './src/db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: ConfigProvider.instance.getDBUrl(),
    },
});