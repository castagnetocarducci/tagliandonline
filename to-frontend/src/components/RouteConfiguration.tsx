import {Route, Routes} from "react-router";
import {Home} from "../pages/Home.tsx";
import {NotFound} from "../pages/NotFound.tsx";
import {Inspections} from "../pages/Inspections.tsx";
import {Users} from "../pages/users/Users.tsx";
import {CheckVoucher} from "../pages/vouchers/vouchers/CheckVoucher.tsx";
import {Profile} from "../pages/profile/Profile.tsx";
import {PermitsManagement} from "../pages/permits/PermitsManagement.tsx";
import {Login} from "../pages/profile/Login.tsx";
import {PasswordResetRequest} from "../pages/profile/PasswordResetRequest.tsx";
import {PasswordResetExecute} from "../pages/profile/PasswordResetExecute.tsx";
import {useUserDataContext} from "../hooks/useUserDataContext.ts";
import {EditUser} from "../pages/users/EditUser.tsx";
import {NewUser} from "../pages/users/NewUser.tsx";
import {VehiclesManagement} from "../pages/vehicles/VehiclesManagement.tsx";
import {ApplicationsManagement} from "../pages/applications/ApplicationsManagement.tsx";
import {VouchersManagement} from "../pages/vouchers/VouchersManagement.tsx";

export const RouteConfiguration = () => {
    const userDataCtx = useUserDataContext()
    return (
        <Routes>
            <Route path="*" element={<NotFound/>}/>
            <Route path="/" element={<Home/>}/>
            <Route path="/home" element={<Home/>}/>
            {userDataCtx.userData && (userDataCtx.userData.role === "admin" || userDataCtx.userData.role === "operatore" || userDataCtx.userData.role === "vigile") && (
                <>
                    <Route path="/applications/*" element={<ApplicationsManagement/>}/>
                    <Route path="/inspections/*" element={<Inspections/>}/>
                    <Route path="/vouchers/*" element={<VouchersManagement/>}/>
                    <Route path="/permits/*" element={<PermitsManagement/>}/>
                    <Route path="/vehicles/*" element={<VehiclesManagement/>}/>
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
            <Route path="/check-voucher/:voucherID" element={<CheckVoucher/>}/>
            <Route path="/profile/*" element={<Profile/>}/>
            <Route path="/login/*" element={<Login/>}/>
            <Route path="/password-reset/:token" element={<PasswordResetExecute/>}/>
            <Route path="/password-reset/" element={<PasswordResetExecute/>}/>
            <Route path="/password-reset-request" element={<PasswordResetRequest/>}/>
        </Routes>
    )
}
