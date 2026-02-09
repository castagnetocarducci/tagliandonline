import {Button, Col, Container, Form, Input, Row} from "design-react-kit";
import {Link} from "react-router";

export const Login = () => {
    return (
        <Container>
            <Row className={"mb-4"}>
            <h1>Login</h1>
            </Row>

            <Row>
                <Col md={"3"} lg={"4"}></Col>
                <Col md={"6"} lg={"4"}>
                    <Form>
                    <Row><Input id="username" type={"text"} label="Username o email"/></Row>
                    <Row><Input id="password" type={"password"} label="Password"/></Row>
                    <Row><Link to={"/password-reset"} className={"mb-4"}>Password dimenticata</Link></Row>
                    <Row className={"justify-content-end"}>
                        <Col xs={"12"} className={"text-end"}>
                            <Button color={"primary"} type={"submit"}>Login</Button>
                        </Col>
                    </Row>
                    </Form>

                </Col>
                <Col md={"3"} lg={"4"}></Col>
            </Row>

        </Container>
    );
}

