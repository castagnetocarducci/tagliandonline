import {useNavigate, useParams} from "react-router";
import {type FormEvent, type FormEventHandler, useEffect, useState} from "react";
import type {
    ApplicationAvailableOptionsApiResponse,
    ApplicationDetails,
    ApplicationDetailsApiResponse,
    ApplicationOutcomeListEntry,
    ApplicationTypeListEntry,
    DataMessage,
    PermitListEntry, VoucherAvailableOptionsApiResponse, VoucherDetails, VoucherDetailsApiResponse
} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {useValidateFormInput, type ValidationSupportedTypes} from "../../../hooks/useValidateFormInput.ts";
import {defaultGETRequestInit, defaultPOSTRequestInit, fetchApiAsync} from "../../../utils/fetching.ts";
import {Button, Col, Container, Form, GoBack, Icon, Row} from "design-react-kit";
import {ValidatedInput} from "../../../components/form/ValidatedInput.tsx";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";
import {type SelectOption, ValidatedSelect} from "../../../components/form/ValidatedSelect.tsx";
import {dateStrToISOString, validateEmail} from "../../../utils/CommonFunctions.ts";
import {ValidatedVehiclesList} from "../../../components/form/ValidatedVehiclesList.tsx";

export function EditVoucher() {
    const navigate = useNavigate();
    const [voucherDetails, setVoucherDetails] = useState<VoucherDetails | null>(null);
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);
    const [permitsList, setPermitsList] = useState<PermitListEntry[]>([]);
    const [vehiclesAmount, setVehiclesAmount] = useState<number>(2);
    const urlParams = useParams();

    useEffect(() => {
        const abort = fetchApiAsync<VoucherAvailableOptionsApiResponse>({
            urlFromApiRoot: "/vouchers/availableOptions",
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null) {
                    setPermitsList(data.permits);
                }
            }
        });
        return abort;
    }, [setErr, setLoading, setSucc, setPermitsList]);

    useEffect(() => {
        if (urlParams.voucherID == null || urlParams.voucherID == "") {
            navigate("/vouchers/list");
        }
    }, [navigate, urlParams]);

    useEffect(() => {
        const abort = fetchApiAsync<VoucherDetailsApiResponse>({
            urlFromApiRoot: "/vouchers/detail/" + urlParams.voucherID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null) {
                    setVoucherDetails(data.voucher);
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
            urlFromApiRoot: "/vouchers/edit/" + urlParams.applicationID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(formValues)
            },
            callback: (data) => {
                if (data != null) {
                    setVoucherDetails(data.voucher);
                }
            }
        });
    }

    const selectableApplicationTypes: SelectOption[] = [{label: "seleziona", value: ""}];
    if (applicationTypeList.length > 0) {
        for (const applicationTypeListEntry of applicationTypeList) {
            if (applicationTypeListEntry.disabled) {
                continue;
            }
            selectableApplicationTypes.push({
                label: applicationTypeListEntry.description,
                value: "" + applicationTypeListEntry.id
            })
        }
    }

    const selectableApplicationOutcomes: SelectOption[] = [{label: "seleziona", value: ""}];
    if (applicationOutcomeList.length > 0) {
        for (const applicationOutcomeListEntry of applicationOutcomeList) {
            if (applicationOutcomeListEntry.disabled) {
                continue;
            }
            selectableApplicationOutcomes.push({
                label: applicationOutcomeListEntry.description,
                value: "" + applicationOutcomeListEntry.id
            })
        }
    }

    const selectablePermits: SelectOption[] = [{label: "seleziona", value: ""}];
    if (permitsList.length > 0) {
        for (const permitsListEntry of permitsList) {
            if (permitsListEntry.disabled) {
                continue;
            }
            selectablePermits.push({
                label: permitsListEntry.description,
                value: "" + permitsListEntry.id
            })
        }
    }

    const selectedPermitChanged = (newValue: ValidationSupportedTypes) => {
        for (const permit of permitsList) {
            if ("" + permit.id === newValue) {
                setVehiclesAmount(permit.applicationPlatesAmount);
            }
        }
    }

    return (
        <Container>
            <GoBack link>
                Torna indietro
            </GoBack>
            <h2>Modifica domanda</h2>
            <Form onSubmit={onFormSubmit} className={"mt-4"}>
                {voucherDetails != null && (
                    <>
                        <Row>
                            <Col lg={1}>
                                <p><strong>ID</strong><br/>{voucherDetails.id}</p>
                            </Col>
                            <Col lg={3}>
                                <p><strong>Creata
                                    il</strong><br/>{new Date(voucherDetails.createdAt).toLocaleString()}</p>
                            </Col>
                            <Col lg={3}>
                                <p><strong>Ultima
                                    modifica</strong><br/>{new Date(voucherDetails.updatedAt).toLocaleString()}
                                </p>
                            </Col>
                            {voucherDetails.outcomeAuthUser != null && (
                                <Col lg={2}>
                                    <p><strong>Utente esito</strong><br/>{voucherDetails.outcomeAuthUser.username}
                                    </p>
                                </Col>
                            )}

                            <Col lg={2}>
                                <Button className={"mb-4"}
                                        onClick={() => navigate(`/applications/list/${voucherDetails.id}/history`)}
                                        color={"primary"} icon={true} outline title={"Visualizza storico domanda"}>
                                        <span className={"rounded-icon me-2"}>
                                            <Icon icon={"it-calendar"}/>
                                        </span>
                                    Storico
                                </Button>
                            </Col>
                        </Row>

                        <Row className={"mt-4"}>
                            {/*
        requestDate,
        outcomeDate,
        registerNumber,
        registerDate,
                    */}
                            <Col md={3}>
                                <ValidatedInput name={"requestDate"} labelText={"Data richiesta"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={dateStrToISOString(voucherDetails.requestDate)}
                                                isMandatory={false}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "date"}}/>
                            </Col>
                            <Col md={3}>
                                <ValidatedInput name={"outcomeDate"} labelText={"Data esito"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={dateStrToISOString(voucherDetails.outcomeDate)}
                                                isMandatory={false}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "date"}}/>
                            </Col>
                            <Col md={3}>
                                <ValidatedInput name={"registerNumber"} labelText={"Numero protocollo"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={voucherDetails.registerNumber}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "number"}}/>
                            </Col>
                            <Col md={2}>
                                <ValidatedInput name={"registerDate"} labelText={"Data protocollo"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={dateStrToISOString(voucherDetails.registerDate)}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "date"}}/>
                            </Col>
                        </Row>
                        <Row>
                            {/*cf,
        firstname,
        lastname,
        email,*/}

                            <Col md={3}>
                                <ValidatedInput name={"cf"} labelText={"Codice fiscale"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={voucherDetails.cf}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                            <Col md={2}>
                                <ValidatedInput name={"firstname"} labelText={"Nome"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={voucherDetails.firstname}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                            <Col md={2}>
                                <ValidatedInput name={"lastname"} labelText={"Cognome"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={voucherDetails.lastname}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                            <Col md={5}>
                                <ValidatedInput name={"email"} labelText={"Email"}
                                                validationFunc={validateEmail}
                                                validationText={"Inserisci un indirizzo email valido"}
                                                persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={voucherDetails.email}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                        </Row>
                        <Row>
                            {/*
       birthDate,
        birthCity,
        residenceCity,
        residencePlace,
        targetHousePlace,*/}

                            <Col md={2}>
                                <ValidatedInput name={"birthDate"} labelText={"Data di nascita"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={dateStrToISOString(voucherDetails.birthDate)}
                                                isMandatory={false}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "date"}}/>
                            </Col>
                            <Col md={2}>
                                <ValidatedInput name={"birthCity"} labelText={"Luogo di nascita"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={voucherDetails.birthCity != null ? voucherDetails.birthCity : ""}
                                                isMandatory={false}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                            <Col md={2}>
                                <ValidatedInput name={"residenceCity"} labelText={"Comune di residenza"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={voucherDetails.residenceCity != null ? voucherDetails.residenceCity : ""}
                                                isMandatory={false}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                            <Col md={3}>
                                <ValidatedInput name={"residencePlace"} labelText={"Indirizzo di residenza"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={voucherDetails.residencePlace != null ? voucherDetails.residencePlace : ""}
                                                isMandatory={false}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                            <Col md={3}>
                                <ValidatedInput name={"targetHousePlace"} labelText={"Indirizzo immobile"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={voucherDetails.targetHousePlace != null ? voucherDetails.targetHousePlace : ""}
                                                isMandatory={false}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>

                        </Row>
                        <Row>
                            {/*
        targetHouseLandRegistrySheet,
        targetHouseLandRegistryMap,
        targetHouseLandRegistrySubaltern,
        targetHouseLandRegistryCategory,*/}

                            <Col md={3}>
                                <ValidatedInput name={"targetHouseLandRegistrySheet"} labelText={"Foglio"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={voucherDetails.targetHouseLandRegistrySheet != null ? voucherDetails.targetHouseLandRegistrySheet : ""}
                                                isMandatory={false}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                            <Col md={3}>
                                <ValidatedInput name={"targetHouseLandRegistryMap"} labelText={"Mappale"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={voucherDetails.targetHouseLandRegistryMap != null ? voucherDetails.targetHouseLandRegistryMap : ""}
                                                isMandatory={false}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                            <Col md={3}>
                                <ValidatedInput name={"targetHouseLandRegistrySubaltern"} labelText={"Subalterno"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={voucherDetails.targetHouseLandRegistrySubaltern != null ? voucherDetails.targetHouseLandRegistrySubaltern : ""}
                                                isMandatory={false}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                            <Col md={3}>
                                <ValidatedInput name={"targetHouseLandRegistryCategory"} labelText={"Categoria"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={voucherDetails.targetHouseLandRegistryCategory != null ? voucherDetails.targetHouseLandRegistryCategory : ""}
                                                isMandatory={false}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                        </Row>
                        {/*notes,*/}
                        <Row>
                            <Col md={8}>
                                <ValidatedInput name={"notes"} labelText={"Note"}
                                                validationFunc={() => true}
                                                validationText={""} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={voucherDetails.notes != null ? voucherDetails.notes : ""}
                                                isMandatory={false}
                                                errorMessage={""}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                        </Row>

                        <Row>
                            {/*
        permitId,
        outcomeId,
        typeId,
        */}
                            <Col md={4}>
                                <ValidatedSelect name={"permitId"} validationFunc={() => true}
                                                 validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                 defaultValue={voucherDetails.permit.id}
                                                 isMandatory={true}
                                                 errorMessage={"Compilare i campi obbligatori"}
                                                 setNewValidation={setValidation}
                                                 labelText={"Permesso associato"}
                                                 valueChangedCallback={selectedPermitChanged}
                                                 options={selectablePermits}/>
                            </Col>
                            <Col md={4}>
                                <ValidatedSelect name={"typeId"} validationFunc={() => true}
                                                 validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                 defaultValue={voucherDetails.type.id}
                                                 isMandatory={true}
                                                 errorMessage={"Compilare i campi obbligatori"}
                                                 setNewValidation={setValidation}
                                                 labelText={"Tipo"}
                                                 options={selectableApplicationTypes}/>
                            </Col>
                            <Col md={4}>
                                <ValidatedSelect name={"outcomeId"} validationFunc={() => true}
                                                 validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                 defaultValue={voucherDetails.outcome.id}
                                                 isMandatory={true}
                                                 errorMessage={"Compilare i campi obbligatori"}
                                                 setNewValidation={setValidation}
                                                 labelText={"Esito"}
                                                 options={selectableApplicationOutcomes}/>
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
            {voucherDetails != null && (
                <>
                    <Row className={"mt-4"}>
                        <ValidatedVehiclesList name={"vehicles"} validationFunc={() => true}
                                               validationText={"Campo obbligatorio"}
                                               defaultValue={voucherDetails.vehicles != null ? voucherDetails.vehicles.map(vehicle => vehicle.id) : []}
                                               isMandatory={true}
                                               errorMessage={"Devi associare un numero corretto di veicoli"}
                                               setNewValidation={setValidation}
                                               labelText={"Veicoli associati"} amount={vehiclesAmount}
                                               exactAmount={true}/>

                    </Row>
                    <Row>
                        {/*
        voucherId,
        //EXTRA
        createVoucher, //boolean for creating a voucher for this application
        //updateVoucher
                */}
                        {/* TODO: scelta tagliando */}
                    </Row>
                </>
            )}
        </Container>
    );
}
