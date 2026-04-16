import {useNavigate, useParams} from "react-router";
import {type FormEvent, type FormEventHandler, useEffect, useState} from "react";
import type {
    ApplicationAvailableOptionsApiResponse,
    ApplicationDetails,
    ApplicationDetailsApiResponse,
    ApplicationOutcomeListEntry,
    ApplicationTypeListEntry,
    DataMessage,
    PermitListEntry
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
import {ValidatedVoucherAssociation} from "../../../components/form/ValidatedVoucherAssociation.tsx";

export function EditApplication() {
    const navigate = useNavigate();
    const [applicationDetails, setApplicationDetails] = useState<ApplicationDetails | null>(null);
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);
    const [applicationTypeList, setApplicationTypeList] = useState<ApplicationTypeListEntry[]>([]);
    const [applicationOutcomeList, setApplicationOutcomeList] = useState<ApplicationOutcomeListEntry[]>([]);
    const [permitsList, setPermitsList] = useState<PermitListEntry[]>([]);
    const [vehiclesAmount, setVehiclesAmount] = useState<number>(2);
    const urlParams = useParams();
    const [selectedPermitListEntry, setSelectedPermitListEntry] = useState<PermitListEntry | null>(null);

    useEffect(() => {
        const abort = fetchApiAsync<ApplicationAvailableOptionsApiResponse>({
            urlFromApiRoot: "/applications/availableOptions",
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null) {
                    setApplicationTypeList(data.applicationTypes);
                    setApplicationOutcomeList(data.applicationOutcomes);
                    setPermitsList(data.permits);
                }
            }
        });
        return abort;
    }, [setErr, setLoading, setSucc, setApplicationTypeList, setApplicationOutcomeList, setPermitsList]);

    useEffect(() => {
        if (urlParams.applicationID == null || urlParams.applicationID == "") {
            navigate("/applications/list");
        }
    }, [navigate, urlParams]);

    useEffect(() => {
        const abort = fetchApiAsync<ApplicationDetailsApiResponse>({
            urlFromApiRoot: "/applications/detail/" + urlParams.applicationID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null) {
                    setApplicationDetails(data.application);
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
            urlFromApiRoot: "/applications/edit/" + urlParams.applicationID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(formValues)
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
                setSelectedPermitListEntry(permit);
            }
        }
    }

    return (
        <Container>
            <GoBack link className={""}>
                Torna indietro
            </GoBack>
            <h2>Modifica domanda</h2>
            <Form onSubmit={onFormSubmit} className={"mt-4"}>
                {applicationDetails != null && (
                    <>
                        <Row>
                            <Col lg={1}>
                                <p><strong>ID</strong><br/>{applicationDetails.id}</p>
                            </Col>
                            <Col lg={3}>
                                <p><strong>Creata
                                    il</strong><br/>{new Date(applicationDetails.createdAt).toLocaleString()}</p>
                            </Col>
                            <Col lg={3}>
                                <p><strong>Ultima
                                    modifica</strong><br/>{new Date(applicationDetails.updatedAt).toLocaleString()}
                                </p>
                            </Col>
                            {applicationDetails.outcomeAuthUser != null && (
                                <Col lg={2}>
                                    <p><strong>Utente esito</strong><br/>{applicationDetails.outcomeAuthUser.username}
                                    </p>
                                </Col>
                            )}

                            <Col lg={2}>
                                <Button className={"mb-4"}
                                        onClick={() => navigate(`/applications/list/${applicationDetails.id}/history`)}
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
                                                defaultValue={dateStrToISOString(applicationDetails.requestDate)}
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
                                                defaultValue={dateStrToISOString(applicationDetails.outcomeDate)}
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
                                                defaultValue={applicationDetails.registerNumber}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "number"}}/>
                            </Col>
                            <Col md={3}>
                                <ValidatedInput name={"registerDate"} labelText={"Data protocollo"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={dateStrToISOString(applicationDetails.registerDate)}
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
                                                defaultValue={applicationDetails.cf}
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
                                                defaultValue={applicationDetails.firstname}
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
                                                defaultValue={applicationDetails.lastname}
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
                                                defaultValue={applicationDetails.email}
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

                            <Col md={3}>
                                <ValidatedInput name={"birthDate"} labelText={"Data di nascita"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={dateStrToISOString(applicationDetails.birthDate)}
                                                isMandatory={false}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "date"}}/>
                            </Col>
                            <Col md={3}>
                                <ValidatedInput name={"birthCity"} labelText={"Luogo di nascita"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={applicationDetails.birthCity != null ? applicationDetails.birthCity : ""}
                                                isMandatory={false}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                            <Col md={3}>
                                <ValidatedInput name={"residenceCity"} labelText={"Comune di residenza"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={applicationDetails.residenceCity != null ? applicationDetails.residenceCity : ""}
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
                                                defaultValue={applicationDetails.residencePlace != null ? applicationDetails.residencePlace : ""}
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

                            <Col md={4}>
                                <ValidatedInput name={"targetHousePlace"} labelText={"Indirizzo immobile"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={applicationDetails.targetHousePlace != null ? applicationDetails.targetHousePlace : ""}
                                                isMandatory={false}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>

                            <Col md={2}>
                                <ValidatedInput name={"targetHouseLandRegistrySheet"} labelText={"Foglio"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={applicationDetails.targetHouseLandRegistrySheet != null ? applicationDetails.targetHouseLandRegistrySheet : ""}
                                                isMandatory={false}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                            <Col md={2}>
                                <ValidatedInput name={"targetHouseLandRegistryMap"} labelText={"Mappale"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={applicationDetails.targetHouseLandRegistryMap != null ? applicationDetails.targetHouseLandRegistryMap : ""}
                                                isMandatory={false}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                            <Col md={2}>
                                <ValidatedInput name={"targetHouseLandRegistrySubaltern"} labelText={"Subalterno"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={applicationDetails.targetHouseLandRegistrySubaltern != null ? applicationDetails.targetHouseLandRegistrySubaltern : ""}
                                                isMandatory={false}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                            <Col md={2}>
                                <ValidatedInput name={"targetHouseLandRegistryCategory"} labelText={"Categoria"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={applicationDetails.targetHouseLandRegistryCategory != null ? applicationDetails.targetHouseLandRegistryCategory : ""}
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
                                                defaultValue={applicationDetails.notes != null ? applicationDetails.notes : ""}
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
                                                 defaultValue={applicationDetails.permit.id}
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
                                                 defaultValue={applicationDetails.type.id}
                                                 isMandatory={true}
                                                 errorMessage={"Compilare i campi obbligatori"}
                                                 setNewValidation={setValidation}
                                                 labelText={"Tipo"}
                                                 options={selectableApplicationTypes}/>
                            </Col>
                            <Col md={4}>
                                <ValidatedSelect name={"outcomeId"} validationFunc={() => true}
                                                 validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                 defaultValue={applicationDetails.outcome.id}
                                                 isMandatory={false}
                                                 errorMessage={"Compilare i campi obbligatori"}
                                                 setNewValidation={setValidation}
                                                 labelText={"Esito"}
                                                 options={selectableApplicationOutcomes}/>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Button color={"primary"} type={"submit"} disabled={!valid || loading}> Salva </Button>
                            </Col>
                        </Row>
                    </>
                )}

                <LoadingSpinner loading={loading}/>

                <SuccessErrorAlert err={err} succ={succ}/>

            </Form>
            {applicationDetails != null && (
                <>
                    <Row className={"mt-4"}>
                        <ValidatedVehiclesList name={"vehicles"} validationFunc={() => true}
                                               validationText={"Campo obbligatorio"}
                                               defaultValue={applicationDetails.vehicles != null ? applicationDetails.vehicles.map(vehicle => vehicle.id) : []}
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
                        <ValidatedVoucherAssociation name={"voucherId"} createName={"createVoucher"}
                                                     updateName={"updateVoucher"} permitFilter={selectedPermitListEntry}
                                                     validationFunc={() => true}
                                                     validationText={"Campo obbligatorio"}
                                                     defaultValue={applicationDetails.voucher == null ? null : applicationDetails.voucher.id} isMandatory={false}
                                                     errorMessage={"Devi associare un tagliando"}
                                                     setNewValidation={setValidation}
                                                     labelText={"Tagliando associato"}/>
                    </Row>
                </>
            )}
        </Container>
    );
}
