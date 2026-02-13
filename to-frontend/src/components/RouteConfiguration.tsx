import {useUserDataContext} from "../hooks/useUserDataContext.ts";
import {Route, Routes} from "react-router";
import {Home} from "../pages/Home.tsx";
import {NotFound} from "../pages/NotFound.tsx";
import {Applications} from "../pages/Applications.tsx";
import {Inspections} from "../pages/Inspections.tsx";
import {Users} from "../pages/Users.tsx";
import {Vouchers} from "../pages/Vouchers.tsx";
import {Profile} from "../pages/profile/Profile.tsx";
import {Permits} from "../pages/Permits.tsx";
import {Login} from "../pages/profile/Login.tsx";
import {PasswordReset} from "../pages/profile/PasswordReset.tsx";

export const RouteConfiguration = () => {
    const userData = useUserDataContext()
    return (
        <Routes>
            <Route path="*" element={<NotFound/>}/>
            <Route path="/" element={<Home/>}/>
            <Route path="/home" element={<Home/>}/>
            <Route path="/applications/*" element={<Applications/>}/>
            <Route path="/inspections/*" element={<Inspections/>}/>
            <Route path="/users/*" element={<Users/>}/>
            <Route path="/vouchers/*" element={<Vouchers/>}/>
            <Route path="/permits/*" element={<Permits/>}/>
            <Route path="/profile/*" element={<Profile/>}/>
            <Route path="/login/*" element={<Login/>}/>
            <Route path="/password-reset/*" element={<PasswordReset/>}/>
            {/*{userData.role >= 2 &&*/}
            {/*    <Route path="/positions" element={<MapPos/>}/>*/}
            {/*}*/}
            {/*{userData.role >= 5 &&*/}
            {/*    <Route path="/users" element={<Users/>}/>*/}
            {/*}*/}
        </Routes>
    )
}
