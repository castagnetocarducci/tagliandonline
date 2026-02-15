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
            object: "Invio tagliando {#numeroTalignadoStr#} - TagliandOnline",
            body: "La sua richiesta, presentata con protocollo n. {#numeroProtocolloStr#}, è stata accettata in data {#dataCopmletamentoStr#}.<br/>" +
                "Si trasmette in allegato il contrassegno <b>da stampare e tenere esposto nel veicolo</b> e l'autorizzazione <b>da stampare ed esibire in caso di controllo</b>."
        },
        {
            description: "rifiutata",
            object: "Domanda emissione tagliando rifiutata - TagliandOnline",
            body: "La sua richiesta, presentata con protocollo n. {#numeroProtocolloStr#}, è stata rifiutata in data {#dataCopmletamentoStr#}."
        },
        {
            description: "revocato",
            object: "Revoca tagliando {#numeroTalignadoStr#} - TagliandOnline",
            body: "Il suo tagliando n. {#numeroTalignadoStr#} è stato revocato, pertanto non è più valido."
        },
    ]);

    await db.insert(numerationRegisters).values([{description: "numerazione predefinita"}]);

    const modelsPath = ConfigProvider.instance.configs.modelsPath;
    const defaultAuthorizationTemplatePath = join(modelsPath, "default_autorizzazione.docx");
    const defaultVoucherTemplatePath = join(modelsPath, "default_contrassegno.docx");
    await db.insert(docTemplates).values([
        {description: "autorizzazione predefinita", path: defaultAuthorizationTemplatePath},
        {description: "contrassegno predefinito", path: defaultVoucherTemplatePath}
    ]);
    //come ultima cosa copio i modelli di default nella cartella dei modelli
    copyDefaultModels(defaultAuthorizationTemplatePath, defaultVoucherTemplatePath);
}

const copyDefaultModels = (destinationAuthorizationPath: string, destVoucherPath: string) => {
    const defaultTemplatesPath = join("docx_examples", "default_templates");
    const defaultAuthorizationPath = join(defaultTemplatesPath, "default_autorizzazione.docx");
    const defaultVoucherPath = join(defaultTemplatesPath, "default_contrassegno.docx");
    copyFileSync(defaultAuthorizationPath, destinationAuthorizationPath);
    copyFileSync(defaultVoucherPath, destVoucherPath);
}

