import {Collapse, Header, HeaderContent, HeaderToggler, Icon, Nav, NavItem} from "design-react-kit";
import {useUserDataContext} from "../../hooks/useUserDataContext.tsx";
import {RouterDesignNavLink} from "./RouterDesignNavLink.tsx";
import {useState} from "react";

export const NavHeader = () => {
    const userData = useUserDataContext();
    const [openNav, setOpenNav] = useState(false);
    const toggleNav = () => {
        setOpenNav(!openNav);
    }
    console.log(openNav)
    return (
        <Header theme="dark" type="navbar" >
            <HeaderContent expand="lg" megamenu>
            {/*<HeaderContent expand="sm">*/}
                <HeaderToggler
                    aria-controls="nav1"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                    onClick={() => {toggleNav();}}
                >
                    <Icon icon="it-burger" />
                </HeaderToggler>
                <Collapse header navbar
                          isOpen={openNav} onOverlayClick={() => {toggleNav();}}>
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