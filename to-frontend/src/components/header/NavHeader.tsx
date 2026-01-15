import {Collapse, Header, HeaderContent, HeaderToggler, Icon, Nav, NavItem, NavLink} from "design-react-kit";
import {useUserDataContext} from "../../hooks/useUserDataContext.tsx";
import {NavLink as RCNavLink} from "react-router";
import {RouterDesignNavLink} from "./RouterDesignNavLink.tsx";

export const NavHeader = () => {
    const userData = useUserDataContext();
    return (
        <Header theme="dark" type="navbar" >
            <HeaderContent expand="lg" megamenu>
            {/*<HeaderContent expand="sm">*/}
                <HeaderToggler
                    aria-controls="nav1"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                    onClick={() => {}}
                >
                    <Icon icon="it-burger" />
                </HeaderToggler>
                <Collapse header navbar onOverlayClick={() => {}}>
                    <div className="menu-wrapper">
                        <Nav navbar>
                            <NavItem> <RouterDesignNavLink to={"/permits"} > Permessi </RouterDesignNavLink> </NavItem>
                            <NavItem> <RouterDesignNavLink to={"/applications"} > Domande </RouterDesignNavLink> </NavItem>
                            <NavItem> <RouterDesignNavLink to={"/vouchers"} > Tagliandi </RouterDesignNavLink> </NavItem>
                            <NavItem> <RouterDesignNavLink to={"/inspections"} > Controlli </RouterDesignNavLink> </NavItem>
                            <NavItem> <RouterDesignNavLink to={"/users"} > Utenti </RouterDesignNavLink> </NavItem>
                        </Nav>
                    </div>
                </Collapse>
            </HeaderContent>
        </Header>
    )
}