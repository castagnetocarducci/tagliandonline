import {ConfigProvider} from "./configProvider.js";
import express from "express";
import {DatabaseManager} from "./db/databaseManager.ts";
import {SmtpManager} from "./smtpManager.ts";
const app = express();

const main = async () => {
    await DatabaseManager.instance.init();
    await SmtpManager.instance.verifyConnection();

    app.get("/", (req, res) => {
        res.send("Hello World!");
        console.log("Response sent");
    });

    app.listen(ConfigProvider.instance.configs.port, () => {
        console.log(`Example app listening on port ${ConfigProvider.instance.configs.port}`);
    });
}

main();

