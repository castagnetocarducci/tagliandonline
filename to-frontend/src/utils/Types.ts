export type Role = "admin" | "operatore" | "vigile";

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

export type DataMessage = {
    message: string
}

export type AddedElementMessage = {
    message: string,
    id: number
}

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




