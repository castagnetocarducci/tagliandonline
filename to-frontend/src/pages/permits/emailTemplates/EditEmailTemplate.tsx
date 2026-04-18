import {useNavigate, useParams} from "react-router";
import {type FormEvent, type FormEventHandler, useEffect, useState} from "react";
import type {DataMessage, EmailTemplateDetail, EmailTemplateDetailApiResponse} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {useValidateFormInput} from "../../../hooks/useValidateFormInput.ts";
import {defaultGETRequestInit, defaultPOSTRequestInit, fetchApiAsync} from "../../../utils/fetching.ts";
import {Button, Col, Container, Form, GoBack, Row} from "design-react-kit";
import {ValidatedInput} from "../../../components/form/ValidatedInput.tsx";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";
import {ValidatedTextArea} from "../../../components/form/ValidatedTextArea.tsx";

export function EditEmailTemplate() {
    const navigate = useNavigate();
    const [emailTemplateDetails, setEmailTemplateDetails] = useState<EmailTemplateDetail | null>(null);
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);
    const urlParams = useParams();

    useEffect(() => {
        if (urlParams.emailTemplateID == null || urlParams.emailTemplateID == "") {
            navigate("/emailTemplates", {replace: true});
        }
    }, [navigate, urlParams]);

    useEffect(() => {
        const abort = fetchApiAsync<EmailTemplateDetailApiResponse>({
            urlFromApiRoot: "/templates/email/detail/" + urlParams.emailTemplateID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null) {
                    setEmailTemplateDetails(data.emailTemplate);
                }
            }
        });
        return abort;
    }, [setErr, setLoading, setSucc, urlParams]);


    const onFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();
        if (!valid) {
            executeValidation(true);
            return;
        }
        const formValues = getValueObject();
        fetchApiAsync<DataMessage>({
            urlFromApiRoot: "/templates/email/edit/" + urlParams.emailTemplateID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(formValues)
            }
        });
    }

    return (
        <Container>
            <GoBack link>
                Torna indietro
            </GoBack>
            <h2>Modifica modello di email</h2>
            <Form onSubmit={onFormSubmit} className={"mt-4"}>
                {emailTemplateDetails != null && (
                    <>
                        <Row>
                            <Col lg={1}>
                                <p><strong>ID</strong><br/>{emailTemplateDetails.id}</p>
                            </Col>
                            <Col lg={3}>
                                <p><strong>Creato
                                    il</strong><br/>{new Date(emailTemplateDetails.createdAt).toLocaleString()}</p>
                            </Col>
                            <Col lg={3}>
                                <p><strong>Ultima
                                    modifica</strong><br/>{new Date(emailTemplateDetails.updatedAt).toLocaleString()}
                                </p>
                            </Col>
                        </Row>
                        <Row className={"mt-4"}>
                            <Col md={6}>
                                <ValidatedInput name={"description"} labelText={"Descrizione"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false} defaultValue={emailTemplateDetails.description}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                            <Col md={2}>
                                <ValidatedInput name={"disabled"} validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false} defaultValue={emailTemplateDetails.disabled}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                labelText={"Disabilitato"}
                                                inputProps={{type: "checkbox", className: "form-check-input"}}/>
                            </Col>
                        </Row>
                        <Row className={"mt-4"}>
                            <Col md={12}>
                                <ValidatedInput name={"subject"} labelText={"Oggetto"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false} defaultValue={emailTemplateDetails.subject}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={12}>
                                <ValidatedTextArea name={"body"} labelText={"Corpo"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false} defaultValue={emailTemplateDetails.body}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                textAreaProps={{rows: 5}}/>
                            </Col>
                        </Row>
                        <Row className={"mt-4"}>
                            <Col md={4}>
                                <Button color={"primary"} type={"submit"} disabled={!valid || loading}> Salva </Button>
                            </Col>
                        </Row>
                    </>
                )}

                <LoadingSpinner loading={loading}/>

                <SuccessErrorAlert err={err} succ={succ}/>

            </Form>
        </Container>
    );
}
