import {ConfigProvider} from "./configProvider.js";
import express from "express";
const app = express();

app.get("/", (req, res) => {
    res.send("Hello World!");
    console.log("Response sent");
});

app.listen(ConfigProvider.instance.configs.port, () => {
    console.log(`Example app listening on port ${ConfigProvider.instance.configs.port}`);
});
