import {Alert, Button, Col, Container, Form, Input, Row} from "design-react-kit";
import {Link, useNavigate} from "react-router";
import {type FormEvent, type FormEventHandler, useState} from "react";
import {fetchApiAsync} from "../../utils/fetching.ts";
import type {DataMessage, UserData} from "../../utils/Types.ts";
import {useUserDataContext} from "../../hooks/useUserDataContext.tsx";

export const Login = () => {
    const userDataCtx = useUserDataContext();
    const navigate = useNavigate();

    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [err, setErr] = useState<string | null>(null);
    const [succ, setSucc] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const checkParameters = (setError: boolean = false): boolean => {
        if (username == "" || password == "") {
            if (setError) setErr("Compilare correttamente i campi richiesti");
            return false;
        }
        if (setError) setErr(null);
        return true;
    }
    const parametersFilled = checkParameters();


    const onParameterChange = (setParameter: () => void) => {
        setParameter();
        setErr(null);
        checkParameters()
    }

    const onFormSubmit: FormEventHandler<HTMLFormElement> = async (e: FormEvent) => {
        e.preventDefault();
        if (!checkParameters(true)) {
            return;
        }

        const formValues = {
            username: username,
            password: password
        }

        setIsLoading(true);
        fetchApiAsync<DataMessage & {user: UserData}>("/auth/login", {
            headers: {
                'Content-Type': 'application/json'
            },
            method: "POST",
            credentials: "include",
            body: JSON.stringify(formValues)
        }, (data, error) => {
            setIsLoading(false);
            if (data != null) {
                setSucc(data.message);
                userDataCtx.setUserData(data.user);
                navigate("/profile");
            }
            if (error != null) {
                setErr(error.toString());
            }
        })
    }


    return (
        <Container>
            <Row className={"mb-4"}>
                <h1>Login</h1>
            </Row>

            <Row>
                <Col md={"3"} lg={"4"}></Col>
                <Col md={"6"} lg={"4"}>
                    <Form onSubmit={onFormSubmit}>
                        {err &&
                            <Row className='mt-2 mb-4'>
                                <Col>
                                    <Alert color='danger'>
                                        <strong>Attenzione</strong> {err}
                                    </Alert>
                                </Col>
                            </Row>
                        }
                        {succ &&
                            <Row className='mt-2 mb-4'>
                                <Col>
                                    <Alert color='success'>
                                        {succ}
                                    </Alert>
                                </Col>
                            </Row>
                        }
                        <Row>
                            <Input id="username" name={"username"} type={"text"} label="Username o email"
                                   validationText={username != "" ? "" : "Campo obbligatorio"} valid={username != "" ? undefined : false} value={username}
                                   onChange={(e) => onParameterChange(() => setUsername(e.target.value))}/>
                        </Row>
                        <Row>
                            <Input id="password" name={"password"} type={"password"} label="Password"
                                   validationText={password != "" ? "" : "Campo obbligatorio"} valid={password != "" ? undefined : false} value={password}
                                   onChange={(e) => onParameterChange(() => setPassword(e.target.value))}
                                   //rimuove il punto esclamativo alla fine per estetica
                                   style={{backgroundImage: "none"}}/>
                        </Row>
                        <Row><Link to={"/password-reset"} className={"mb-4"}>Password dimenticata</Link></Row>
                        <Row className={"justify-content-end"}>
                            <Col xs={"12"} className={"text-end"}>
                                <Button color={"primary"} type={"submit"} disabled={!parametersFilled || isLoading}>Login</Button>
                            </Col>
                        </Row>
                    </Form>

                </Col>
                <Col md={"3"} lg={"4"}></Col>
            </Row>

        </Container>
    );
}

