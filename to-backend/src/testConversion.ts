// import * as DOCX2PDFConverter from "docx2pdf-converter";
//
// try {
//     const res = DOCX2PDFConverter.convert("docx_examples/to_print.docx", "docx_examples/printed.pdf");
//     console.log(res);
//
// } catch (e) {
//     console.error(e);
// }

import {runCmd} from "./processManager.js";

async function testPdfConversion() {
    console.log("Executing pdf conversion test");
    let res = await runCmd("soffice --headless --convert-to pdf:writer_pdf_Export docx_examples/to_print.docx --outdir docx_examples/");
    console.log(res);
    res = await runCmd("soffice --headless --convert-to pdf:writer_pdf_Export");
    console.log(res);
}

testPdfConversion();


