import {Container, TabContainer, TabContent, TabNav, TabNavItem} from "design-react-kit";
import {RouterDesignTabLink} from "../../components/links/RouterDesignTabLink.tsx";
import {Route, Routes, useLocation, useNavigate} from "react-router";
import {DocTemplatesList} from "./docTemplates/DocTemplatesList.tsx";
import {useEffect} from "react";
import {useUserDataContext} from "../../hooks/useUserDataContext.ts";
import {EditDocTemplate} from "./docTemplates/EditDocTemplate.tsx";
import {NewDocTemplate} from "./docTemplates/NewDocTemplate.tsx";
import {EmailTemplatesList} from "./emailTemplates/EmailTemplatesList.tsx";
import {EditEmailTemplate} from "./emailTemplates/EditEmailTemplate.tsx";
import {NewEmailTemplate} from "./emailTemplates/NewEmailTemplate.tsx";
import {NewNumerationRegister} from "./numerations/NewNumerationRegister.tsx";
import {EditNumerationRegister} from "./numerations/EditNumerationRegister.tsx";
import {NumerationRegistersList} from "./numerations/NumerationRegistersList.tsx";
import {PermitsList} from "./permits/PermitsList.tsx";
import {NewPermit} from "./permits/NewPermit.tsx";
import {EditPermit} from "./permits/EditPermit.tsx";
import {PermitHistory} from "./permits/PermitHisotry.tsx";

export const PermitsManagement = () => {
    const userDataCtx = useUserDataContext();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (userDataCtx.userData == null || (userDataCtx.userData.role !== "operatore" && userDataCtx.userData.role !== "admin")) {
            navigate("/");
        }
    }, [userDataCtx, navigate]);

    useEffect(() => {
        if (location.pathname === "/permits" || location.pathname === "/permits/") {
            navigate("/permits/list", {replace: true});
        }
    }, [location, navigate]);

        
    return (
        <Container>
            <h1 className={"mb-4"}>Gestione permessi</h1>

            <TabContainer defaultActiveKey="permits">
                <TabNav>
                    <TabNavItem>
                        <RouterDesignTabLink to={"/permits/list"}> Permessi </RouterDesignTabLink>
                    </TabNavItem>
                    <TabNavItem>
                        <RouterDesignTabLink to={"/permits/docTemplates"}> Modelli documento </RouterDesignTabLink>
                    </TabNavItem>
                    <TabNavItem>
                        <RouterDesignTabLink to={"/permits/emailTemplates"}> Modelli email </RouterDesignTabLink>
                    </TabNavItem>
                    <TabNavItem>
                        <RouterDesignTabLink to={"/permits/numerations"}> Numerazioni </RouterDesignTabLink>
                    </TabNavItem>
                </TabNav>
                <TabContent>
                    <Container className={"mt-2"}>
                        <Routes>
                            <Route path="/docTemplates/new" element={<NewDocTemplate/>}/>
                            <Route path="/docTemplates/:docTemplateID" element={<EditDocTemplate/>}/>
                            <Route path="/docTemplates" element={<DocTemplatesList/>}/>
                            <Route path="/emailTemplates/new" element={<NewEmailTemplate/>}/>
                            <Route path="/emailTemplates/:emailTemplateID" element={<EditEmailTemplate/>}/>
                            <Route path="/emailTemplates" element={<EmailTemplatesList/>}/>
                            <Route path="/numerations/new" element={<NewNumerationRegister/>}/>
                            <Route path="/numerations/:numerationRegisterID" element={<EditNumerationRegister/>}/>
                            <Route path="/numerations" element={<NumerationRegistersList/>}/>
                            <Route path="/list/new" element={<NewPermit/>}/>
                            <Route path="/list/:permitID/history" element={<PermitHistory/>}/>
                            <Route path="/list/:permitID" element={<EditPermit/>}/>
                            <Route path="/list" element={<PermitsList/>}/>
                        </Routes>
                    </Container>
                </TabContent>
            </TabContainer>
        </Container>
    );
}
