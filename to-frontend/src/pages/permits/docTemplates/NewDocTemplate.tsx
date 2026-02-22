import {type FormEvent, type FormEventHandler} from "react";
import type {DataMessage} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {useValidateFormInput} from "../../../hooks/useValidateFormInput.ts";
import {fetchApiAsync, multipartPOSTRequestInit} from "../../../utils/fetching.ts";
import {Button, Col, Container, Form, GoBack, Row} from "design-react-kit";
import {ValidatedInput} from "../../../components/form/ValidatedInput.tsx";
import {ValidatedUploadDragNdropSingle} from "../../../components/form/ValidatedUploadDragNdropSingle.tsx";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";

export function NewDocTemplate() {
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);

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
            urlFromApiRoot: "/templates/doc/new",
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

                <Row className={"mt-4"}>
                    <Col md={6}>
                        <ValidatedInput name={"description"} labelText={"Descrizione"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false} defaultValue={""}
                                        isMandatory={true}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "text"}}/>
                    </Col>
                </Row>
                <Row className={"align-items-center"}>
                    <Col md={8}>
                        <ValidatedUploadDragNdropSingle
                            name={"docTemplateFile"}
                            acceptedFileExtensions={[".docx"]}
                            validationFunc={() => true}
                            validationText={"Campo obbligatorio"}
                            isMandatory={true}
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

                <LoadingSpinner loading={loading}/>

                <SuccessErrorAlert err={err} succ={succ}/>

            </Form>
        </Container>
    );
}
