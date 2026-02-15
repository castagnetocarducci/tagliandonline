import {type PropsWithChildren, useEffect, useState} from "react";
import {UserDataContext} from "./UserDataContext.tsx";
import {type UserData, type UserInfoApiResponse} from "../utils/Types.ts";
import {defaultGETRequestInit, fetchApiAsync} from "../utils/fetching.ts";

export const UserDataProvider = ({children}: PropsWithChildren)  => {
    const [userData, setUserData] = useState<UserData | null>(null);

    useEffect(() => {
        const abort = fetchApiAsync<UserInfoApiResponse>({
            urlFromApiRoot: "/auth/user-info",
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null) {
                    setUserData(data.user);
                }
            }
        });
        return abort;
    }, [setUserData])

    return (
        <UserDataContext.Provider value={{
            userData: userData,
            setUserData: setUserData
        }}>
            {children}
        </UserDataContext.Provider>
    );

}





