import {Header, HeaderBrand, HeaderContent, HeaderRightZone, HeaderSocialsZone, Icon} from "design-react-kit";
import {useUserDataContext} from "../../hooks/useUserDataContext.tsx";

export const CenterHeader = () => {
    const userData = useUserDataContext();
    return (
        <Header theme="dark" type="center">
            <HeaderContent>
                <HeaderBrand
                    iconAlt="icona logo"
                    iconName="/logo_tagliandonline_bianco.svg"
                    href={"/"}
                >
                    <h2>
                        TagliandOnline
                    </h2>
                    {/*<h3>*/}
                    {/*    Gestione tagliandi parcheggi e traffico limitatoooo*/}
                    {/*</h3>*/}
                </HeaderBrand>
                <HeaderRightZone>
                    <HeaderSocialsZone label="Codice sorgente">
                        <ul>
                            {/*<li>*/}
                            {/*    <a*/}
                            {/*        aria-label="Facebook"*/}
                            {/*        href="#"*/}
                            {/*        target="_blank"*/}
                            {/*    >*/}
                            {/*        <Icon icon="it-facebook"/>*/}
                            {/*    </a>*/}
                            {/*</li>*/}
                            <li>
                                <a
                                    aria-label="Github"
                                    href="https://github.com/castagnetocarducci/tagliandonline/"
                                    target="_blank"
                                >
                                    <Icon icon="it-github"/>
                                </a>
                            </li>
                            {/*<li>*/}
                            {/*    <a*/}
                            {/*        aria-label="Twitter"*/}
                            {/*        href="#"*/}
                            {/*        target="_blank"*/}
                            {/*    >*/}
                            {/*        <Icon icon="it-twitter"/>*/}
                            {/*    </a>*/}
                            {/*</li>*/}
                        </ul>
                    </HeaderSocialsZone>
                    {/*<HeaderSocialsZone label="Seguici su">*/}
                    {/*    <ul>*/}
                    {/*        <li>*/}
                    {/*            <a*/}
                    {/*                aria-label="Facebook"*/}
                    {/*                href="#"*/}
                    {/*                target="_blank"*/}
                    {/*            >*/}
                    {/*                <Icon icon="it-facebook"/>*/}
                    {/*            </a>*/}
                    {/*        </li>*/}
                    {/*        <li>*/}
                    {/*            <a*/}
                    {/*                aria-label="Github"*/}
                    {/*                href="#"*/}
                    {/*                target="_blank"*/}
                    {/*            >*/}
                    {/*                <Icon icon="it-github"/>*/}
                    {/*            </a>*/}
                    {/*        </li>*/}
                    {/*        <li>*/}
                    {/*            <a*/}
                    {/*                aria-label="Twitter"*/}
                    {/*                href="#"*/}
                    {/*                target="_blank"*/}
                    {/*            >*/}
                    {/*                <Icon icon="it-twitter"/>*/}
                    {/*            </a>*/}
                    {/*        </li>*/}
                    {/*    </ul>*/}
                    {/*</HeaderSocialsZone>*/}
                    {/*<HeaderSearch*/}
                    {/*    iconName="it-search"*/}
                    {/*    label="Cerca"*/}
                    {/*/>*/}
                </HeaderRightZone>
            </HeaderContent>
        </Header>
    )
}