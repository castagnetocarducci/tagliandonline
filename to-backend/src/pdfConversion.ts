import {runCmd} from "./processInteraction.js";
import {dirname, basename, extname} from "node:path";
import {existsSync} from "node:fs";

export const convertPDF = async (srcFilepath: string, outFilepath?: string): Promise<string | null>  => {
    if (!existsSync(srcFilepath)) {
        console.error("PDF conversion failed: file " + srcFilepath + " does not exist");
        return null;
    }
    const srcDir = dirname(srcFilepath);
    const conversionResult = await runCmd("soffice --headless --convert-to pdf:writer_pdf_Export '" + srcFilepath + "' --outdir '" + srcDir + "'");
    if (!conversionResult.success) {
        console.error("PDF conversion failed:", conversionResult.err);
        return null;
    }

    const baseName = basename(srcFilepath, extname(srcFilepath));
    const generatedPdfPath = srcDir + "/" + baseName + ".pdf";

    if (outFilepath) {
        const outDir = dirname(outFilepath);
        const moveResult = await runCmd("mkdir -p '" + outDir + "' && mv -f '" + generatedPdfPath + "' '" + outFilepath + "'");
        if (!moveResult.success) {
            console.error("Failed to move PDF:", moveResult.err);
            return null;
        }
        return outFilepath;
    }

    return generatedPdfPath;
}

