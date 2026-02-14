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
    cf: string | null;
    role: string;
    disabled: boolean,
    lastPasswordResetDate: string,
    createdAt: string,
    updatedAt: string,
}

export type UserListEntryApiResponse = {
    message: string,
    usersList: UserListEntry[]
}

export type UserDataContextType = {
    userData: UserData | null,
    setUserData: (userData: UserData | null) => void
}

export type DataMessage = {
    message: string
}


