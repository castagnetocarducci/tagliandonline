import {Container} from "design-react-kit";
import {Route, Routes, useLocation, useNavigate} from "react-router";
import {useEffect} from "react";
import {useUserDataContext} from "../../hooks/useUserDataContext.ts";
import {EditInspection} from "./inspections/EditInspection.tsx";
import {NewInspection} from "./inspections/NewInspection.tsx";
import {InspectionsList} from "./inspections/InspectionsList.tsx";
import {NewInspectionCheck} from "./inspections/checks/NewInspectionCheck.tsx";

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
                {/*<Route path="/list/:inspectionID/check/new" element={<NewCheck/>}/>*/}
                {/*<Route path="/list/:inspectionID/anomaly/:anomalyID" element={<EditInspection/>}/>*/}
                {/*<Route path="/list/:inspectionID/check/:checkID" element={<EditInspection/>}/>*/}
                <Route path="/list/:inspectionID" element={<EditInspection/>}/>
                <Route path="/list/:inspectionID/new" element={<NewInspectionCheck/>}/>
                <Route path="/list" element={<InspectionsList/>}/>
            </Routes>
        </Container>
    );
}