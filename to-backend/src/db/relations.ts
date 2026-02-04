import {defineRelations} from "drizzle-orm";
import * as schema from "./schema.ts";

export const relations = defineRelations(schema, (r) => ({

    authUsers: {
        role: r.one.roles({
            from: r.authUsers.roleId,
            to: r.roles.id
        }),
        logins: r.many.loginHistory(),
    },

    roles: {
        users: r.many.authUsers(),
    },

    loginHistory: {
        user: r.one.authUsers({
            from: r.loginHistory.userId,
            to: r.authUsers.id
        }),
    },



}));




