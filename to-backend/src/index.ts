import {ConfigProvider} from "./configProvider.js";
import express from "express";
import {toDataURL} from "qrcode";
const app = express();


const output = await toDataURL("https://www.npmjs.com/package/qrcode");
console.log(output);

// app.get("/", (req, res) => {
//     res.send("Hello World!");
//     console.log("Response sent");
// });
//
// app.listen(ConfigProvider.instance.configs.port, () => {
//     console.log(`Example app listening on port ${ConfigProvider.instance.configs.port}`);
// });
