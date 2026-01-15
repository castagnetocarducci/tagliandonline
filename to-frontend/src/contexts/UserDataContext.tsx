import {createContext} from "react";
import {Roles, type UserData} from "../utils/Types.ts";

export const UserDataContext = createContext<UserData>({
    userID: null,
    role: Roles.GUEST
});

