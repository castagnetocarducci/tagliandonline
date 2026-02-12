import {
    AvatarIcon,
    Collapse,
    Dropdown,
    DropdownMenu,
    DropdownToggle,
    Header,
    HeaderBrand,
    HeaderContent,
    HeaderLinkZone,
    HeaderRightZone, Icon,
    LinkList,
    LinkListItem,
    ListItem
} from "design-react-kit";
import {useUserDataContext} from "../../hooks/useUserDataContext.tsx";
import {RouterDesignLink} from "../links/RouterDesignLink.tsx";
import type {MouseEventHandler} from "react";
import {fetchApiAsync} from "../../utils/fetching.ts";
import type {DataMessage, UserData} from "../../utils/Types.ts";
import {useNavigate} from "react-router";

const SlimHeader = () => {
    const userData = useUserDataContext();
    const navigate = useNavigate();

    const onLogoutClick: MouseEventHandler<HTMLAnchorElement> = (e) => {
        e.preventDefault();
        fetchApiAsync<DataMessage & {user: UserData}>("/auth/logout", {
            method: "GET",
            credentials: "include"
        }, (data, error) => {
            if (data != null) {
                userData.setUserData(null);
                navigate("/login");
            }
            if (error != null) {
                console.log(error);
            }
        });
    }

    return (
        <Header type="slim">
            <HeaderContent>
                <HeaderBrand href={"https://www.regione.toscana.it/"} target={"_blank"} responsive>
                    Regione Toscana
                </HeaderBrand>

                <HeaderLinkZone>
                    <Collapse>
                        <LinkList>
                            <LinkListItem href={"https://www.comune.castagneto-carducci.li.it/"} target={"_blank"}>
                                Comune di Castagneto Carducci
                            </LinkListItem>
                        </LinkList>
                    </Collapse>
                </HeaderLinkZone>

                <HeaderRightZone>
                    {userData.userData != null &&
                        <Dropdown>
                            <DropdownToggle caret className={"btn-icon btn-full btn btn-primary"}>
                                <AvatarIcon size={"sm"}>
                                    <p aria-hidden={true}>{
                                        (userData.userData.firstName.length > 0 ? userData.userData.firstName[0].toUpperCase() : "")
                                        + (userData.userData.lastName.length > 0 ? userData.userData.lastName[0].toUpperCase() : "")}</p>
                                </AvatarIcon>
                                <span className={"ms-2 me-1"}
                                      aria-hidden={true}>{userData.userData.firstName + " " + userData.userData.lastName}</span>
                            </DropdownToggle>
                            <DropdownMenu>
                                <LinkList>
                                    <ListItem>
                                        <RouterDesignLink to="/profile" className={"dropdown-item list-item"}>
                                            <span>Profilo</span>
                                        </RouterDesignLink>
                                    </ListItem>
                                    <LinkListItem href="/logout" inDropdown onClick={onLogoutClick}>
                                        <span>Logout</span>
                                    </LinkListItem>
                                </LinkList>
                            </DropdownMenu>
                        </Dropdown>

                    }

                    {userData.userData == null &&
                        <RouterDesignLink to={"/login"} className={"btn-icon btn-full btn btn-primary"}>
                            <span className="rounded-icon"><Icon color="primary" icon="it-user"/></span>
                            <span className="d-none d-lg-block">Accedi all'area personale</span>
                        </RouterDesignLink>
                    }

                </HeaderRightZone>
            </HeaderContent>
        </Header>
    )
}
export default SlimHeader