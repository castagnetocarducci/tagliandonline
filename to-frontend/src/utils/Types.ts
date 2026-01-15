export interface UserData {
    userID: string | null,
    role: string
}

export const Roles = {
    GUEST: "guest",
    OPERATOR: "operator",
    TRAFFICWARDEN: "trafficwarden",
    ADMIN: "admin"
}