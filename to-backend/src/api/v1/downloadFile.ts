import express, {Router} from "express";
import {middlewareAuthCheck} from "./auth.ts";
import {ConfigProvider} from "../../configProvider.ts";

export const downloadFileRouter = Router();

downloadFileRouter.use(middlewareAuthCheck(["admin", "operatore", "vigile"]));
downloadFileRouter.use(express.static(ConfigProvider.instance.configs.dataPath));


export const adjustPathForDownload = (path: string) => {
    return path.replaceAll("\\", "/").replace(ConfigProvider.instance.configs.dataPath.replaceAll("\\", "/"), "/download");
}

