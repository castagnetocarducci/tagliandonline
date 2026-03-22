import {useNavigate, useParams} from "react-router";
import {type FormEvent, type FormEventHandler, useEffect, useState} from "react";
import type {DataMessage, VehicleDetails, VehicleDetailsApiResponse} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {useValidateFormInput} from "../../../hooks/useValidateFormInput.ts";
import {defaultGETRequestInit, defaultPOSTRequestInit, fetchApiAsync} from "../../../utils/fetching.ts";
import {Button, Col, Container, Form, GoBack, Icon, List, Row} from "design-react-kit";
import {ValidatedInput} from "../../../components/form/ValidatedInput.tsx";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";
import {RouterDesignLink} from "../../../components/links/RouterDesignLink.tsx";

export function EditApplication() {
    const navigate = useNavigate();
    const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails | null>(null);
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);
    const urlParams = useParams();

    useEffect(() => {
        if (urlParams.vehicleID == null || urlParams.vehicleID == "") {
            navigate("/vehicles/list");
        }
    }, [navigate, urlParams]);

    useEffect(() => {
        const abort = fetchApiAsync<VehicleDetailsApiResponse>({
            urlFromApiRoot: "/applications/detail/" + urlParams.vehicleID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null) {
                    setVehicleDetails(data.vehicle);
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
            urlFromApiRoot: "/applications/edit/" + urlParams.vehicleID,
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
            <h2>Modifica veicolo</h2>
            <Form onSubmit={onFormSubmit} className={"mt-4"}>
                {vehicleDetails != null && (
                    <>
                        <Row>
                            <Col lg={1}>
                                <p><strong>ID</strong><br/>{vehicleDetails.id}</p>
                            </Col>
                            <Col lg={3}>
                                <p><strong>Creato
                                    il</strong><br/>{new Date(vehicleDetails.createdAt).toLocaleString()}</p>
                            </Col>
                            <Col lg={3}>
                                <p><strong>Ultima
                                    modifica</strong><br/>{new Date(vehicleDetails.updatedAt).toLocaleString()}
                                </p>
                            </Col>
                            <Col lg={2}>
                                <Button className={"mb-4"}
                                        onClick={() => navigate(`/vehicles/list/${vehicleDetails.id}/history`)}
                                        color={"primary"} icon={true} outline title={"Visualizza storico veicolo"}>
                                        <span className={"rounded-icon me-2"}>
                                            <Icon icon={"it-calendar"}/>
                                        </span>
                                    Storico
                                </Button>
                            </Col>
                        </Row>
                        <Row className={"mt-4"}>
                            <Col md={3}>
                                <ValidatedInput name={"plate"} labelText={"Targa"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={vehicleDetails.plate}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                            <Col md={3}>
                                <ValidatedInput name={"brand"} labelText={"Marca"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={vehicleDetails.brand}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                            <Col md={4}>
                                <ValidatedInput name={"model"} labelText={"Modello"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={vehicleDetails.model}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                        </Row>

                        <Row className={"mb-2"}>
                            <Col lg={3}>
                                {(vehicleDetails.applications.length > 0) && (
                                    <p><strong>Domande collegate</strong>
                                        <List>
                                            {vehicleDetails.applications.map((applicationID) => (
                                                <RouterDesignLink key={applicationID}
                                                                  to={`/applications/list/${applicationID}`}
                                                                  className={"list-item"} title={"Vai alla domanda"}>
                                                    <div className={"it-right-zone"}>
                                                        <span className={"text"}>Domanda {applicationID}</span>
                                                        <Icon icon="it-chevron-right"/>
                                                    </div>
                                                </RouterDesignLink>
                                            ))}
                                        </List>
                                    </p>
                                )}
                                {(vehicleDetails.applications.length === 0) && (
                                    <p><strong>Nessuna domanda collegata</strong></p>
                                )}
                            </Col>
                            <Col lg={1}></Col>
                            <Col lg={3}>
                                {(vehicleDetails.vouchers.length > 0) && (
                                    <p><strong>Tagliandi collegati</strong>
                                        <List>
                                            {vehicleDetails.vouchers.map((voucherID) => (
                                                <RouterDesignLink key={voucherID}
                                                                  to={`/vouchers/list/${voucherID}`}
                                                                  className={"list-item"} title={"Vai al tagliando"}>
                                                    <div className={"it-right-zone"}>
                                                        <span className={"text"}>Tagliando {voucherID}</span>
                                                        <Icon icon="it-chevron-right"/>
                                                    </div>
                                                </RouterDesignLink>
                                            ))}
                                        </List>
                                    </p>
                                )}
                                {(vehicleDetails.vouchers.length === 0) && (
                                    <p><strong>Nessun tagliando collegato</strong></p>
                                )}
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
