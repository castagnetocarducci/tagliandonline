import {useUserDataContext} from "../../hooks/useUserDataContext.ts";
import {useNavigate, useParams} from "react-router";
import {type FormEvent, type FormEventHandler, type MouseEventHandler, useEffect, useState} from "react";
import type {DataMessage, UserData, UserDetails, UserDetailsApiResponse} from "../../utils/Types.ts";
import {useErrSuccLoad} from "../../hooks/useErrSuccLoad.ts";
import {defaultGETRequestInit, defaultPOSTRequestInit, fetchApiAsync} from "../../utils/fetching.ts";
import {Button, Col, Container, Form, List, ListItem, Row} from "design-react-kit";
import {LoadingSpinner} from "../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../components/SuccessErrorAlert.tsx";
import {ValidatedInput} from "../../components/form/ValidatedInput.tsx";
import {useValidateFormInput} from "../../hooks/useValidateFormInput.ts";
import {type SelectOption, ValidatedSelect} from "../../components/form/ValidatedSelect.tsx";
import {validateEmail} from "../../utils/CommonFunctions.ts";


export const EditUser = () => {
    const userDataCtx = useUserDataContext();
    const navigate = useNavigate();
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);
    const urlParams = useParams();

    const selectableRoles: SelectOption[] = [
        {label: "seleziona", value: ""},
        {label: "admin", value: "admin"},
        {label: "operatore", value: "operatore"},
        {label: "vigile", value: "vigile"}
    ];

    useEffect(() => {
        if (userDataCtx.userData == null || userDataCtx.userData.role !== "admin") {
            navigate("/");
        }
        if (urlParams.userID == null || urlParams.userID == "") {
            navigate("/users");
        }
    }, [userDataCtx, navigate, urlParams]);

    useEffect(() => {
        const abort = fetchApiAsync<UserDetailsApiResponse>({
            urlFromApiRoot: "/users/detail/" + urlParams.userID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null) {
                    setUserDetails(data.user);
                }
            }
        });
        return abort;
    }, [setErr, setLoading, setSucc, urlParams]);

    const onRequestPasswordResetMailClick: MouseEventHandler<HTMLButtonElement> = () => {
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

    const onFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();
        if (!valid) {
            executeValidation(true);
            return;
        }
        const formValues = getValueObject();
        fetchApiAsync<DataMessage>({
            urlFromApiRoot: "/users/edit/" + urlParams.userID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(formValues)
            }
        });
    }


    return (
        <Container>
            <h1>Modifica utente</h1>
            <Form onSubmit={onFormSubmit} className={"mt-5"}>
                {userDetails != null && (
                    <>
                        <Row>
                            <Col md={2}>
                                <ValidatedInput name={"username"} validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false} defaultValue={userDetails.username}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                            <Col md={2}>
                                <ValidatedInput name={"firstName"} validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false} defaultValue={userDetails.firstName}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text", label: "Nome"}}/>
                            </Col>
                            <Col md={2}>
                                <ValidatedInput name={"lastName"} validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false} defaultValue={userDetails.lastName}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text", label: "Cognome"}}/>
                            </Col>
                            <Col md={2}>
                                <ValidatedInput name={"cf"} validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false} defaultValue={userDetails.cf} isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text", label: "Codice fiscale"}}/>
                            </Col>
                            <Col md={2}>
                                <ValidatedSelect name={"role"} validationFunc={() => true}
                                                 validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                 defaultValue={userDetails.role}
                                                 isMandatory={true}
                                                 errorMessage={"Compilare i campi obbligatori"}
                                                 setNewValidation={setValidation}
                                                 labelText={"Ruolo"}
                                                 options={selectableRoles}/>
                            </Col>
                            <Col md={2}>
                                <ValidatedInput name={"disabled"} validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false} defaultValue={userDetails.disabled}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                labelText={"Disabilitato"}
                                                inputProps={{type: "checkbox", className: "form-check-input"}}/>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={4}>
                                <ValidatedInput name={"email"} validationFunc={validateEmail}
                                                validationText={"Inserisci un indirizzo email valido"}
                                                persistingValidationText={false}
                                                validationMark={false} defaultValue={userDetails.email}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                            <Col md={4}>
                                <Button color={"primary"} type={"button"} outline disabled={!valid || loading}
                                        onClick={onRequestPasswordResetMailClick}>
                                    Invia email recupero password</Button>
                            </Col>
                            <Col md={4}>
                                <Button color={"primary"} type={"submit"} disabled={!valid || loading}> Salva </Button>
                            </Col>
                        </Row>
                    </>
                )}

                <LoadingSpinner loading={loading}/>

                <SuccessErrorAlert err={err} succ={succ}/>

                {userDetails != null && (
                    <>
                        <Row>
                            <Col md={2}>
                                <p><strong>ID: </strong>{userDetails.id}</p>
                            </Col>
                            <Col md={3}>
                                <p><strong>Data
                                    creazione: </strong><br/>{new Date(userDetails.createdAt).toLocaleString()}</p>
                            </Col>
                            <Col md={3}>
                                <p><strong>Data ultima
                                    modifica: </strong><br/>{new Date(userDetails.updatedAt).toLocaleString()}</p>
                            </Col>
                            <Col md={3}>
                                <p><strong>Ultimo aggiornamento
                                    password: </strong><br/>{new Date(userDetails.lastPasswordResetDate).toLocaleString()}
                                </p>
                            </Col>
                        </Row>
                        {userDetails.latestLoginHistory != null && userDetails.latestLoginHistory.length > 0 &&
                            <Row>
                                <Col lg={5}>
                                    <strong>Ultimi accessi:</strong>
                                    <List>
                                        {userDetails.latestLoginHistory.map((loginHistory, index) => (
                                            <ListItem key={index}>
                                                {new Date(loginHistory.createdAt).toLocaleString()}
                                                <strong>{loginHistory.clientIp}</strong>
                                            </ListItem>
                                        ))}
                                    </List>
                                </Col>
                            </Row>
                        }

                    </>
                )}
            </Form>
        </Container>
    );
}



