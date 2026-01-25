import {
    Button, Collapse,
    Header,
    HeaderBrand,
    HeaderContent,
    HeaderLinkZone,
    HeaderRightZone,
    Icon,
    LinkList, LinkListItem
} from "design-react-kit";
import {useUserDataContext} from "../../hooks/useUserDataContext.tsx";
import {RouterDesignLink} from "../links/RouterDesignLink.tsx";

export const SlimHeader = () => {
    const userData = useUserDataContext();
    return (
        <Header type="slim">
            <HeaderContent>
                <HeaderBrand href={"https://www.regione.toscana.it/"} responsive>
                    Regione Toscana
                </HeaderBrand>

                <HeaderLinkZone>
                    <Collapse>
                        <LinkList>
                            <LinkListItem href={"https://www.comune.castagneto-carducci.li.it/"}>
                                Comune di Castagneto Carducci
                            </LinkListItem>
                        </LinkList>
                    </Collapse>
                </HeaderLinkZone>

                <HeaderRightZone>
                    {/*<Button className="btn-icon btn-full" color="primary" >*/}
                    {/* ripreso dall'html del pulsante */}
                    <RouterDesignLink to={"/login"} className={"btn-icon btn-full btn btn-primary"}>
                        <span className="rounded-icon"><Icon color="primary" icon="it-user"/></span>
                        <span className="d-none d-lg-block">Accedi all'area personale</span>
                    </RouterDesignLink>
                    {/*</Button>*/}
                </HeaderRightZone>
            </HeaderContent>
        </Header>
    )
}