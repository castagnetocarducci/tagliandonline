import multer from "multer";
import {ConfigProvider} from "../configProvider.ts";
import path, {parse} from "node:path";
import fs from "node:fs";

export const createFilenameSuffix = (): string => {
    return Date.now().toString(36) + '-' + Math.round(Math.random() * 1E9).toString(36);
}

export const getSuffixedFilenameStr = (filenameWithExt: string): string => {
    const uniqueSuffix = createFilenameSuffix();
    let nameNoExt = parse(filenameWithExt).name.slice(0, ConfigProvider.instance.configs.filenameLength);
    nameNoExt = nameNoExt.replace(/_(?:.(?!_))+$/g, ""); //negative lookahead per rimpiazzare solo dall'ultimo underscore in poi
    return nameNoExt + "_" + uniqueSuffix + path.extname(filenameWithExt);
}

const getSuffixedFilename = (file: Express.Multer.File): string => {
    return getSuffixedFilenameStr(file.originalname);
}

export const modelsStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, ConfigProvider.instance.configs.modelsPath);
    },
    filename: (req, file, cb) => {
        cb(null, getSuffixedFilename(file));
    }
})

export const uploadModelsMulter = multer({
    storage: modelsStorage,
    limits: {
        fileSize: 2 * 1024 * 1024, //2MB
        files: 1
    }
});

export const deleteFileByPath = (filePath?: string) => {
    try {
        if (filePath != null) {
            fs.unlinkSync(filePath);
        }
    } catch (e) {
        console.log("Errore durante l'eliminazione del file path " + filePath + " : " + e);
    }
}

export const deleteFile = (file?: Express.Multer.File) => {
    if (file != null) {
        deleteFileByPath(file.path);
    }
}

