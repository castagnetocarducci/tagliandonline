import {Button, Col, Container, Form, Input, Row} from "design-react-kit"
import {Link} from "react-router";
import type {FormEvent, FormEventHandler} from "react";

export const PasswordReset = () => {

    const onFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();

        const formData = new FormData(e.target as HTMLFormElement);
        const formValues = {
            email: formData.get("email"),
        }


    }

    return (
        <Container>
            <Row className={"mb-4"}>
                <h1>Reimposta password</h1>
            </Row>

            <Row>
                <Col md={"3"} lg={"4"}></Col>
                <Col md={"6"} lg={"4"}>
                    <Form onSubmit={onFormSubmit}>
                        <Row><p className={"mb-4"}>Ti verrà inviata una mail con il link per recuperare la password.</p></Row>
                        <Row><Input id="email" name={"email"} type={"email"} label="email"/></Row>
                        <Row><Link to={"/login"} className={"mb-4"}>Effettua il login</Link></Row>
                        <Row className={"justify-content-end"}>
                            <Col xs={"12"} className={"text-end"}>
                                <Button color={"primary"} type={"submit"}>Invia mail</Button>
                            </Col>
                        </Row>
                    </Form>

                </Col>
                <Col md={"3"} lg={"4"}></Col>
            </Row>


        </Container>
    )
}
