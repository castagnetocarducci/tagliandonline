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
        permitHistory: r.many.permitsHistory({
            alias: "permitHistoryRel",
        }),
        lastPermitHistory: r.one.permitsHistory({ //non speculare
            from: r.permits.lastPermitHistoryId,
            to: r.permitsHistory.id,
            alias: "lastPermitHistoryRel",
        })
    },

    permitsHistory: {
        permit: r.one.permits({
            from: r.permitsHistory.permitId,
            to: r.permits.id,
            alias: "permitHistoryRel",
        }),
        modifiedByAuthUser: r.one.authUsers({
            from: r.permitsHistory.modifiedByAuthUserId,
            to: r.authUsers.id,
        }),
        voucherDocTemplate: r.one.docTemplates({
            from: r.permitsHistory.voucherTemplateId,
            to: r.docTemplates.id,
            alias: "permitsHistoryVoucherTemplateRel",
        }),
        authorizationDocTemplate: r.one.docTemplates({
            from: r.permitsHistory.authorizationTemplateId,
            to: r.docTemplates.id,
            alias: "permitsHistoryAuthorizationTemplateRel",
        }),
        numerationDocRegister: r.one.docTemplates({
            from: r.permitsHistory.numerationRegisterId,
            to: r.numerationRegisters.id
        }),
        applications: r.many.applicationsHistory(),
        approveEmailTemplate: r.one.emailTemplates({
            from: r.permitsHistory.approveEmailTemplateId,
            to: r.emailTemplates.id,
            alias: "permitsHistoryApproveEmailTemplateRel"
        }),
        revokeEmailTemplate: r.one.emailTemplates({
            from: r.permitsHistory.revokeEmailTemplateId,
            to: r.emailTemplates.id,
            alias: "permitsHistoryRevokeEmailTemplateRel"
        }),
        refuseEmailTemplate: r.one.emailTemplates({
            from: r.permitsHistory.refuseEmailTemplateId,
            to: r.emailTemplates.id,
            alias: "permitsHistoryRefuseEmailTemplateRel"
        }),
    },

    numerationRegisters: {
        permits: r.many.permits(),
        permitsHistory: r.many.permitsHistory(),
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
        approvePermitsHistory: r.many.permits({
            alias: "permitsHistoryApproveEmailTemplateRel",
        }),
        revokePermitsHistory: r.many.permits({
            alias: "permitsHistoryRevokeEmailTemplateRel",
        }),
        refusePermitsHistory: r.many.permits({
            alias: "permitsHistoryRefuseEmailTemplateRel",
        }),
    },

    docTemplates: {
        voucherPermits: r.many.permits({
            alias: "voucherTemplateRel",
        }),
        authorizationPermits: r.many.permits({
            alias: "authorizationTemplateRel",
        }),
        voucherPermitsHistory: r.many.permits({
            alias: "permitsHistoryVoucherTemplateRel",
        }),
        authorizationPermitsHistory: r.many.permits({
            alias: "permitsHistoryAuthorizationTemplateRel",
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
        permitsHistoryModifications: r.many.permitsHistory(),
        outcomeApplicationsHistory: r.many.applicationsHistory({
            alias: "applicationHistoryOutcomeAuthUserRel",
        }),
        applicationsHistoryModifications: r.many.applicationsHistory({
            alias: "applicationHistoryModifiedByAuthUserRel",
        }),
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
        emails: r.many.applicationsEmailsHistory(),
        applicationHistory: r.many.applicationsHistory({
            alias: "applicationHistoryRel",
        }),
        lastApplicationHistory: r.one.applicationsHistory({ //non speculare
            from: r.applications.lastApplicationHistoryId,
            to: r.applicationsHistory.id,
            alias: "lastApplicationHistoryRel",
        })
    },

    applicationsHistory: {
        application: r.one.applications({
            from: r.applicationsHistory.applicationId,
            to: r.applications.id,
            alias: "applicationHistoryRel",
        }),
        modifiedByAuthUser: r.one.authUsers({
            from: r.applicationsHistory.modifiedByAuthUserId,
            to: r.authUsers.id,
            alias: "applicationHistoryModifiedByAuthUserRel",
        }),
        permitHistory: r.one.permitsHistory({
            from: r.applicationsHistory.permitHistoryId,
            to: r.permitsHistory.id
        }),
        outcome: r.one.applicationOutcome({
            from: r.applicationsHistory.outcomeId,
            to: r.applicationOutcome.id
        }),
        type: r.one.applicationTypes({
            from: r.applicationsHistory.typeId,
            to: r.applicationTypes.id
        }),
        outcomeAuthUser: r.one.authUsers({
            from: r.applicationsHistory.outcomeAuthUserId,
            to: r.authUsers.id,
            alias: "applicationHistoryOutcomeAuthUserRel",
        }),
        //TODO: convert to history
        // vehicles: r.many.vehicles({
        //     from: r.applications.id.through(r.applicationsToVehicles.applicationId),
        //     to: r.vehicles.id.through(r.applicationsToVehicles.vehicleId)
        // }),
        //TODO: convert to history
        // voucher: r.one.vouchers({
        //     from: r.applications.voucherId,
        //     to: r.vouchers.id
        // }),

        //emails: r.many.applicationsEmailsHistory() - not available in history
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




