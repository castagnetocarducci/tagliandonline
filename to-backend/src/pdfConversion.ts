import {runCmd} from "./processInteraction.js";
import {dirname, basename, extname} from "node:path";
import {existsSync, mkdirSync, renameSync} from "node:fs";
import {ConfigProvider} from "./configProvider.ts";

export const convertPDF = async (srcFilepath: string, outFilepath?: string): Promise<string | null>  => {
    console.log("Converting to PDF: " + srcFilepath + (outFilepath ? " to " + outFilepath : ""));
    if (!existsSync(srcFilepath)) {
        console.error("PDF conversion failed: file " + srcFilepath + " does not exist");
        return null;
    }
    const sofficePath = ConfigProvider.instance.configs.sofficePath;
    const srcDir = dirname(srcFilepath);
    const conversionResult = runCmd("\"" + sofficePath + "\" --headless --convert-to pdf:writer_pdf_Export \"" + srcFilepath + "\" --outdir \"" + srcDir + "\"");
    if (!conversionResult.success) {
        console.error("PDF conversion failed:", conversionResult.err);
        return null;
    }

    const baseName = basename(srcFilepath, extname(srcFilepath));
    const generatedPdfPath = srcDir + "/" + baseName + ".pdf";

    if (outFilepath) {
        const outDir = dirname(outFilepath);
        try {
            mkdirSync(outDir, {recursive: true});
            renameSync(generatedPdfPath, outFilepath);
        } catch (e) {
            console.error("Failed to move PDF: ", e);
        }
        // const moveResult = runCmd("mkdir -p \"" + outDir + "\" && mv -f \"" + generatedPdfPath + "\" \"" + outFilepath + "\"");
        // if (!moveResult.success) {
        //     console.error("Failed to move PDF:", moveResult.err);
        //     return null;
        // }
        return outFilepath;
    }

    return generatedPdfPath;
}

