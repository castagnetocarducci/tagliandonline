import {Collapse, Header, HeaderContent, HeaderToggler, Icon, Nav, NavItem} from "design-react-kit";
import {useUserDataContext} from "../../hooks/useUserDataContext.tsx";
import {RouterDesignNavLink} from "../links/RouterDesignNavLink.tsx";
import {useState} from "react";
import {Link} from "react-router";

export const NavHeader = () => {
    const userData = useUserDataContext();
    const [openNav, setOpenNav] = useState(false);
    const toggleNav = () => {
        setOpenNav(!openNav);
    }

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
                            <NavItem> <RouterDesignNavLink openNav={openNav} setOpenNav={setOpenNav} to={"/permits"} > Permessi </RouterDesignNavLink> </NavItem>
                            <NavItem> <RouterDesignNavLink openNav={openNav} setOpenNav={setOpenNav} to={"/applications"} > Domande </RouterDesignNavLink> </NavItem>
                            <NavItem> <RouterDesignNavLink openNav={openNav} setOpenNav={setOpenNav} to={"/vouchers"} > Tagliandi </RouterDesignNavLink> </NavItem>
                            <NavItem> <RouterDesignNavLink openNav={openNav} setOpenNav={setOpenNav} to={"/inspections"} > Controlli </RouterDesignNavLink> </NavItem>
                            <NavItem> <RouterDesignNavLink openNav={openNav} setOpenNav={setOpenNav} to={"/users"} > Utenti </RouterDesignNavLink> </NavItem>
                        </Nav>
                    </div>
                </Collapse>
            </HeaderContent>
        </Header>
    )
}