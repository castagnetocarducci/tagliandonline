import {Button, Col, Container, Form, Row} from "design-react-kit";
import {ValidatedInput} from "../../components/form/ValidatedInput.tsx";
import {type SelectOption, ValidatedSelect} from "../../components/form/ValidatedSelect.tsx";
import {LoadingSpinner} from "../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../components/SuccessErrorAlert.tsx";
import {useUserDataContext} from "../../hooks/useUserDataContext.ts";
import {useNavigate} from "react-router";
import {useErrSuccLoad} from "../../hooks/useErrSuccLoad.ts";
import {useValidateFormInput} from "../../hooks/useValidateFormInput.ts";
import {defaultPOSTRequestInit, fetchApiAsync} from "../../utils/fetching.ts";
import type {AddedElementMessage} from "../../utils/Types.ts";
import {type FormEvent, type FormEventHandler, useEffect} from "react";

export function NewUser() {
    const userDataCtx = useUserDataContext();
    const navigate = useNavigate();
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);

    useEffect(() => {
        if (userDataCtx.userData == null || userDataCtx.userData.role !== "admin") {
            navigate("/");
        }
    }, [userDataCtx, navigate]);

    const selectableRoles: SelectOption[] = [
        {label: "seleziona", value: ""},
        {label: "admin", value: "admin"},
        {label: "operatore", value: "operatore"},
        {label: "vigile", value: "vigile"}
    ];

    const onFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();
        if (!valid) {
            executeValidation(true);
            return;
        }
        const formValues = getValueObject();
        fetchApiAsync<AddedElementMessage>({
            urlFromApiRoot: "/users/new",
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(formValues)
            },
            callback: (data) => {
                if (data != null && data.id != null) {
                    navigate("/users/" + data.id);
                }
            }
        });
    }

    return (
        <Container>
            <h1>Nuovo utente</h1>
            <Form onSubmit={onFormSubmit} className={"mt-5"}>

                <Row>
                    <Col md={2}>
                        <ValidatedInput name={"username"} validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false} defaultValue={""}
                                        isMandatory={true}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "text"}}/>
                    </Col>
                    <Col md={2}>
                        <ValidatedInput name={"firstName"} validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false} defaultValue={""}
                                        isMandatory={true}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "text", label: "Nome"}}/>
                    </Col>
                    <Col md={2}>
                        <ValidatedInput name={"lastName"} validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false} defaultValue={""}
                                        isMandatory={true}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "text", label: "Cognome"}}/>
                    </Col>
                    <Col md={2}>
                        <ValidatedInput name={"cf"} validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false} defaultValue={""} isMandatory={true}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "text", label: "Codice fiscale"}}/>
                    </Col>
                    <Col md={2}>
                        <ValidatedSelect name={"role"} validationFunc={() => true}
                                         validationText={"Campo obbligatorio"} persistingValidationText={false}
                                         defaultValue={""}
                                         isMandatory={true}
                                         errorMessage={"Compilare i campi obbligatori"}
                                         setNewValidation={setValidation}
                                         labelText={"Ruolo"}
                                         options={selectableRoles}/>
                    </Col>
                    <Col md={2}>
                        <ValidatedInput name={"disabled"} validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false} defaultValue={false}
                                        isMandatory={true}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        labelText={"Disabilitato"}
                                        inputProps={{type: "checkbox", className: "form-check-input"}}/>
                    </Col>
                </Row>
                <Row>
                    <Col md={4}>
                        <ValidatedInput name={"email"} validationFunc={(newValue) => {
                            const strValue = newValue.toString();
                            const regex = /^.+@.+$/;
                            return regex.test(strValue);
                        }}
                                        validationText={"Inserisci un indirizzo email valido"}
                                        persistingValidationText={false}
                                        validationMark={false} defaultValue={""}
                                        isMandatory={true}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "text"}}/>
                    </Col>

                    <Col md={4}>
                        <Button color={"primary"} type={"submit"} disabled={!valid || loading}> Inserisci </Button>
                    </Col>
                    <Col md={4}>

                    </Col>
                </Row>

                <LoadingSpinner loading={loading}/>

                <SuccessErrorAlert err={err} succ={succ}/>
            </Form>
        </Container>
    )
}
