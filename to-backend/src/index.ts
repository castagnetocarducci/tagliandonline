import {configProvider} from "./configProvider.js";
import express from "express";
const app = express();


app.get("/", (req, res) => {
    res.send("Hello World!");
    console.log("Response sent");
});

console.log(configProvider.port);

app.listen(configProvider.port, () => {
    console.log(`Example app listening on port ${configProvider.port}`);
});
