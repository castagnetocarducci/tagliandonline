import {Container} from "design-react-kit";
import {Route, Routes, useLocation, useNavigate} from "react-router";
import {useEffect} from "react";
import {useUserDataContext} from "../../hooks/useUserDataContext.ts";
import {ApplicationsList} from "./applications/ApplicationsList.tsx";
import {NewApplication} from "./applications/NewApplication.tsx";
import {EditApplication} from "./applications/EditApplication.tsx";
import {ApplicationHistory} from "./applications/ApplicationHistory.tsx";

export const ApplicationsManagement = () => {
    const userDataCtx = useUserDataContext();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (userDataCtx.userData == null || (userDataCtx.userData.role !== "vigile" && userDataCtx.userData.role !== "operatore" && userDataCtx.userData.role !== "admin")) {
            navigate("/");
        }
    }, [userDataCtx, navigate]);

    useEffect(() => {
        if (location.pathname === "/applications" || location.pathname === "/applications/") {
            navigate("/applications/list");
        }
    }, [location, navigate]);


    return (

        <Container className={"mt-2"}>
            <Routes>
                {(userDataCtx.userData != null && (userDataCtx.userData.role === "operatore" || userDataCtx.userData.role === "admin")) &&
                    <Route path="/list/new" element={<NewApplication/>}/>
                }
                <Route path="/list/:applicationID/history" element={<ApplicationHistory/>}/>
                <Route path="/list/:applicationID" element={<EditApplication/>}/>
                <Route path="/list" element={<ApplicationsList/>}/>
            </Routes>
        </Container>
    );
}
