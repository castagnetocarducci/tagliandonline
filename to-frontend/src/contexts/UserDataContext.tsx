import {createContext} from "react";
import type {UserDataContextType} from "../utils/Types.ts";

export const UserDataContext = createContext<UserDataContextType>({
    userData: null,
    setUserData: () => {}
});

