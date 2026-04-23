import {Container} from "design-react-kit";
import {Route, Routes, useLocation, useNavigate} from "react-router";
import {useEffect} from "react";
import {useUserDataContext} from "../../hooks/useUserDataContext.ts";
import {VouchersList} from "./vouchers/VouchersList.tsx";
import {NewVoucher} from "./vouchers/NewVoucher.tsx";
import {EditInspection} from "./vouchers/EditInspection.tsx";
import {VoucherHistory} from "./vouchers/VoucherHistory.tsx";

export const InspectionsManagement = () => {
    const userDataCtx = useUserDataContext();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (userDataCtx.userData == null || (userDataCtx.userData.role !== "vigile" && userDataCtx.userData.role !== "operatore" && userDataCtx.userData.role !== "admin")) {
            navigate("/");
        }
    }, [userDataCtx, navigate]);

    useEffect(() => {
        if (location.pathname === "/inspections" || location.pathname === "/inspections/") {
            navigate("/inspections/list", {replace: true});
        }
    }, [location, navigate]);


    return (

        <Container className={"mt-2"}>
            <Routes>
                <Route path="/list/new" element={<NewInspection/>}/>
                <Route path="/list/:inspectionID/new" element={<NewCheck/>}/>
                <Route path="/list/:inspectionID/:checkID" element={<EditCheck/>}/>
                <Route path="/list/:inspectionID" element={<EditInspection/>}/>
                <Route path="/list" element={<InspectionsList/>}/>
            </Routes>
        </Container>
    );
}