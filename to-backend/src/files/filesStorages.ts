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
});

export const uploadModelsMulter = multer({
    storage: modelsStorage,
    limits: {
        fileSize: 2 * 1024 * 1024, //2MB
        files: 1
    }
});

// const getVoucherPrefixedSuffixedFilename = (voucherID: number, file: Express.Multer.File): string => {
//     const suffixedFilename =  getSuffixedFilename(file);
// }

export const vouchersStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (req.params.voucherID == null || typeof req.params.voucherID !== "string" ||
            req.params.voucherID.trim() == "" || isNaN(parseInt(req.params.voucherID))) {
            cb(new Error("Tagliando non trovato"), "/dev/null");
        } else {
            const voucherID = parseInt(req.params.voucherID as string);
            cb(null, ConfigProvider.instance.prepareVoucherFolderPath(voucherID));
        }
    },
    filename: (req, file, cb) => {
        cb(null, getSuffixedFilename(file));
    }
});

export const uploadVouchersMulter = multer({
    storage: vouchersStorage,
    limits: {
        fieldNameSize: 200,
        fileSize: 2 * 1024 * 1024, //2MB
        files: 3
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

export type FileFieldsType = { [fieldname: string]: Express.Multer.File[]; }

export const deleteFilesFields = (reqFilesFields:  { [fieldname: string]: Express.Multer.File[]; }) => {
    Object.values(reqFilesFields).forEach(function(value) {
        if (value != null && value.length > 0) {
            value.forEach(file => {
                if (file != null) {
                    deleteFileByPath(file.path);
                }
            })
        }
    });
}

export const getFileFromMulterFields = (reqFilesFields: FileFieldsType, fieldName: string): Express.Multer.File | null => {
    if (reqFilesFields[fieldName] == null || reqFilesFields[fieldName].length <= 0) {
        return null;
    }
    const file = reqFilesFields[fieldName][0];
    if (file == null) {
        return null;
    }
    return file;
}
