import type {PagerPageData} from "../components/AutoPager.tsx";

export type Role = "admin" | "operatore" | "vigile";

export type DataMessage = {
    message: string
}

export type AddedElementMessageApiResponse = {
    message: string,
    id: number
}

// region Users
export type UserData = {
    id: number,
    username: string,
    firstName: string,
    lastName: string,
    email: string,
    cf: string,
    role: Role,
}

export type UserInfoApiResponse = {
    message: string,
    user: UserData
}

export type UserListEntry = {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    disabled: boolean
}

export type UserListEntryApiResponse = {
    message: string,
    usersList: UserListEntry[]
}

export type UserLoginHistoryEntry = {
    clientIp: string,
    createdAt: string
}

export type UserDetails = {
    id: number,
    username: string,
    firstName: string,
    lastName: string,
    email: string,
    cf: string,
    role: string,
    disabled: boolean
    lastPasswordResetDate: string,
    createdAt: string,
    updatedAt: string,
    latestLoginHistory: UserLoginHistoryEntry[],
}

export type UserDetailsApiResponse = {
    message: string,
    user: UserDetails
}

export type UserDataContextType = {
    userData: UserData | null,
    setUserData: (userData: UserData | null) => void
}
// endregion

// region History
export type ModificationEntry = {
    description: string,
    value: string
}

export type HistoryModificationMap = {
    [key: string]: ModificationEntry
}

export type HistoryEvent = {
    userId: number,
    username: string,
    timestamp: string,
    modificationsMap: HistoryModificationMap
}
// endregion

// region DocTemplates
export type DocTemplateListEntry = {
    id: number,
    createdAt: string,
    updatedAt: string,
    disabled: boolean,
    description: string,
    path: string
}

export type DocTemplateListApiResponse = {
    message: string,
    docTemplatesList: DocTemplateListEntry[]
}

export type DocTemplateDetailApiResponse = {
    message: string,
    docTemplate: DocTemplateListEntry
}
//endregion

//region EmailTemplates
export type EmailTemplateListEntry = {
    id: number,
    createdAt: string,
    updatedAt: string,
    disabled: boolean,
    description: string
}

export type EmailTemplateDetail = {
    id: number,
    createdAt: string,
    updatedAt: string,
    disabled: boolean,
    description: string,
    subject: string,
    body: string
}

export type EmailTemplateListApiResponse = {
    message: string,
    emailTemplatesList: EmailTemplateListEntry[]
}

export type EmailTemplateDetailApiResponse = {
    message: string,
    emailTemplate: EmailTemplateDetail
}
//endregion

// region NumerationRegisters
export type NumerationRegisterListEntry = {
    id: number,
    createdAt: string,
    updatedAt: string,
    nextNumber: number,
    disabled: boolean,
    description: string
}

export type NumerationRegisterListApiResponse = {
    message: string,
    numerationRegisterList: NumerationRegisterListEntry[]
}

export type NumerationRegisterApiResponse = {
    message: string,
    numerationRegister: NumerationRegisterListEntry
}
//endregion

// region Permits
export type PermitListEntry = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    description: string,
    printedName: string,
    disabled: boolean,
    simultaneousPlatesAmount: number,
    applicationPlatesAmount: number
}

export type PermitDetails = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    description: string,
    printedName: string,
    simultaneousPlatesAmount: number,
    applicationPlatesAmount: number,
    disabled: boolean,
    notes: string,
    voucherDurationDays: number,
    approveEmailTemplateId: number,
    revokeEmailTemplateId: number,
    refuseEmailTemplateId: number,
    voucherTemplateId: number,
    authorizationTemplateId: number,
    numerationRegisterId: number,
    lastPermitHistoryId: number,
}

export type PermitListApiResponse = {
    message: string,
    permitsList: PermitListEntry[]
}

export type PermitDetailsApiResponse = {
    message: string,
    permit: PermitDetails
}

