import {Button, Col, Container, Form, Input, Row} from "design-react-kit"

export const PasswordReset = () => {
    return (
        <Container>
            <Row className={"mb-4"}>
                <h1>Reimposta password</h1>
            </Row>

            <Row>
                <Col md={"3"} lg={"4"}></Col>
                <Col md={"6"} lg={"4"}>
                    <Form>
                        <Row><Input id="email" type={"email"} label="email"/></Row>
                        <Row><p>Ti verrà inviata una mail con il link per recuperare la password.</p></Row>
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
