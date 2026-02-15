import {Route, Routes} from "react-router";
import {Home} from "../pages/Home.tsx";
import {NotFound} from "../pages/NotFound.tsx";
import {Applications} from "../pages/Applications.tsx";
import {Inspections} from "../pages/Inspections.tsx";
import {Users} from "../pages/users/Users.tsx";
import {Vouchers} from "../pages/Vouchers.tsx";
import {Profile} from "../pages/profile/Profile.tsx";
import {Permits} from "../pages/Permits.tsx";
import {Login} from "../pages/profile/Login.tsx";
import {PasswordResetRequest} from "../pages/profile/PasswordResetRequest.tsx";
import {PasswordResetExecute} from "../pages/profile/PasswordResetExecute.tsx";
import {useUserDataContext} from "../hooks/useUserDataContext.ts";
import {EditUser} from "../pages/users/EditUser.tsx";
import {NewUser} from "../pages/users/NewUser.tsx";

export const RouteConfiguration = () => {
    const userDataCtx = useUserDataContext()
    return (
        <Routes>
            <Route path="*" element={<NotFound/>}/>
            <Route path="/" element={<Home/>}/>
            <Route path="/home" element={<Home/>}/>
            {userDataCtx.userData && (userDataCtx.userData.role === "admin" || userDataCtx.userData.role === "operatore" || userDataCtx.userData.role === "vigile") && (
                <>
                    <Route path="/applications/*" element={<Applications/>}/>
                    <Route path="/inspections/*" element={<Inspections/>}/>
                    <Route path="/vouchers/*" element={<Vouchers/>}/>
                    <Route path="/permits/*" element={<Permits/>}/>
                </>
            )}
            {userDataCtx.userData && (userDataCtx.userData.role === "admin") && (
                <>
                    <Route path="/users" element={<Users/>}/>
                    <Route path="/users/new" element={<NewUser/>}/>
                    <Route path="/users/:userID" element={<EditUser/>}/>
                </>
            )}
            {userDataCtx.userData == null && (
                <>
                    <Route path="/applications/*" element={<Login/>}/>
                    <Route path="/inspections/*" element={<Login/>}/>
                    <Route path="/vouchers/*" element={<Login/>}/>
                    <Route path="/permits/*" element={<Login/>}/>
                    <Route path="/users/*" element={<Login/>}/>
                </>
            )}
            <Route path="/profile/*" element={<Profile/>}/>
            <Route path="/login/*" element={<Login/>}/>
            <Route path="/password-reset/:token" element={<PasswordResetExecute/>}/>
            <Route path="/password-reset/" element={<PasswordResetExecute/>}/>
            <Route path="/password-reset-request" element={<PasswordResetRequest/>}/>
            {/*{userData.role >= 2 &&*/}
            {/*    <Route path="/positions" element={<MapPos/>}/>*/}
            {/*}*/}
            {/*{userData.role >= 5 &&*/}
            {/*    <Route path="/users" element={<Users/>}/>*/}
            {/*}*/}
        </Routes>
    )
}