export type PermitAvailableTemplatesApiResponse = {
    message: string,
    docTemplatesList: DocTemplateListEntry[],
    emailTemplatesList: EmailTemplateListEntry[],
    numerationRegisterList: NumerationRegisterListEntry[]
}

export type PermitHistoryApiResponse = {
    message: string,
    permitHistory: HistoryEvent[]
}
//endregion

//region Vehicles
export type VehicleListEntry = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    plate: string,
    model: string,
    brand: string,
}

export type VehicleDetails = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    plate: string,
    model: string,
    brand: string,
    applications: number[],
    vouchers: number[]
}

export type VehicleListApiResponse = {
    message: string,
    vehiclesList: VehicleListEntry[],
    pageData: PagerPageData
}

export type VehicleDetailsApiResponse = {
    message: string,
    vehicle: VehicleDetails
}

export type VehicleHistoryApiResponse = {
    message: string,
    vehicleHistory: HistoryEvent[]
}
//endregion

//region Applications
export type ApplicationTypeListEntry = {
    id: number,
    description: string,
    disabled: boolean,
}
export type ApplicationOutcomeListEntry = {
    id: number,
    description: string,
    disabled: boolean,
}

export type ApplicationAvailableOptionsApiResponse = {
    message: string,
    applicationTypes: ApplicationTypeListEntry[],
    applicationOutcomes: ApplicationOutcomeListEntry[],
    permits: PermitListEntry[]
}

export type ApplicationListEntry = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    requestDate: Date,
    outcomeDate: Date | null,
    registerNumber: number,
    registerDate: Date,
    cf: string,
    firstname: string,
    lastname: string,
    email: string,
    targetHousePlace: string,
    targetHouseLandRegistrySheet: string,
    targetHouseLandRegistryMap: string,
    targetHouseLandRegistrySubaltern: string,
    targetHouseLandRegistryCategory: string,
    permit: {
        id: number,
        description: string,
        disabled: boolean,
    },
    outcome: {
        id: number,
        description: string
    },
    type: {
        id: number,
        description: string
    }
    voucher: {
        id: number,
        number: number,
        revoked: boolean,
        validFromDate: Date,
        validToDate: Date
    } | null,
    emails: {
        id: number,
        to: string,
        subject: string,
        attachmentsPresent: boolean
    }[],
    vehicles: {
        id: number,
        createdAt: Date,
        updatedAt: Date,
        plate: string,
        model: string,
        brand: string,
    }[],
}

export type ApplicationListApiResponse = {
    message: string,
    applicationsList: ApplicationListEntry[],
    pageData: PagerPageData
}

export type ApplicationDetails = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    requestDate: Date,
    outcomeDate: Date | null,
    registerNumber: number,
    registerDate: Date,
    cf: string,
    firstname: string,
    lastname: string,
    email: string,
    birthDate: Date | null,
    birthCity: string | null,
    residenceCity: string | null,
    residencePlace: string | null,
    targetHousePlace: string | null,
    targetHouseLandRegistrySheet: string | null,
    targetHouseLandRegistryMap: string | null,
    targetHouseLandRegistrySubaltern: string | null,
    targetHouseLandRegistryCategory: string | null,
    notes: string,

    permit: {
        id: number,
        description: string,
        disabled: boolean,
    },
    outcome: {
        id: number,
        description: string
    },
    type: {
        id: number,
        description: string
    },
    outcomeAuthUser: {
        id: number,
        username: string,
    } | null,
    voucher: {
        id: number,
        number: number,
        revoked: boolean,
        validFromDate: Date,
        validToDate: Date
    } | null,
    emails: {
        id: number,
        to: string,
        subject: string,
        attachmentsPresent: boolean
    }[],
    vehicles: {
        id: number,
        createdAt: Date,
        updatedAt: Date,
        plate: string,
        model: string,
        brand: string,
    }[],
}

export type ApplicationDetailsApiResponse = {
    message: string,
    application: ApplicationDetails
}

