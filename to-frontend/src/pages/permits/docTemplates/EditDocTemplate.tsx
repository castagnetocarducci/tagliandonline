import {useNavigate, useParams} from "react-router";
import {type FormEvent, type FormEventHandler, useEffect, useState} from "react";
import type {DataMessage, DocTemplateDetailApiResponse, DocTemplateListEntry} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {useValidateFormInput} from "../../../hooks/useValidateFormInput.ts";
import {defaultGETRequestInit, fetchApiAsync, multipartPOSTRequestInit} from "../../../utils/fetching.ts";
import {Button, Col, Container, Form, GoBack, Icon, Row} from "design-react-kit";
import {ValidatedInput} from "../../../components/form/ValidatedInput.tsx";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";
import {getApiUrl} from "../../../utils/ConfigProvider.ts";
import {ValidatedUploadDragNdropSingle} from "../../../components/form/ValidatedUploadDragNdropSingle.tsx";

export function EditDocTemplate() {
    const navigate = useNavigate();
    const [docTemplateDetails, setDocTemplateDetails] = useState<DocTemplateListEntry | null>(null);
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);
    const urlParams = useParams();

    useEffect(() => {
        if (urlParams.docTemplateID == null || urlParams.docTemplateID == "") {
            navigate("/docTemplates");
        }
    }, [navigate, urlParams]);

    useEffect(() => {
        const abort = fetchApiAsync<DocTemplateDetailApiResponse>({
            urlFromApiRoot: "/templates/doc/detail/" + urlParams.docTemplateID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null) {
                    setDocTemplateDetails(data.docTemplate);
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
        //https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Sending_forms_through_JavaScript
        const formData = new FormData();
        for (const [key, value] of Object.entries(formValues)) {
            // FormData accetta solo Blob o string
            if (value instanceof Array) {
                if (value.length > 0) {
                    formData.set(key, value[0]);
                }
            } else {
                formData.set(key, "" + value);
            }
        }

        fetchApiAsync<DataMessage>({
            urlFromApiRoot: "/templates/doc/edit/" + urlParams.docTemplateID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...multipartPOSTRequestInit,
                body: formData
            }
        });
    }

    return (
        <Container>
            <GoBack link>
                Torna indietro
            </GoBack>
            <h2>Modifica modello di documento</h2>
            <Form onSubmit={onFormSubmit} className={"mt-4"}>
                {docTemplateDetails != null && (
                    <>
                        <Row>
                            <Col lg={1}>
                                <p><strong>ID</strong><br/>{docTemplateDetails.id}</p>
                            </Col>
                            <Col lg={3}>
                                <p><strong>Creato
                                    il</strong><br/>{new Date(docTemplateDetails.createdAt).toLocaleString()}</p>
                            </Col>
                            <Col lg={3}>
                                <p><strong>Ultima
                                    modifica</strong><br/>{new Date(docTemplateDetails.updatedAt).toLocaleString()}
                                </p>
                            </Col>
                            <Col lg={5}>
                                <p><strong>Percorso </strong><br/>{docTemplateDetails.path}</p>
                            </Col>
                        </Row>
                        <Row className={"mt-4"}>
                            <Col md={6}>
                                <ValidatedInput name={"description"} labelText={"Descrizione"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false} defaultValue={docTemplateDetails.description}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                            <Col md={2}>
                                <ValidatedInput name={"disabled"} validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false} defaultValue={docTemplateDetails.disabled}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                labelText={"Disabilitato"}
                                                inputProps={{type: "checkbox", className: "form-check-input"}}/>
                            </Col>
                        </Row>
                        <Row className={"align-items-center"}>
                            <Col md={2}>
                                <Button href={getApiUrl() + docTemplateDetails.path} color={"primary"} icon={true}
                                        title={"Scarica modello"}>
                                    <Icon icon={"it-download"} color={"white"}/>
                                    <span className={"ps-1"}>Scarica</span>
                                </Button>
                            </Col>
                            <Col md={8}>
                                <ValidatedUploadDragNdropSingle
                                    name={"docTemplateFile"}
                                    acceptedFileExtensions={[".docx"]}
                                    validationFunc={() => true}
                                    validationText={""}
                                    isMandatory={false}
                                    errorMessage={"File non valido"}
                                    setNewValidation={setValidation}
                                />
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
