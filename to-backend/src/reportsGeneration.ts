import {readFileSync, writeFileSync} from "node:fs";
import createReport from "docx-templates";
import {toDataURL} from "qrcode";
import type {ErrOrSuccess} from "./utils/commonTypes.ts";
import {getErrorString} from "./utils/commonFunctions.ts";

type VoucherData = {
    numeroTalignadoStr: string,
    descrizionePermessoStr: string,
    tipologiaDomanda: string,
    dataProtocolloStr: string,
    numeroProtocolloStr: string,
    dataCopmletamentoStr: string,
    dataInizioValiditaStr: string,
    dataFineValiditaStr: string,
    cognomeIstruttoreStr: string,
    nomeIstruttoreStr: string,
    cognomeRichiedenteStr: string,
    nomeRichiedenteStr: string,
    comuneNascinaRichiedenteStr: string,
    dataNascinaRichiedenteStr: string,
    codiceFiscaleRichiedenteStr: string,
    comuneResidenzaRichiedenteStr: string,
    indirizzoResidenzaRichiedenteStr: string,
    indrizzoAbitazioneDesignataStr: string,
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

export const generateDocumentFromTemplate = async (templateFilepath: string, outputFilepath: string, inputData: VoucherData): Promise<ErrOrSuccess> => {
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
        console.error("Report generation failed:");
        console.error(e);
        return {
            err: getErrorString(e),
            success: false,
        };
    }
}

