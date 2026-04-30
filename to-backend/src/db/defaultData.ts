import { join } from "node:path";
import {DatabaseManager} from "./databaseManager.ts";
import {
    applicationOutcome,
    applicationTypes,
    authUsers,
    docTemplates,
    emailTemplates,
    numerationRegisters,
    roles
} from "./schema.ts";
import {copyFileSync} from "node:fs";
import {ConfigProvider} from "../configProvider.ts";
import {createFilenameSuffix} from "../files/filesStorages.ts";

export const populateDefaultData = async () => {
    const db = DatabaseManager.instance.db;

    // check if data already exists
    const rolesCheck = await db.query.roles.findMany();
    if (rolesCheck.length > 0) {
        console.log("Roles already populated, skipping default data insertion");
        return;
    }

    const adminRole = await db.insert(roles).values({description: "admin"}).returning();
    if (adminRole.length != 1 || adminRole[0] == null) {
        throw new Error("Error inserting admin role: " + adminRole.length + " rows returned");
    }
    await db.insert(authUsers).values({
        cf: "0000000000000000",
        firstname: "Administrator",
        lastname: "System",
        email: "",
        username: "admin",
        passwordHash: "",
        roleId: adminRole[0].id,
    });
    await db.insert(roles).values([{description: "operatore"}, {description: "vigile"}]);

    await db.insert(applicationOutcome).values([{description: "presentata"}, {description: "accettata"}, {description: "rifiutata"}, {description: "annullata"}, {description: "in attesa"}, {description: "in corso"}, {description: "altro"}]);
    await db.insert(applicationTypes).values([{description: "nuovo"}, {description: "modifica"}, {description: "smarrimento"}, {description: "rinnovo"}, {description: "altro"}]);

    await db.insert(emailTemplates).values([
        {
            description: "accettata",
            subject: "Invio tagliando {#numeroTagliandoStr#} - TagliandOnline",
            body: "La sua richiesta, presentata con protocollo n. {#numeroProtocolloStr#} del {#dataProtocolloStr#}, è stata accettata in data {#dataCompletamentoStr#}.<br/>" +
                "I veicoli autorizzati sono i seguenti: {#targheArr#}<br/>" +
                "Si trasmette in allegato il contrassegno <b>da stampare e tenere esposto nel veicolo</b> e l'autorizzazione <b>da stampare ed esibire in caso di controllo</b>."
        },
        {
            description: "rifiutata",
            subject: "Domanda emissione tagliando rifiutata - TagliandOnline",
            body: "La sua richiesta, presentata con protocollo n. {#numeroProtocolloStr#} del {#dataProtocolloStr#}, è stata rifiutata in data {#dataCompletamentoStr#}."
        },
        {
            description: "revocato",
            subject: "Revoca tagliando {#numeroTagliandoStr#} - TagliandOnline",
            body: "Il suo tagliando n. {#numeroTagliandoStr#} per {#descrizionePermessoStr#} è stato revocato, pertanto non è più valido."
        },
    ]);

    await db.insert(numerationRegisters).values([{description: "numerazione predefinita"}]);

    const modelsPath = ConfigProvider.instance.configs.modelsPath;
    const destAuthorizationTemplatePath = join(modelsPath, "default_autorizzazione" + createFilenameSuffix() + ".docx");
    const destVoucherTemplatePath = join(modelsPath, "default_contrassegno" + createFilenameSuffix() + ".docx");
    await db.insert(docTemplates).values([
        {description: "autorizzazione predefinita", path: destAuthorizationTemplatePath},
        {description: "contrassegno predefinito", path: destVoucherTemplatePath}
    ]);
    //come ultima cosa copio i modelli di default nella cartella dei modelli
    copyDefaultModels(destAuthorizationTemplatePath, destVoucherTemplatePath);
}

const copyDefaultModels = (destAuthorizationPath: string, destVoucherPath: string) => {
    const defaultTemplatesPath = join("docx_examples", "default_templates");
    const defaultAuthorizationPath = join(defaultTemplatesPath, "default_autorizzazione.docx");
    const defaultVoucherPath = join(defaultTemplatesPath, "default_contrassegno.docx");
    copyFileSync(defaultAuthorizationPath, destAuthorizationPath);
    copyFileSync(defaultVoucherPath, destVoucherPath);
}

