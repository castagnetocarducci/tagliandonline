import {type FormEvent, type FormEventHandler, useEffect, useState} from "react";
import type {
    AddedElementMessageApiResponse,
    ApplicationAvailableOptionsApiResponse,
    ApplicationOutcomeListEntry,
    ApplicationTypeListEntry,
    PermitListEntry
} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {useValidateFormInput, type ValidationSupportedTypes} from "../../../hooks/useValidateFormInput.ts";
import {defaultGETRequestInit, defaultPOSTRequestInit, fetchApiAsync} from "../../../utils/fetching.ts";
import {Button, Col, Container, Form, GoBack, Row} from "design-react-kit";
import {ValidatedInput} from "../../../components/form/ValidatedInput.tsx";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";
import {useNavigate} from "react-router";
import {type SelectOption, ValidatedSelect} from "../../../components/form/ValidatedSelect.tsx";
import {ValidatedVehiclesList} from "../../../components/form/ValidatedVehiclesList.tsx";
import {validateEmail} from "../../../utils/CommonFunctions.ts";

export function NewApplication() {
    const navigate = useNavigate();
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);
    const [applicationTypeList, setApplicationTypeList] = useState<ApplicationTypeListEntry[]>([]);
    const [applicationOutcomeList, setApplicationOutcomeList] = useState<ApplicationOutcomeListEntry[]>([]);
    const [permitsList, setPermitsList] = useState<PermitListEntry[]>([]);
    const [vehiclesAmount, setVehiclesAmount] = useState<number>(2);

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
    }, [setErr, setLoading, setSucc, setApplicationTypeList, setApplicationOutcomeList]);

    const onFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();
        if (!valid) {
            executeValidation(true);
            return;
        }
        const formValues = getValueObject();
        fetchApiAsync<AddedElementMessageApiResponse>({
            urlFromApiRoot: "/applications/new",
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(formValues)
            },
            callback: (data) => {
                if (data != null && data.id != null) {
                    navigate("/applications/list/" + data.id);
                }
            }
        });
    }

    //TODO: redo
    const createFakeVehicles = () => {
        for (let i = 0; i < 100; i++) {
            fetchApiAsync<AddedElementMessageApiResponse>({
                urlFromApiRoot: "/applications/new",
                errSuccLoading: {setErr, setSucc, setLoading},
                requestInit: {
                    ...defaultPOSTRequestInit,
                    body: JSON.stringify({
                        plate: "AB" + i,
                        brand: "Marca " + i,
                        model: "Modello " + i
                    })
                },
                callback: (data) => {
                    console.log(data);
                }
            });
        }
        for (let i = 0; i < 100; i++) {
            fetchApiAsync<AddedElementMessageApiResponse>({
                urlFromApiRoot: "/applications/new",
                errSuccLoading: {setErr, setSucc, setLoading},
                requestInit: {
                    ...defaultPOSTRequestInit,
                    body: JSON.stringify({
                        plate: i + "CD",
                        brand: "Marca " + i,
                        model: "Modello " + i
                    })
                },
                callback: (data) => {
                    console.log(data);
                }
            });
        }
        for (let i = 0; i < 100; i++) {
            fetchApiAsync<AddedElementMessageApiResponse>({
                urlFromApiRoot: "/applications/new",
                errSuccLoading: {setErr, setSucc, setLoading},
                requestInit: {
                    ...defaultPOSTRequestInit,
                    body: JSON.stringify({
                        plate: "EF" + i + "HG",
                        brand: "Marca " + i,
                        model: "Modello " + i
                    })
                },
                callback: (data) => {
                    console.log(data);
                }
            });
        }
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
            <h2>Nuova domanda</h2>

            <Form onSubmit={onFormSubmit} className={"mt-4"}>

                <Row className={"mt-4"}>
                    {/*
        requestDate,
        outcomeDate,
        registerNumber,
        registerDate,

        cf,
        firstname,
        lastname,
        email,

        birthDate,
        birthCity,
        residencePlace,
        targetHousePlace,

        targetHouseLandRegistrySheet,
        targetHouseLandRegistryMap,
        targetHouseLandRegistrySubaltern,
        targetHouseLandRegistryCategory,

        notes,

        permitId,
        outcomeId,
        typeId,

        // outcomeAuthUserId,

        vehicles,

        TODO: ricerca voucher
        voucherId,
        //EXTRA
        createVoucher, //boolean for creating a voucher for this application
        //updateVoucher,



                    */}
                    <Col md={3}>
                        <ValidatedInput name={"requestDate"} labelText={"Data richiesta"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={""}
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
                                        defaultValue={""}
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
                                        defaultValue={""}
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
                                        defaultValue={""}
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
                                        defaultValue={""}
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
                                        defaultValue={""}
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
                                        defaultValue={""}
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
                                        defaultValue={""}
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
        residencePlace,
        targetHousePlace,*/}

                    <Col md={3}>
                        <ValidatedInput name={"birthDate"} labelText={"Data di nascita"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={""}
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
                                        defaultValue={""}
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
                                        defaultValue={""}
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
                                        defaultValue={""}
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
                                        defaultValue={""}
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
                                        defaultValue={""}
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
                                        defaultValue={""}
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
                                        defaultValue={""}
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
                                        defaultValue={""}
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
                                         defaultValue={""}
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
                                         defaultValue={""}
                                         isMandatory={true}
                                         errorMessage={"Compilare i campi obbligatori"}
                                         setNewValidation={setValidation}
                                         labelText={"Tipo"}
                                         options={selectableApplicationTypes}/>
                    </Col>
                    <Col md={4}>
                        <ValidatedSelect name={"outcomeId"} validationFunc={() => true}
                                         validationText={"Campo obbligatorio"} persistingValidationText={false}
                                         defaultValue={""}
                                         isMandatory={true}
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

                <LoadingSpinner loading={loading}/>

                <SuccessErrorAlert err={err} succ={succ}/>

            </Form>

            <Row className={"mt-4"}>
                <ValidatedVehiclesList name={"vehicles"} validationFunc={() => true}
                                       validationText={"Campo obbligatorio"} defaultValue={[]} isMandatory={true}
                                       errorMessage={"Devi associare un numero corretto di veicoli"}
                                       setNewValidation={setValidation}
                                       labelText={"Veicoli associati"} amount={vehiclesAmount} exactAmount={true}/>

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

            {import.meta.env.DEV && (
                <Row className={"mt-4"}>
                    <Col md={4}>
                        <Button color={"primary"} onClick={() => createFakeVehicles()} outline> Crea veicoli
                            fittizi </Button>
                    </Col>
                </Row>
            )}

        </Container>
    );
}
