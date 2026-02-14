import {useUserDataContext} from "../../hooks/useUserDataContext.ts";
import {Link, useNavigate, useParams} from "react-router";
import {useErrSuccLoad} from "../../hooks/useErrSuccLoad.ts";
import {useValidateFormInput} from "../../hooks/useValidateFormInput.ts";
import {type FormEvent, type FormEventHandler, useEffect, useState} from "react";
import {defaultPOSTRequestInit, fetchApiAsync} from "../../utils/fetching.ts";
import type {DataMessage, UserData} from "../../utils/Types.ts";
import {Button, Col, Container, Form, Row} from "design-react-kit";
import {ValidatedInput} from "../../components/form/ValidatedInput.tsx";
import {SuccessErrorAlert} from "../../components/SuccessErrorAlert.tsx";
import {checkPasswordStrength} from "../../utils/PasswordCheck.ts";


export const PasswordResetExecute = () => {
    const userDataCtx = useUserDataContext();
    const navigate = useNavigate();
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);

    const [password, setPassword] = useState<string>("");
    const urlParams = useParams();

    useEffect(() => {
        if (userDataCtx.userData == null && urlParams.token == null) {
            navigate("/login");
        }
    }, [userDataCtx, navigate, urlParams]);


    const onFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();
        if (!valid) {
            executeValidation(true);
            return;
        }
        const formValues = getValueObject();
        if (userDataCtx.userData == null) {
            fetchApiAsync<DataMessage & { user: UserData }>({
                urlFromApiRoot: "/auth/password-reset-execute-token",
                errSuccLoading: {setErr, setSucc, setLoading},
                requestInit: {
                    ...defaultPOSTRequestInit,
                    body: JSON.stringify({
                        ...formValues,
                        token: urlParams.token
                    })
                }
            });
        } else {
            fetchApiAsync<DataMessage & { user: UserData }>({
                urlFromApiRoot: "/auth/password-reset-execute-authenticated",
                errSuccLoading: {setErr, setSucc, setLoading},
                requestInit: {
                    ...defaultPOSTRequestInit,
                    body: JSON.stringify({
                        ...formValues
                    })
                }
            });
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
                        <Row><p>Inserisci la nuova password.</p></Row>
                        <Row>
                            <p className={"mb-0"}>La nuova password deve contenere almeno:</p>
                            <ul className={"mb-4 ms-4"}>
                                <li>12 caratteri</li>
                                <li>una lettera maiuscola</li>
                                <li>una lettera minuscola</li>
                                <li>un numero</li>
                                <li>un carattere speciale</li>
                            </ul>
                        </Row>
                        <Row>
                            <ValidatedInput name={"password"} validationFunc={(newValue) => {
                                const strValue = newValue.toString();
                                return checkPasswordStrength(strValue);
                            }}
                                            validationText={"Inserisci una password valida"}
                                            persistingValidationText={false}
                                            validationMark={false} defaultValue={""} isMandatory={true}
                                            errorMessage={"Compilare i campi obbligatori"}
                                            setNewValidation={setValidation}
                                            inputProps={{type: "password", label: "Nuova password"}}
                                            valueChangedCallback={(newValue) => {setPassword(newValue.toString());}}
                            />
                        </Row>
                        <Row>
                            <ValidatedInput name={"passwordRepeat"} validationFunc={(newValue) => {
                                const strValue = newValue.toString();
                                return strValue === password;
                            }}
                                            validationText={"Ripeti la nuova password"}
                                            persistingValidationText={false}
                                            validationMark={false} defaultValue={""} isMandatory={true}
                                            errorMessage={"Compilare i campi obbligatori"}
                                            setNewValidation={setValidation}
                                            inputProps={{type: "password", label: "Conferma password"}}/>
                        </Row>
                        <Row><Link to={"/login"} className={"mb-4"}>Effettua il login</Link></Row>
                        <Row className={"justify-content-end"}>
                            <Col xs={"12"} className={"text-end"}>
                                <Button color={"primary"} type={"submit"} disabled={!valid || loading}>Reimposta
                                    password</Button>
                            </Col>
                        </Row>
                        <SuccessErrorAlert err={err} succ={succ}/>
                    </Form>

                </Col>
                <Col md={"3"} lg={"4"}></Col>
            </Row>
        </Container>
    )
}
