import {convertPDF} from "../pdfConversion.ts";
import {generateDocumentFromTemplate} from "../reportsGeneration.ts";

async function testReportGeneration() {
    const res = await generateDocumentFromTemplate('docx_examples/template_full.docx', 'docx_examples/template_full_report.docx', {
        numeroTagliandoStr: "q",
        descrizionePermessoStr: "transito ZTL CAPOLUOGO e sosta per RESIDENTI",
        tipologiaDomanda: "sostituzione",
        dataProtocolloStr: "e",
        numeroProtocolloStr: "r",
        dataCompletamentoStr: "t",
        dataInizioValiditaStr: "y",
        dataFineValiditaStr: "u",
        cognomeIstruttoreStr: "i",
        nomeIstruttoreStr: "o",
        cognomeRichiedenteStr: "p",
        nomeRichiedenteStr: "a",
        comuneNascitaRichiedenteStr: "s",
        dataNascitaRichiedenteStr: "d",
        codiceFiscaleRichiedenteStr: "d",
        comuneResidenzaRichiedenteStr: "f",
        indirizzoResidenzaRichiedenteStr: "g",
        indirizzoAbitazioneDesignataStr: "h",
        catastoFoglioAbitazioneDesignataStr: "j",
        catastoMappaleAbitazioneDesignataStr: "k",
        catastoSubalternoAbitazioneDesignataStr: "l",
        catastoCategoriaAbitazioneDesignataStr: "z",
        targheArr: [
            {
                marcaStr: "x",
                modelloStr: "c",
                targaStr: "AB123CD",
            },
            {
                marcaStr: "n",
                modelloStr: "m",
                targaStr: "EF456GH",
            },
        ],
        verificationUrl: "https://www.comune.castagneto-carducci.li.it/",
    });
    if (res.success) {
        await convertPDF("docx_examples/template_full_report.docx")
    }
}

testReportGeneration();
