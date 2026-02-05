import {defineRelations} from "drizzle-orm";
import * as schema from "./schema.ts";

export const relations = defineRelations(schema, (r) => ({
    permits: {
        voucherDocTemplate: r.one.docTemplates({
            from: r.permits.voucherTemplateId,
            to: r.docTemplates.id,
            alias: "voucherTemplateRel",
        }),
        authorizationDocTemplate: r.one.docTemplates({
            from: r.permits.authorizationTemplateId,
            to: r.docTemplates.id,
            alias: "authorizationTemplateRel",
        }),
        numerationDocRegister: r.one.docTemplates({
            from: r.permits.numerationRegisterId,
            to: r.numerationRegisters.id
        }),
        applications: r.many.applications(),
        approveEmailTemplate: r.one.emailTemplates({
            from: r.permits.approveEmailTemplateId,
            to: r.emailTemplates.id,
            alias: "approveEmailTemplateRel"
        }),
        revokeEmailTemplate: r.one.emailTemplates({
            from: r.permits.revokeEmailTemplateId,
            to: r.emailTemplates.id,
            alias: "revokeEmailTemplateRel"
        }),
        refuseEmailTemplate: r.one.emailTemplates({
            from: r.permits.refuseEmailTemplateId,
            to: r.emailTemplates.id,
            alias: "refuseEmailTemplateRel"
        }),
    },

    numerationRegisters: {
        permits: r.many.permits()
    },

    emailTemplates: {
        approvePermits: r.many.permits({
            alias: "approveEmailTemplateRel",
        }),
        revokePermits: r.many.permits({
            alias: "revokeEmailTemplateRel",
        }),
        refusePermits: r.many.permits({
            alias: "refuseEmailTemplateRel",
        }),
    },

    docTemplates: {
        voucherPermits: r.many.permits({
            alias: "voucherTemplateRel",
        }),
        authorizationPermits: r.many.permits({
            alias: "authorizationTemplateRel",
        }),
    },

    inspections: {
        authUsers: r.many.authUsers({
            from: r.inspections.id.through(r.inspectionsToAuthUsers.inspectionId),
            to: r.authUsers.id.through(r.inspectionsToAuthUsers.authUserId)
        }),
    },

    authUsers: {
        role: r.one.roles({
            from: r.authUsers.roleId,
            to: r.roles.id
        }),
        logins: r.many.loginHistory(),
        inspections: r.many.inspections(),
        outcomeApplications: r.many.applications(),
    },

    roles: {
        authUsers: r.many.authUsers(),
    },

    loginHistory: {
        authUser: r.one.authUsers({
            from: r.loginHistory.userId,
            to: r.authUsers.id
        }),
    },

    applications: {
        permit: r.one.permits({
            from: r.applications.permitId,
            to: r.permits.id
        }),
        outcome: r.one.applicationOutcome({
            from: r.applications.outcomeId,
            to: r.applicationOutcome.id
        }),
        type: r.one.applicationTypes({
            from: r.applications.typeId,
            to: r.applicationTypes.id
        }),
        outcomeAuthUser: r.one.authUsers({
            from: r.applications.outcomeAuthUserId,
            to: r.authUsers.id
        }),
        vehicles: r.many.vehicles({
            from: r.applications.id.through(r.applicationsToVehicles.applicationId),
            to: r.vehicles.id.through(r.applicationsToVehicles.vehicleId)
        }),
        voucher: r.one.vouchers({
            from: r.applications.voucherId,
            to: r.vouchers.id
        }),
        emails: r.many.applicationsEmailsHistory()
    },

    vehicles: {
        applications: r.many.applications(),
        vouchers: r.many.vouchers()
    },

    applicationOutcome: {
        applications: r.many.applications()
    },

    applicationTypes: {
        applications: r.many.applications()
    },

    applicationsEmailsHistory: {
        application: r.one.applications({
            from: r.applicationsEmailsHistory.applicationId,
            to: r.applications.id
        })
    },

    vouchers: {
        applications: r.many.applications(),
        vehicles: r.many.vehicles({
            from: r.vouchers.id.through(r.vouchersToVehicles.voucherId),
            to: r.vehicles.id.through(r.vouchersToVehicles.vehicleId)
        }),
        emails: r.many.vouchersEmailsHistory()
    },

    vouchersEmailsHistory: {
        voucher: r.one.vouchers({
            from: r.vouchersEmailsHistory.voucherId,
            to: r.vouchers.id
        })
    }


}));




