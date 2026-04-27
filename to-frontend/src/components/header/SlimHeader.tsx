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
import {useUserDataContext} from "../../hooks/useUserDataContext.ts";
import {RouterDesignLink} from "../links/RouterDesignLink.tsx";
import type {MouseEventHandler} from "react";
import {defaultGETRequestInit, fetchApiAsync} from "../../utils/fetching.ts";
import type {DataMessage, UserData} from "../../utils/Types.ts";
import {useNavigate} from "react-router";
import {useFrontendConfigs} from "../../hooks/useFrontendConfigs.ts";

const SlimHeader = () => {
    const userDataCtx = useUserDataContext();
    const navigate = useNavigate();
    const frontendConfig = useFrontendConfigs();

    const onLogoutClick: MouseEventHandler<HTMLAnchorElement> = (e) => {
        e.preventDefault();
        fetchApiAsync<DataMessage & { user: UserData }>({
            urlFromApiRoot: "/auth/logout",
            requestInit: {...defaultGETRequestInit},
            callback: (data, error) => {
                if (data != null) {
                    userDataCtx.setUserData(null);
                    navigate("/login");
                }
                if (error != null) {
                    console.log(error);
                }
            }
        });
    }

    return (
        <Header type="slim">
            <HeaderContent>
                <HeaderBrand href={frontendConfig.pa2Link} target={"_blank"} responsive>
                    {frontendConfig.pa2Name}
                </HeaderBrand>

                <HeaderLinkZone>
                    <Collapse>
                        <LinkList>
                            <LinkListItem href={frontendConfig.paLink} target={"_blank"}>
                                {frontendConfig.paName}
                            </LinkListItem>
                        </LinkList>
                    </Collapse>
                </HeaderLinkZone>

                <HeaderRightZone>
                    {userDataCtx.userData != null &&
                        <Dropdown>
                            <DropdownToggle caret className={"btn-icon btn-full btn btn-primary"}>
                                <AvatarIcon size={"sm"}>
                                    <p aria-hidden={true}>{
                                        (userDataCtx.userData.firstName.length > 0 ? userDataCtx.userData.firstName[0].toUpperCase() : "")
                                        + (userDataCtx.userData.lastName.length > 0 ? userDataCtx.userData.lastName[0].toUpperCase() : "")}</p>
                                </AvatarIcon>
                                <span className={"ms-2 me-1"}
                                      aria-hidden={true}>{userDataCtx.userData.firstName + " " + userDataCtx.userData.lastName}</span>
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

                    {userDataCtx.userData == null &&
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