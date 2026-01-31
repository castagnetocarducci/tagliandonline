import {convertPDF} from "./pdfConversion.js";

async function testPdfConversion() {
    console.log("Executing pdf conversion test");
    let res = await convertPDF("docx_examples/to_print.docx");
    console.log(res);
    res = await convertPDF("docx_examples/to_print.docx", "docx_examples/to_print_new_name.pdf");
    console.log(res);
    res = await convertPDF("");
    console.log(res);
    res = await convertPDF("docx_examples/to_print_non_existent.docx");
    console.log(res);
    res = await convertPDF("docx_examples/folder");
    console.log(res);
    res = await convertPDF("docx_examples/to_print_bad.docx");
    console.log(res);
    res = await convertPDF("docx_examples/to_print_empty.docx");
    console.log(res);

}

testPdfConversion();


