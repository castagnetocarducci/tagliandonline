import {ConfigProvider} from "./configProvider.js";
import express from "express";
import {DatabaseManager} from "./db/databaseManager.ts";
import {SmtpManager} from "./smtpManager.ts";
import cors from "cors";
import cookieParser from "cookie-parser";

const main = async () => {
    await DatabaseManager.instance.init();
    await SmtpManager.instance.verifyConnection();

    const app = express();
    app.use(express.json());
    app.use(cors({
        origin: ConfigProvider.instance.configs.baseUrl
    }));
    app.use(cookieParser());

    // app.get("/", (req, res) => {
    //     res.send("Hello World!");
    //     console.log("Response sent");
    // });
    //
    // app.get("/healthcheck", (req, res) => {
    //     res.send("OK");
    // });

    app.use("/api/v1")

    app.listen(ConfigProvider.instance.configs.port, () => {
        console.log(`Express server listening on port ${ConfigProvider.instance.configs.port}`);
    });
}

main();

