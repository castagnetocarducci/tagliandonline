import {Col, Container, Icon, LinkList, LinkListItem, Row} from "design-react-kit";
import {RouterDesignLink} from "./links/RouterDesignLink.tsx";

export const CustomFooter = () => {
    return (
        <footer className="it-footer">
            <div className="it-footer-main">
                <Container>
                    <section>
                        <Row className="clearfix">
                            <Col sm={12}>
                                <div className="it-brand-wrapper">
                                    <RouterDesignLink to={"/"}>
                                        <Icon icon="/logo_tagliandonline_bianco.svg"/>
                                        <div className="it-brand-text">
                                            <h2>
                                                TagliandOnline
                                            </h2>
                                        </div>
                                    </RouterDesignLink>
                                </div>
                            </Col>
                        </Row>
                    </section>
                    <section className="py-4 border-white border-top">
                        <Row>
                            <Col className="pb-2" lg={4} md={4}>
                                <h4> Contatti </h4>
                                <LinkList className="footer-list clearfix">
                                    <RouterDesignLink to={"https://www.comune.castagneto-carducci.li.it/"}
                                                      className={"list-item"} target={"_blank"}
                                                      title={"Vai al sito del Comune di Castagneto Carducci"}>
                                        Comune di Castagneto Carducci
                                    </RouterDesignLink>
                                </LinkList>

                                {/*<LinkList className="footer-list clearfix">*/}
                                {/*    <LinkListItem*/}
                                {/*        href="#"*/}
                                {/*        title="Vai alla pagina: Posta Elettronica Certificata"*/}
                                {/*    >*/}
                                {/*        Posta Elettronica Certificata*/}
                                {/*    </LinkListItem>*/}
                                {/*    <LinkListItem*/}
                                {/*        href="#"*/}
                                {/*        title="Vai alla pagina: URP - Ufficio Relazioni con il Pubblico"*/}
                                {/*    >*/}
                                {/*        URP - Ufficio Relazioni con il Pubblico*/}
                                {/*    </LinkListItem>*/}
                                {/*</LinkList>*/}
                            </Col>
                            <Col className="pb-2" lg={4} md={4}>
                                <h4> Area riservata </h4>
                                <LinkList className="footer-list clearfix">
                                    <RouterDesignLink to={"/login"} className={"list-item"}
                                                      title={"Vai alla pagina: Area riservata"}>
                                        Accedi all'area riservata
                                    </RouterDesignLink>
                                </LinkList>
                            </Col>
                            <Col className="pb-2" lg={4} md={4}>
                                <h4> Seguici su </h4>
                                <ul className="list-inline text-start social">
                                    <li className="list-inline-item">
                                        <a className="p-2 text-white"
                                           href="https://github.com/castagnetocarducci/tagliandonline/"
                                           title="Codice sorgente su GitHub"
                                           target="_blank" >
                                            <Icon className="align-top" color="white"
                                                  icon="it-github" size="sm" />
                                            <span className="visually-hidden"> GitHub </span>
                                        </a>
                                    </li>

                                </ul>
                            </Col>
                        </Row>
                    </section>
                </Container>
            </div>
            <div className="it-footer-small-prints clearfix">
                <Container>
                    <h3 className="visually-hidden">
                        Sezione Link Utili
                    </h3>
                    <Row>
                        <Col xs={6}>
                            <ul className="it-footer-small-prints-list list-inline mb-0 d-flex flex-column flex-md-row">
                                <li className="list-inline-item">
                                    <a href="#" title="Note Legali">
                                        Note legali
                                    </a>
                                </li>
                                <li className="list-inline-item">
                                    <a href="#" title="Privacy-Cookies">
                                        Privacy policy
                                    </a>
                                </li>
                            </ul>
                        </Col>
                        <Col xs={6}>
                            <ul className="it-footer-small-prints-list list-inline mb-0 d-flex flex-column flex-md-row justify-content-end">
                                <li className="list-inline-item white-color">
                                    Copyright © 2026 - Comune di Castagneto Carducci - Powered by TagliandOnline
                                </li>
                            </ul>
                        </Col>
                    </Row>
                </Container>
            </div>
        </footer>
    )
}



