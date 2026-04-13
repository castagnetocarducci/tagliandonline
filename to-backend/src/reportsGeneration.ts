import {readFileSync, writeFileSync} from "node:fs";
import createReport from "docx-templates";
import {toDataURL} from "qrcode";
import type {ErrOrSuccess} from "./utils/commonTypes.ts";
import {getErrorString} from "./utils/commonFunctions.ts";
import {ConfigProvider} from "./configProvider.ts";
import {join} from "node:path";
import {deleteFileByPath, getSuffixedFilenameStr} from "./files/filesStorages.ts";

export type VoucherTemplateData = {
    numeroTagliandoStr: string,
    descrizionePermessoStr: string,
    tipologiaDomanda: string,
    dataProtocolloStr: string,
    numeroProtocolloStr: string,
    dataCompletamentoStr: string,
    dataInizioValiditaStr: string,
    dataFineValiditaStr: string,
    cognomeIstruttoreStr: string,
    nomeIstruttoreStr: string,
    cognomeRichiedenteStr: string,
    nomeRichiedenteStr: string,
    comuneNascitaRichiedenteStr: string,
    dataNascitaRichiedenteStr: string,
    codiceFiscaleRichiedenteStr: string,
    comuneResidenzaRichiedenteStr: string,
    indirizzoResidenzaRichiedenteStr: string,
    indirizzoAbitazioneDesignataStr: string,
    catastoFoglioAbitazioneDesignataStr: string,
    catastoMappaleAbitazioneDesignataStr: string,
    catastoSubalternoAbitazioneDesignataStr: string,
    catastoCategoriaAbitazioneDesignataStr: string,
    targheArr: {
        marcaStr: string,
        modelloStr: string,
        targaStr: string
    }[]
    verificationUrl: string,
}

const cmdDelimiters: [string, string] = ["{#", "#}"];

export const generateVoucherDocumentFromTemplate = async (templateFilepath: string, fileBaseName: string, voucherId: number, inputData: VoucherTemplateData) => {
    const filename = fileBaseName + ".docx";
    const outputFilePath = join(ConfigProvider.instance.prepareVoucherFolderPath(voucherId), getSuffixedFilenameStr(filename));
    const res = await generateDocumentFromTemplate(templateFilepath, outputFilePath, inputData);
    return {
        success: res.success,
        err: res.err,
        path: outputFilePath
    };
}

export const generateDocumentFromTemplate = async (templateFilepath: string, outputFilepath: string, inputData: VoucherTemplateData): Promise<ErrOrSuccess> => {
    try {
        console.log("Generating report from template: " + templateFilepath + " to " + outputFilepath);
        const template = readFileSync(templateFilepath);
        const buffer = await createReport.createReport({
            template,
            data: inputData,
            additionalJsContext: {
                qrCode: async (url: string) => {
                    const dataUrl = await toDataURL(url);
                    const data = dataUrl.slice('data:image/png;base64,'.length);
                    return { width: 6, height: 6, data, extension: '.png' }; //width height in cm
                },
            },
            cmdDelimiter: cmdDelimiters
        });

        writeFileSync(outputFilepath, buffer)
        return {
            success: true
        };
    } catch (e) {
        deleteFileByPath(outputFilepath);
        console.error("Report generation failed:");
        console.error(e);
        return {
            err: getErrorString(e),
            success: false,
        };
    }
}

