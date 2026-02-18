import {
    Container,
    Nav,
    NavItem,
    TabContainer,
    TabContent,
    TabNav,
    TabNavItem,
    TabNavLink,
    TabPane
} from "design-react-kit";
import {RouterDesignNavLink} from "../../components/links/RouterDesignNavLink.tsx";
import {RouterDesignTabLink} from "../../components/links/RouterDesignTabLink.tsx";

export const PermitsManagement = () => {
    return (
        <Container>
            <h1 className={"mb-4"}>Gestione permessi</h1>

            <TabContainer defaultActiveKey="permits">
                <TabNav>
                    <TabNavItem>
                        {/*<TabNavLink eventKey="permits"> Permessi </TabNavLink>*/}
                        <RouterDesignNavLink openNav={false} setOpenNav={()=>{}} to={"/permits/permits"}>Permessi</RouterDesignNavLink>
                    </TabNavItem>
                    <TabNavItem>
                        <RouterDesignNavLink openNav={false} setOpenNav={()=>{}} to={"/permits/templates/doc"}>Modelli di documento</RouterDesignNavLink>
                        {/*<TabNavLink eventKey="docTemplates"> Modelli di documento </TabNavLink>*/}
                    </TabNavItem>
                    <TabNavItem>
                        <TabNavLink eventKey="emailTempaltese"> Modelli di email </TabNavLink>
                    </TabNavItem>
                    <TabNavItem>
                        <TabNavLink eventKey="numerations"> Numerazioni </TabNavLink>
                    </TabNavItem>
                    <NavItem>
                        <RouterDesignTabLink to={"/permits/permits"}> Permessi </RouterDesignTabLink>
                    </NavItem>
                    <NavItem>
                        <RouterDesignTabLink to={"/permits/templates/doc"}> Domande </RouterDesignTabLink>
                    </NavItem>
                </TabNav>
                <TabContent>
                    <TabPane className="p-4" eventKey="permits">
                        Contenuto 1
                    </TabPane>
                    <TabPane className="p-4" eventKey="docTemplates">
                        Contenuto 2
                    </TabPane>
                    <TabPane className="p-4" eventKey="emailTempaltese">
                        Contenuto 3
                    </TabPane>
                    <TabPane className="p-4" eventKey="numerations">
                        Contenuto 4
                    </TabPane>
                </TabContent>
            </TabContainer>
            <Nav navbar>


            </Nav>
        </Container>
    );
}
