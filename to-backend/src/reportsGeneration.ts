import {readFileSync, writeFileSync} from "node:fs";
import createReport from "docx-templates";
import {toDataURL} from "qrcode";
import {convertPDF} from "./pdfConversion.ts";

async function testReportGeneration() {
    const template = readFileSync('docx_examples/template_full.docx');

    const buffer = await createReport.createReport({
        template,
        data: {
            voucherNum: "152/2026",
            permitStr: "ZTL Castello Castagneto Carducci",
            platesStr: "AB123CD, EF456GH",
            expirationDateStr: "31/12/2026",
            verificationUrl: "https://www.comune.castagneto-carducci.li.it/amministrazione/personale-amministrativo",
            firstnameStr: "Mario",
            lastnameStr: "Rossi"
        },
        additionalJsContext: {
            qrCode: async (url: string) => {
                const dataUrl = await toDataURL(url);
                const data = dataUrl.slice('data:image/gif;base64,'.length);
                return { width: 6, height: 6, data, extension: '.png' };
            },
        },
        cmdDelimiter:["{#", "#}"]
    });


    writeFileSync('docx_examples/template_full_report.docx', buffer)
    await convertPDF("docx_examples/template_full_report.docx")

}

testReportGeneration();

