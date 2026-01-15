import {useUserDataContext} from "../../hooks/useUserDataContext.tsx";
import {Headers} from "design-react-kit";
import {SlimHeader} from "./SlimHeader.tsx";
import {CenterHeader} from "./CenterHeader.tsx";
import {NavHeader} from "./NavHeader.tsx";

export const CompleteHeader = () => {
    const userData = useUserDataContext();

    return (
        <Headers>
            <SlimHeader />
            <div className="it-nav-wrapper">
                <CenterHeader />
                <NavHeader />
            </div>
        </Headers>

        // <Navbar collapseOnSelect expand={"sm"} className={"bg-body-tertiary nav-underline"} sticky={"top"}>
        //     <Container>
        //         <Navbar.Brand as={NavLink} to="/"><Image width={40} height={40} src={"/dlp.svg"} alt={"logo"}/> Dove la
        //             porto?</Navbar.Brand>
        //         <Navbar.Toggle aria-controls="responsive-navbar-nav"/>
        //         <Navbar.Collapse id="responsive-navbar-nav">
        //             <Nav className="me-auto">
        //                 <Nav.Link as={NavLink} to="/home">Home</Nav.Link>
        //                 <Nav.Link as={NavLink} to="/map">Mappa</Nav.Link>
        //                 {/*{userData.role >= 2 && <Nav.Link as={NavLink} to="/positions">Posizioni</Nav.Link>}*/}
        //                 {/*{userData.role >= 5 && <Nav.Link as={NavLink} to="/users">Utenti</Nav.Link>}*/}
        //             </Nav>
        //             <Nav>
        //                 <Nav.Link as={NavLink} to="/profile">{userData.userID == null ? "Accedi" : "Profilo"}</Nav.Link>
        //             </Nav>
        //         </Navbar.Collapse>
        //     </Container>
        // </Navbar>

    )
}

