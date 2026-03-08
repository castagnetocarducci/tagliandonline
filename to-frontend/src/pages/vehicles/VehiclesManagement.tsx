import {Container} from "design-react-kit";
import {Route, Routes, useLocation, useNavigate} from "react-router";
import {useEffect} from "react";
import {useUserDataContext} from "../../hooks/useUserDataContext.ts";
import {VehiclesList} from "./vehicles/VehiclesList.tsx";
import {NewVehicle} from "./vehicles/NewVehicle.tsx";
import {EditVehicle} from "./vehicles/EditVehicle.tsx";
import {VehicleHistory} from "./vehicles/VehicleHistory.tsx";

export const VehiclesManagement = () => {
    const userDataCtx = useUserDataContext();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (userDataCtx.userData == null || (userDataCtx.userData.role !== "vigile" && userDataCtx.userData.role !== "operatore" && userDataCtx.userData.role !== "admin")) {
            navigate("/");
        }
    }, [userDataCtx, navigate]);

    useEffect(() => {
        if (location.pathname === "/vehicles" || location.pathname === "/vehicles/") {
            navigate("/vehicles/list");
        }
    }, [location, navigate]);


    return (

        <Container className={"mt-2"}>
            <Routes>
                <Route path="/list/new" element={<NewVehicle/>}/>
                <Route path="/list/:vehicleID/history" element={<VehicleHistory/>}/>
                <Route path="/list/:vehicleID" element={<EditVehicle/>}/>
                <Route path="/list" element={<VehiclesList/>}/>
            </Routes>
        </Container>
    );
}
