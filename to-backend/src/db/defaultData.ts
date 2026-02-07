import {DatabaseManager} from "./databaseManager.ts";
import {applicationOutcome, applicationTypes, authUsers, roles} from "./schema.ts";
import {generatePasswordHash} from "../auth.ts";
import {varchar} from "drizzle-orm/pg-core";

export const populateDefaultData = async () => {
    const db = DatabaseManager.instance.db;

    //TODO: check if data already exists
    const rolesCheck = await db.query.roles.findMany();
    if (rolesCheck.length > 0) {
        console.log("Roles already populated, skipping default data insertion");
    }

    await db.insert(applicationOutcome).values([{description: "presentata"}, {description: "accettata"}, {description: "rifiutata"}, {description: "annullata"}, {description: "in attesa"}, {description: "in corso"}, {description: "altro"}]);
    await db.insert(applicationTypes).values([{description: "nuovo"}, {description: "modifica"}, {description: "smarrimento"}, {description: "rinnovo"}, {description: "altro"}]);

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


}
