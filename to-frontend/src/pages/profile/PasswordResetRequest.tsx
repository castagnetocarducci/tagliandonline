import {Button, Col, Container, Form, Row} from "design-react-kit"
import {Link, useNavigate} from "react-router";
import {type FormEvent, type FormEventHandler, useEffect} from "react";
import {SuccessErrorAlert} from "../../components/SuccessErrorAlert.tsx";
import {useUserDataContext} from "../../hooks/useUserDataContext.ts";
import {useValidateFormInput} from "../../hooks/useValidateFormInput.ts";
import {defaultPOSTRequestInit, fetchApiAsync} from "../../utils/fetching.ts";
import type {DataMessage, UserData} from "../../utils/Types.ts";
import {useErrSuccLoad} from "../../hooks/useErrSuccLoad.ts";
import {ValidatedInput} from "../../components/form/ValidatedInput.tsx";
import {validateEmail} from "../../utils/CommonFunctions.ts";

export const PasswordResetRequest = () => {
    const userDataCtx = useUserDataContext();
    const navigate = useNavigate();
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);

    useEffect(() => {
        if (userDataCtx.userData != null) {
            navigate("/profile");
        }
    }, [userDataCtx, navigate]);

    const onFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();
        if (!valid) {
            executeValidation(true);
            return;
        }
        const formValues = getValueObject();
        fetchApiAsync<DataMessage & { user: UserData }>({
            urlFromApiRoot: "/auth/password-reset-request",
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(formValues)
            }
        });
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
                        <Row><p className={"mb-4"}>Ti verrà inviata una mail con il link per recuperare la
                            password.</p></Row>
                        <Row>
                            <ValidatedInput name={"email"} validationFunc={validateEmail}
                                            validationText={"Inserisci un indirizzo email valido"}
                                            persistingValidationText={false}
                                            validationMark={false} defaultValue={""} isMandatory={true}
                                            errorMessage={"Compilare i campi obbligatori"}
                                            setNewValidation={setValidation}
                                            inputProps={{type: "text"}}/>
                        </Row>
                        <Row><Link to={"/login"} className={"mb-4"}>Effettua il login</Link></Row>
                        <Row className={"justify-content-end"}>
                            <Col xs={"12"} className={"text-end"}>
                                <Button color={"primary"} type={"submit"} disabled={!valid || loading}>Invia
                                    email</Button>
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
