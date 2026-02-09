import {type ReactNode, useEffect, useState} from "react";
import {UserDataContext} from "./UserDataContext.tsx";
import {type UserData, type UserInfoApiResponse} from "../utils/Types.ts";
import {fetchApiAsync} from "../utils/fetching.ts";

export const UserDataProvider = ({children}: { children: ReactNode })  => {
    const [userData, setUserData] = useState<UserData | null>(null);

    useEffect(() => {
        const abort = fetchApiAsync<UserInfoApiResponse>("/userInfo", (data) => {
            if (data != null) {
                setUserData(data.user);
            }
        });
        return abort;
    })

    return (
        <UserDataContext.Provider value={{
            userData: userData,
            setUserData: setUserData
        }}>
            {children}
        </UserDataContext.Provider>
    );

}





