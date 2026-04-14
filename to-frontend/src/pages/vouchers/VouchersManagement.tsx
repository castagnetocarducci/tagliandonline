import {Container} from "design-react-kit";
import {Route, Routes, useLocation, useNavigate} from "react-router";
import {useEffect} from "react";
import {useUserDataContext} from "../../hooks/useUserDataContext.ts";
import {VouchersList} from "./vouchers/VouchersList.tsx";
import {NewVoucher} from "./vouchers/NewVoucher.tsx";
import {EditVoucher} from "./vouchers/EditVoucher.tsx";
import {VoucherHistory} from "./vouchers/VoucherHistory.tsx";

export const VouchersManagement = () => {
    const userDataCtx = useUserDataContext();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (userDataCtx.userData == null || (userDataCtx.userData.role !== "vigile" && userDataCtx.userData.role !== "operatore" && userDataCtx.userData.role !== "admin")) {
            navigate("/");
        }
    }, [userDataCtx, navigate]);

    useEffect(() => {
        if (location.pathname === "/vouchers" || location.pathname === "/vouchers/") {
            navigate("/vouchers/list");
        }
    }, [location, navigate]);


    return (

        <Container className={"mt-2"}>
            <Routes>
                {(userDataCtx.userData != null && (userDataCtx.userData.role === "operatore" || userDataCtx.userData.role === "admin")) &&
                    <Route path="/list/new" element={<NewVoucher/>}/>
                }
                <Route path="/list/:voucherID/history" element={<VoucherHistory/>}/>
                <Route path="/list/:voucherID" element={<EditVoucher/>}/>
                <Route path="/list" element={<VouchersList/>}/>
            </Routes>
        </Container>
    );
}
