import {readFileSync, writeFileSync} from "node:fs";
import createReport from "docx-templates";
import {toDataURL} from "qrcode";

type VoucherData = {
    numeroTalignadoStr: string,
    descrizionePermessoStr: string,
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

const cmdDelimiters = ["{#", "#}"];

type ErrOrSuccess = {
    err?: string,
    success: boolean
}

export const generateDocumentFromTemplate = async (templateFilepath: string, outputFilepath: string, inputData: VoucherData): Promise<ErrOrSuccess> => {
    try {
        const template = readFileSync('docx_examples/template_full.docx');
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
            cmdDelimiter:["{#", "#}"]
        });

        writeFileSync('docx_examples/template_full_report.docx', buffer)
        return {
            success: true
        };
    } catch (e) {
        console.error("Execution failed");
        console.error(e);
        const errMsg = e instanceof Error ? e.toString() : "Unknown error."
        return {
            err: errMsg,
            success: false,
        };
    }
}

