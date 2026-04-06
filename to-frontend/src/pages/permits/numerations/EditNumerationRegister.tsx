import {useNavigate, useParams} from "react-router";
import {type FormEvent, type FormEventHandler, useEffect, useState} from "react";
import type {DataMessage, NumerationRegisterApiResponse, NumerationRegisterListEntry} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {useValidateFormInput} from "../../../hooks/useValidateFormInput.ts";
import {defaultGETRequestInit, defaultPOSTRequestInit, fetchApiAsync} from "../../../utils/fetching.ts";
import {Button, Col, Container, Form, GoBack, Row} from "design-react-kit";
import {ValidatedInput} from "../../../components/form/ValidatedInput.tsx";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";

export function EditNumerationRegister() {
    const navigate = useNavigate();
    const [numerationRegisterDetails, setNumerationRegisterDetails] = useState<NumerationRegisterListEntry | null>(null);
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);
    const urlParams = useParams();

    useEffect(() => {
        if (urlParams.numerationRegisterID == null || urlParams.numerationRegisterID == "") {
            navigate("/numerations");
        }
    }, [navigate, urlParams]);

    useEffect(() => {
        const abort = fetchApiAsync<NumerationRegisterApiResponse>({
            urlFromApiRoot: "/numerations/detail/" + urlParams.numerationRegisterID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null) {
                    setNumerationRegisterDetails(data.numerationRegister);
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
            urlFromApiRoot: "/numerations/edit/" + urlParams.numerationRegisterID,
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
            <h2>Modifica registro numerazione</h2>
            <Form onSubmit={onFormSubmit} className={"mt-4"}>
                {numerationRegisterDetails != null && (
                    <>
                        <Row>
                            <Col lg={1}>
                                <p><strong>ID</strong><br/>{numerationRegisterDetails.id}</p>
                            </Col>
                            <Col lg={3}>
                                <p><strong>Creato
                                    il</strong><br/>{new Date(numerationRegisterDetails.createdAt).toLocaleString()}</p>
                            </Col>
                            <Col lg={3}>
                                <p><strong>Ultima
                                    modifica</strong><br/>{new Date(numerationRegisterDetails.updatedAt).toLocaleString()}
                                </p>
                            </Col>
                        </Row>
                        <Row className={"mt-4"}>
                            <Col md={5}>
                                <ValidatedInput name={"description"} labelText={"Descrizione"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={numerationRegisterDetails.description}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                            <Col md={3}>
                                <ValidatedInput name={"nextNumber"} labelText={"Prossimo numero"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={numerationRegisterDetails.nextNumber}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "number"}}/>
                            </Col>
                            <Col md={2}>
                                <ValidatedInput name={"disabled"} validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false} defaultValue={numerationRegisterDetails.disabled}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                labelText={"Disabilitato"}
                                                inputProps={{type: "checkbox", className: "form-check-input"}}/>
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