export type ApplicationHistoryApiResponse = {
    message: string,
    applicationHistory: HistoryEvent[]
}
//endregion

//region Vouchers
export type VoucherPublicCheck = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    number: number,
    revoked: boolean,
    currentState: string,
    validFromDate: Date,
    validToDate: Date,
    permit: {
        id: number,
        description: string,
        disabled: boolean,
        simultaneousPlatesAmount: number,
        applicationPlatesAmount: number,
        voucherDurationDays: number
    },
    vehicles: {
        id: number,
        plate: string,
        model: string,
        brand: string,
    }[]
}

export type VoucherListEntry = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    number: number,
    revoked: boolean,
    currentState: string,
    validFromDate: Date,
    validToDate: Date,
    permit: {
        id: number,
        description: string,
        disabled: boolean
    },
    vehicles: {
        id: number,
        plate: string,
        model: string,
        brand: string,
    }[],
    applications: {
        id: number,
        registerNumber: number,
        registerDate: Date,
        cf: string,
        firstname: string,
        lastname: string,
        email: string,
        targetHousePlace: string | null,
        targetHouseLandRegistrySheet: string | null,
        targetHouseLandRegistryMap: string | null,
        targetHouseLandRegistrySubaltern: string | null,
        targetHouseLandRegistryCategory: string | null,
    }[]
}

export type VoucherDetails = {
    id: number,
    createdAt: Date,
    updatedAt: Date,
    number: number,
    revoked: boolean,
    currentState: string,
    validFromDate: Date,
    validToDate: Date,
    notes: string,
    generatedVoucherTemplatePath: string | null,
    generatedAuthorizationTemplatePath: string | null,
    generatedVoucherPdfPath: string | null,
    generatedAuthorizationPdfPath: string | null,
    signedAuthorizationPath: string | null,
    permit: {
        id: number,
        description: string,
        printedName: string,
        disabled: boolean,
        simultaneousPlatesAmount: number,
        applicationPlatesAmount: number,
        voucherDurationDays: number
    },
    applications: {
        id: number,
        registerNumber: number,
        registerDate: Date,
        cf: string,
        firstname: string,
        lastname: string,
        email: string,
        outcomeDate: Date | null,
        outcomeDescription: string,
        typeDescription: string,
        targetHousePlace: string | null,
        targetHouseLandRegistrySheet: string | null,
        targetHouseLandRegistryMap: string | null,
        targetHouseLandRegistrySubaltern: string | null,
        targetHouseLandRegistryCategory: string | null,
        vehicles: {
            id: number,
            createdAt: Date,
            updatedAt: Date,
            plate: string,
            model: string,
            brand: string,
        }[],
    }[],
    vehicles: {
        id: number,
        createdAt: Date,
        updatedAt: Date,
        plate: string,
        model: string,
        brand: string,
    }[],
    emails: {
        id: number,
        to: string,
        subject: string,
        attachmentsPresent: boolean,
    }[],
}

export type VoucherAvailableOptionsApiResponse = {
    message: string,
    permits: PermitListEntry[]
}

export type VoucherHistoryApiResponse = {
    message: string,
    voucherHistory: HistoryEvent[]
}

export type VoucherListApiResponse = {
    message: string,
    vouchersList: VoucherListEntry[],
    pageData: PagerPageData
}

export type VoucherPublicCheckApiResponse = {
    message: string,
    voucherPublicCheck: VoucherPublicCheck
}

export type VoucherDetailsApiResponse = {
    message: string,
    voucher: VoucherDetails
}

export type VoucherByIDApiResponse = {
    message: string,
    voucher: VoucherListEntry
}

export type VoucherEditApiResponse = {
    message: string,
    needTemplateGeneration: boolean
}

export type VoucherUploadApiResponse = {
    message: string,
    voucher: VoucherDetails,
    needPdfConversion: boolean
}

export type VoucherConvertPdfApiResponse = {
    message: string,
    voucher: VoucherDetails
}

//endregion

