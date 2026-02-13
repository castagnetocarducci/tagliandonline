import {Button, Col, Container, Form, Row} from "design-react-kit";
import {Link, useNavigate} from "react-router";
import {type FormEvent, type FormEventHandler} from "react";
import {defaultPOSTRequestInit, fetchApiAsync} from "../../utils/fetching.ts";
import type {DataMessage, UserData} from "../../utils/Types.ts";
import {useUserDataContext} from "../../hooks/useUserDataContext.ts";
import {useValidateFormInput} from "../../hooks/useValidateFormInput.ts";
import {ValidatedInput} from "../../components/form/ValidatedInput.tsx";
import {SuccessErrorAlert} from "../../components/SuccessErrorAlert.tsx";
import {useErrSuccLoad} from "../../hooks/useErrSuccLoad.ts";

export const Login = () => {
    const userDataCtx = useUserDataContext();
    const navigate = useNavigate();
    const errSuccLoad = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(errSuccLoad.setErr);

    if (userDataCtx.userData != null) {
        navigate("/profile");
    }


    const onFormSubmit: FormEventHandler<HTMLFormElement> = async (e: FormEvent) => {
        e.preventDefault();
        if (!valid) {
            executeValidation(true);
            return;
        }

        const formValues = getValueObject();

        fetchApiAsync<DataMessage & { user: UserData }>({
            urlFromApiRoot: "/auth/login",
            errSuccLoading: errSuccLoad,
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(formValues)
            }, callback: (data,) => {
                if (data != null) {
                    userDataCtx.setUserData(data.user);
                    navigate("/profile");
                }
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

                        <Row>
                            <ValidatedInput name={"username"} validationFunc={() => true}
                                            validationText={"Campo obbligatorio"} persistingValidationText={false}
                                            validationMark={false} defaultValue={""} isMandatory={true}
                                            errorMessage={"Compilare i campi obbligatori"}
                                            setNewValidation={setValidation}
                                            inputProps={{type: "text", label: "Username o email"}}/>
                        </Row>
                        <Row>
                            <ValidatedInput name={"password"} validationFunc={() => true}
                                            validationText={"Campo obbligatorio"} persistingValidationText={false}
                                            validationMark={false} defaultValue={""} isMandatory={true}
                                            errorMessage={"Compilare i campi obbligatori"}
                                            setNewValidation={setValidation}
                                            inputProps={{type: "password"}}/>
                        </Row>
                        <Row><Link to={"/password-reset"} className={"mb-4"}>Password dimenticata</Link></Row>
                        <Row className={"justify-content-end"}>
                            <Col xs={"12"} className={"text-end"}>
                                <Button color={"primary"} type={"submit"}
                                        disabled={!valid || errSuccLoad.loading}>Login</Button>
                            </Col>
                        </Row>
                        <SuccessErrorAlert err={errSuccLoad.err} succ={errSuccLoad.succ}/>
                    </Form>

                </Col>
                <Col md={"3"} lg={"4"}></Col>
            </Row>

        </Container>
    );
}

