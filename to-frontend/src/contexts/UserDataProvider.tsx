import {type ReactNode, useState} from "react";
import {UserDataContext} from "./UserDataContext.tsx";
import {Roles} from "../utils/Types.ts";

export const UserDataProvider = ({children}: { children: ReactNode })  => {
    const [role, ] = useState<string>(Roles.GUEST);

    return (
        <UserDataContext.Provider value={{
            userID: null,
            role: role
        }}>
            {children}
        </UserDataContext.Provider>
    );

}





