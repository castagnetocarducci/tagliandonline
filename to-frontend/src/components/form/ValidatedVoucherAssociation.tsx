import {
    type SetValidationFunc,
    useValidateFormInput,
    type ValidatedFormValuesMap,
    type ValidationFunc,
    type ValidationSupportedTypes
} from "../../hooks/useValidateFormInput.ts";
import {type FormEvent, type FormEventHandler, useCallback, useEffect, useState} from "react";
import {titleCase} from "../../utils/StringUtils.ts";
import {Button, Col, Container, Form, Icon, Row} from "design-react-kit";
import type {
    PermitListEntry,
    VoucherByIDApiResponse,
    VoucherListApiResponse,
    VoucherListEntry
} from "../../utils/Types.ts";
import {useErrSuccLoad} from "../../hooks/useErrSuccLoad.ts";
import {AutoPager, type PagerPageData} from "../AutoPager.tsx";
import {defaultGETRequestInit, defaultPOSTRequestInit, fetchApiAsync} from "../../utils/fetching.ts";
import {ValidatedInput} from "./ValidatedInput.tsx";
import {LoadingSpinner} from "../LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../SuccessErrorAlert.tsx";
import {allStringsEmpty, validateEmail} from "../../utils/CommonFunctions.ts";
import {Link} from "react-router";


type ValidatedVoucherListProps = {
    name: string,
    createName: string,
    updateName: string,
    permitFilter: PermitListEntry | null,
    validationFunc: ValidationFunc,
    validationText: string,
    defaultValue: ValidationSupportedTypes,
    isMandatory: boolean,
    errorMessage: string,
    setNewValidation: SetValidationFunc,
    labelText: string,
    valueChangedCallback?: (newValue: ValidationSupportedTypes) => void,
}

export function ValidatedVoucherAssociation(
    {
        name,
        createName,
        updateName,
        permitFilter,
        validationFunc,
        validationText,
        defaultValue,
        isMandatory,
        errorMessage,
        setNewValidation,
        labelText,
        valueChangedCallback,
    }: ValidatedVoucherListProps) {

    const [value, setValue] = useState<number | null>(null);
    const [selectedVoucher, setSelectedVoucher] = useState<VoucherListEntry | null>(null);

    const [vouchersList, setVouchersList] = useState<VoucherListEntry[]>([]);
    const {err, setErr, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);
    const [pageData, setPageData] = useState<PagerPageData>({currentPage: 1, totalPages: 0});
    const [formSearchParams, setFormSearchParams] = useState<ValidatedFormValuesMap>({});
    const [defaultValueAcquired, setDefaultValueAcquired] = useState(false);

    useEffect(() => {
        if (defaultValueAcquired) {
            return;
        }
        if (defaultValue == null || typeof defaultValue !== "number") {
            return;
        }

        const abort = fetchApiAsync<VoucherByIDApiResponse>({
            urlFromApiRoot: "/vouchers/byID/" + defaultValue,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                console.log(data);
                if (data != null && data.voucher != null) {
                    setSelectedVoucher(data.voucher);
                    setValue(data.voucher.id);
                    setDefaultValueAcquired(true);
                }
            }
        });

        return abort;
    }, [defaultValue, setValue, setSelectedVoucher, setErr, setSucc, setLoading,
        defaultValueAcquired, setDefaultValueAcquired]);

    const incrementedValidationFunc = useCallback((value: ValidationSupportedTypes | null): boolean => {
        const isEmpty = value == null || value === "" ||
            (value instanceof Array ? value.length === 0 : false); //testo per Array perché non posso testare direttamente number[], in questo caso Array vuoto significa campo non impostato
        if (isMandatory && isEmpty) {
            return false;
        }
        if (!isMandatory && isEmpty) {
            return true;
        }
        return validationFunc(value);
    }, [isMandatory, validationFunc]);

    const isValid = incrementedValidationFunc(value);
    const labelContent = labelText || titleCase(name);


    const isVoucherSelected = (voucherId: number) => {
        return value === voucherId;
    }

    const addVoucher = (voucher: VoucherListEntry) => {
        if (value === voucher.id) {
            return;
        }
        const newValue = voucher.id;
        setValue(newValue);
        setSelectedVoucher(voucher);
    }

    const removeVoucher = (voucher: VoucherListEntry) => {
        if (value !== voucher.id) {
            return;
        }
        setValue(null);
        setSelectedVoucher(null);
    }

    // const onParameterChange = (newValue: string) => {
    //     setValue(newValue);
    // }

    useEffect(() => {
        setNewValidation(name, {
            value: value,
            errorMessage: errorMessage,
            validateFunc: incrementedValidationFunc,
        });
        if (valueChangedCallback != null) valueChangedCallback(value);
    }, [errorMessage, incrementedValidationFunc, isMandatory, name, setNewValidation, validationFunc, value, valueChangedCallback]);

    const onFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();
        if (!valid) {
            executeValidation(true);
            return;
        }
        const formValues = getValueObject();
        setPageData((prevState) => {
            return {...prevState, currentPage: 1}
        });
        setFormSearchParams(formValues);
    }

    useEffect(() => {
        const valuesMap = {...formSearchParams};
        valuesMap["page"] = pageData.currentPage;
        const abort = fetchApiAsync<VoucherListApiResponse>({
            urlFromApiRoot: "/vouchers/list",
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(valuesMap)
            },
            callback: (data) => {
                if (data != null && data.vouchersList != null) {
                    setVouchersList(data.vouchersList);
                }
                if (data != null && data.pageData != null) {
                    setPageData(data.pageData)
                }
            }
        });
        return abort;
    }, [setErr, setLoading, setSucc, setVouchersList, formSearchParams, pageData.currentPage, setPageData]);


    return (
        <Container>
            <Row className={"m-2"}>
                <Col md={5}>
                    <h2>{labelContent}</h2>
                    {!isValid && (
                        <span style={{color: "#d9364f"}}>
                            {validationText}
                            <br/>
                        </span>
                    )}
                    <br/>

                    {selectedVoucher != null ? (

                        <Row className={"border border-secondary rounded me-1 pt-2"}>
                            <Col md={12}>
                                <ValidatedInput name={updateName} validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false} defaultValue={false}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setNewValidation}
                                                labelText={"Aggiorna tagliando con dati domanda"}
                                                inputProps={{type: "checkbox", className: "form-check-input"}}
                                />

                                <Button onClick={() => removeVoucher(selectedVoucher)}
                                        color={"secondary"} icon={true} size={"xs"} title={"Rimuovi tagliando"}>
                                            <span className={"rounded-icon me-2"}>
                                                <Icon icon={"it-minus"}/>
                                            </span>
                                    Rimuovi
                                </Button>
                                <p className={"mt-2"}>
                                    <Link to={"/vouchers/list/" + selectedVoucher.id} target={"_blank"}>
                                        ID univoco: {selectedVoucher.id}{": "}
                                        <strong>Numero {selectedVoucher.number}</strong>{" - "}
                                        <strong>{selectedVoucher.currentState}</strong>
                                    </Link>
                                    <br/>
                                    Valido dal{' '}
                                    {new Date(selectedVoucher.validFromDate).toLocaleDateString()}
                                    {' '}al{' '}
                                    {new Date(selectedVoucher.validToDate).toLocaleDateString()}
                                    <br/>

                                    {selectedVoucher.vehicles == null || selectedVoucher.vehicles.length == 0 ? (
                                        <span>Nessun veicolo associato</span>
                                    ) : (
                                        <>
                                            Veicoli:{" "}<br/>
                                            {selectedVoucher.vehicles.map((vehicle, index) => (
                                                <span key={index}>
                                                    {" - "}
                                                    <Link to={"/vehicles/list/" + vehicle.id} target={"_blank"}>
                                                        <strong>{vehicle.plate}</strong> {vehicle.brand} {vehicle.model}
                                                    </Link>
                                                    <br/>
                                                </span>
                                            ))}
                                        </>
                                    )}


                                    {/*</Col>*/}
                                    {/*<Col md={6}>*/}
                                    {/*        <p>*/}
                                    {/*    Permesso <i>({selectedVoucher.permit.id})</i>: {selectedVoucher.permit.description}{" "}*/}
                                    {/*            <strong><i>{selectedVoucher.permit.disabled && "Decaduto"}</i></strong>*/}
                                    {/*</p>*/}
                                    Permesso ({selectedVoucher.permit.id}): {selectedVoucher.permit.description}{" "}
                                    <strong>{selectedVoucher.permit.disabled && "Decaduto"}</strong><br/>
                                    {selectedVoucher.applications.length === 0 ? (
                                        <span>
                                        Nessuna domanda associata
                                    </span>
                                    ) : (
                                        <span>
                                        Ultima domanda associata: <strong>{selectedVoucher.applications[0].id}</strong><br/>
                                            <strong>{selectedVoucher.applications[0].cf}</strong> {selectedVoucher.applications[0].firstname} {selectedVoucher.applications[0].lastname}<br/>
                                            {!allStringsEmpty(selectedVoucher.applications[0].companyName, selectedVoucher.applications[0].companyCF) && (
                                                <> per {selectedVoucher.applications[0].companyName} {selectedVoucher.applications[0].companyCF}</>
                                            )}<br/>
                                            {selectedVoucher.applications[0].email}<br/>
                                        Protocollo: {selectedVoucher.applications[0].registerNumber} del {new Date(selectedVoucher.applications[0].registerDate).toLocaleDateString()}<br/>
                                        Riferita all'immobile: {selectedVoucher.applications[0].targetHousePlace}{" - "}
                                            {selectedVoucher.applications[0].targetHouseLandRegistrySheet}/{selectedVoucher.applications[0].targetHouseLandRegistryMap}/{selectedVoucher.applications[0].targetHouseLandRegistrySubaltern}/{selectedVoucher.applications[0].targetHouseLandRegistryCategory}
                                            <br/>
                                    </span>
                                    )}
                                    Ultima modifica: {new Date(selectedVoucher.updatedAt).toLocaleString()}
                                </p>


                            </Col>
                        </Row>
                    ) : (
                        <Row className={"border border-secondary rounded me-1 pt-2"}>
                            <Col md={12}>
                                <p>
                                    <strong>Nessun tagliando associato</strong>
                                </p>
                                <ValidatedInput name={createName} validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false} defaultValue={false}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setNewValidation}
                                                labelText={"Crea nuovo tagliando"}
                                                inputProps={{type: "checkbox", className: "form-check-input"}}/>
                            </Col>
                        </Row>
                    )}
                </Col>
                <Col md={7} className={"border border-secondary rounded"}>
                    <h3 className={"mb-4 mt-3"}>
                        Ricerca tagliandi
                    </h3>
                    <Form onSubmit={onFormSubmit} className={"mt-4"}>
                        {/*
        idFrom,
        idTo,

        numberFrom,
        numberTo,
        permitId
        */}

                        {/*
        emailTo,
        permitId,
        */}
                        {/*<Row>*/}
                        {/*    <Col md={4}>*/}
                        {/*        <ValidatedSelect name={"permitId"} validationFunc={() => true}*/}
                        {/*                         validationText={"Campo obbligatorio"} persistingValidationText={false}*/}
                        {/*                         defaultValue={""}*/}
                        {/*                         isMandatory={false}*/}
                        {/*                         errorMessage={"Compilare i campi obbligatori"}*/}
                        {/*                         setNewValidation={setValidation}*/}
                        {/*                         labelText={"Permesso associato"}*/}
                        {/*                         options={[permitFilter]}/>*/}
                        {/*    </Col>*/}
                        {/*</Row>*/}

                        <Row>
                            <Col xl={6}>
                                <Row>
                                    <Col md={6}>
                                        <ValidatedInput name={"idFrom"} namePrefix={"voucherSelectSearch_"}
                                                        labelText={"ID (da)"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"}
                                                        persistingValidationText={false}
                                                        validationMark={false}
                                                        defaultValue={""}
                                                        isMandatory={false}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={setValidation}
                                                        inputProps={{type: "number"}}/>
                                    </Col>
                                    <Col md={6}>
                                        <ValidatedInput name={"idTo"} namePrefix={"voucherSelectSearch_"}
                                                        labelText={"ID (a)"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"}
                                                        persistingValidationText={false}
                                                        validationMark={false}
                                                        defaultValue={""}
                                                        isMandatory={false}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={setValidation}
                                                        inputProps={{type: "number"}}/>
                                    </Col>
                                </Row>
                            </Col>
                            <Col xl={6}>
                                <Row>
                                    <Col md={6}>
                                        <ValidatedInput name={"numberFrom"} namePrefix={"voucherSelectSearch_"}
                                                        labelText={"Numero (da)"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"}
                                                        persistingValidationText={false}
                                                        validationMark={false}
                                                        defaultValue={""}
                                                        isMandatory={false}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={setValidation}
                                                        inputProps={{type: "number"}}/>
                                    </Col>
                                    <Col md={6}>
                                        <ValidatedInput name={"numberTo"} namePrefix={"voucherSelectSearch_"}
                                                        labelText={"Numero (a)"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"}
                                                        persistingValidationText={false}
                                                        validationMark={false}
                                                        defaultValue={""}
                                                        isMandatory={false}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={setValidation}
                                                        inputProps={{type: "number"}}/>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>

                        <Row className={"d-none"}>
                            <ValidatedInput name={"permitId"} namePrefix={"voucherSelectSearch_"} labelText={"Permesso"}
                                            validationFunc={() => true}
                                            validationText={"Campo obbligatorio"} persistingValidationText={false}
                                            validationMark={false}
                                            defaultValue={"" + (permitFilter == null ? "" : permitFilter.id)}
                                            isMandatory={false}
                                            errorMessage={"Compilare i campi obbligatori"}
                                            setNewValidation={setValidation}
                                            inputProps={{type: "text", className: "d-none"}}/>
                        </Row>

                        {/*
        validityStartedFromDate,
        validityStartedToDate,

        expiresFromDate,
        expiresToDate,
        */}
                        <Row>
                            <Col xl={6}>
                                <Row>
                                    <Col md={6}>
                                        <ValidatedInput name={"validityStartedFromDate"}
                                                        namePrefix={"voucherSelectSearch_"}
                                                        labelText={"Inizio validità (da)"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"}
                                                        persistingValidationText={false}
                                                        validationMark={false}
                                                        defaultValue={""}
                                                        isMandatory={false}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={setValidation}
                                                        inputProps={{type: "date"}}/>
                                    </Col>
                                    <Col md={6}>
                                        <ValidatedInput name={"validityStartedToDate"}
                                                        namePrefix={"voucherSelectSearch_"}
                                                        labelText={"Inizio validità (a)"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"}
                                                        persistingValidationText={false}
                                                        validationMark={false}
                                                        defaultValue={""}
                                                        isMandatory={false}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={setValidation}
                                                        inputProps={{type: "date"}}/>
                                    </Col>
                                </Row>
                            </Col>
                            <Col xl={6}>
                                <Row>
                                    <Col md={6}>
                                        <ValidatedInput name={"expiresFromDate"}
                                                        namePrefix={"voucherSelectSearch_"}
                                                        labelText={"Scadenza (da)"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"}
                                                        persistingValidationText={false}
                                                        validationMark={false}
                                                        defaultValue={""}
                                                        isMandatory={false}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={setValidation}
                                                        inputProps={{type: "date"}}/>
                                    </Col>
                                    <Col md={6}>
                                        <ValidatedInput name={"expiresToDate"}
                                                        namePrefix={"voucherSelectSearch_"}
                                                        labelText={"Scadenza (a)"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"}
                                                        persistingValidationText={false}
                                                        validationMark={false}
                                                        defaultValue={""}
                                                        isMandatory={false}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={setValidation}
                                                        inputProps={{type: "date"}}/>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>

                        {/*
         cf,
        firstname,
        lastname,
        email,
        */}
                        <p className={"mb-4"}><strong>Filtra per dati intestatario</strong></p>
                        <Row>
                            <Col xl={7}>
                                <Row>
                                    <Col md={6}>
                                        <ValidatedInput name={"cf"} namePrefix={"voucherSelectSearch_"}
                                                        labelText={"Codice fiscale"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"}
                                                        persistingValidationText={false}
                                                        validationMark={false}
                                                        defaultValue={""}
                                                        isMandatory={false}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={setValidation}
                                                        inputProps={{type: "text"}}/>
                                    </Col>
                                    <Col md={3}>
                                        <ValidatedInput name={"firstname"} namePrefix={"voucherSelectSearch_"}
                                                        labelText={"Nome"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"}
                                                        persistingValidationText={false}
                                                        validationMark={false}
                                                        defaultValue={""}
                                                        isMandatory={false}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={setValidation}
                                                        inputProps={{type: "text"}}/>
                                    </Col>
                                    <Col md={3}>
                                        <ValidatedInput name={"lastname"} namePrefix={"voucherSelectSearch_"}
                                                        labelText={"Cognome"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"}
                                                        persistingValidationText={false}
                                                        validationMark={false}
                                                        defaultValue={""}
                                                        isMandatory={false}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={setValidation}
                                                        inputProps={{type: "text"}}/>
                                    </Col>
                                </Row>
                            </Col>
                            <Col xl={5}>
                                <ValidatedInput name={"email"} namePrefix={"voucherSelectSearch_"} labelText={"Email"}
                                                validationFunc={validateEmail}
                                                validationText={"Inserisci un indirizzo email valido"}
                                                persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={""}
                                                isMandatory={false}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Row>
                                    <Col xs={6}>
                                        <ValidatedInput name={"companyCF"} namePrefix={"voucherSelectSearch_"}
                                                        labelText={"CF Persona giuridica"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                        validationMark={false}
                                                        defaultValue={""}
                                                        isMandatory={false}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={setValidation}
                                                        inputProps={{type: "text"}}/>
                                    </Col>
                                    <Col xs={6}>
                                        <ValidatedInput name={"companyName"} namePrefix={"voucherSelectSearch_"}
                                                        labelText={"Ragione sociale"}
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
                            </Col>
                        </Row>

                        {/*
        targetHousePlace,
        targetHouseLandRegistrySheet,
        targetHouseLandRegistryMap,
        targetHouseLandRegistrySubaltern,
        targetHouseLandRegistryCategory,
        */}
                        <p className={"mb-4"}><strong>Filtra per immobile di riferimento</strong></p>
                        <Row>
                            <Col xl={4}>
                                <Row>
                                    <Col md={12}>
                                        <ValidatedInput name={"targetHousePlace"} namePrefix={"voucherSelectSearch_"}
                                                        labelText={"Indirizzo immobile"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"}
                                                        persistingValidationText={false}
                                                        validationMark={false}
                                                        defaultValue={""}
                                                        isMandatory={false}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={setValidation}
                                                        inputProps={{type: "text"}}/>
                                    </Col>
                                </Row>
                            </Col>
                            <Col xl={8}>
                                <Row>
                                    <Col md={3}>
                                        <ValidatedInput name={"targetHouseLandRegistrySheet"}
                                                        namePrefix={"voucherSelectSearch_"}
                                                        labelText={"Foglio"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"}
                                                        persistingValidationText={false}
                                                        validationMark={false}
                                                        defaultValue={""}
                                                        isMandatory={false}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={setValidation}
                                                        inputProps={{type: "text"}}/>
                                    </Col>
                                    <Col md={3}>
                                        <ValidatedInput name={"targetHouseLandRegistryMap"}
                                                        namePrefix={"voucherSelectSearch_"}
                                                        labelText={"Mappale"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"}
                                                        persistingValidationText={false}
                                                        validationMark={false}
                                                        defaultValue={""}
                                                        isMandatory={false}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={setValidation}
                                                        inputProps={{type: "text"}}/>
                                    </Col>
                                    <Col md={3}>
                                        <ValidatedInput name={"targetHouseLandRegistrySubaltern"}
                                                        namePrefix={"voucherSelectSearch_"}
                                                        labelText={"Subalterno"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"}
                                                        persistingValidationText={false}
                                                        validationMark={false}
                                                        defaultValue={""}
                                                        isMandatory={false}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={setValidation}
                                                        inputProps={{type: "text"}}/>
                                    </Col>
                                    <Col md={3}>
                                        <ValidatedInput name={"targetHouseLandRegistryCategory"}
                                                        namePrefix={"voucherSelectSearch_"}
                                                        labelText={"Categoria"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"}
                                                        persistingValidationText={false}
                                                        validationMark={false}
                                                        defaultValue={""}
                                                        isMandatory={false}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={setValidation}
                                                        inputProps={{type: "text"}}/>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>

                        {/*
        vehicleId,
        vehiclePlate,
        vehicleModel,
        vehicleBrand,
        */}
                        <p className={"mb-4"}><strong>Filtra per veicolo associato</strong></p>
                        <Row>
                            <Col xl={6}>
                                <Row>
                                    <Col md={6}>
                                        <ValidatedInput name={"vehicleId"} namePrefix={"voucherSelectSearch_"}
                                                        labelText={"ID veicolo"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"}
                                                        persistingValidationText={false}
                                                        validationMark={false}
                                                        defaultValue={""}
                                                        isMandatory={false}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={setValidation}
                                                        inputProps={{type: "number"}}/>
                                    </Col>
                                    <Col md={6}>
                                        <ValidatedInput name={"vehiclePlate"} namePrefix={"voucherSelectSearch_"}
                                                        labelText={"Targa"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"}
                                                        persistingValidationText={false}
                                                        validationMark={false}
                                                        defaultValue={""}
                                                        isMandatory={false}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={setValidation}
                                                        inputProps={{type: "text"}}/>
                                    </Col>
                                </Row>
                            </Col>
                            <Col xl={6}>
                                <Row>
                                    <Col md={6}>
                                        <ValidatedInput name={"vehicleBrand"} namePrefix={"voucherSelectSearch_"}
                                                        labelText={"Marca"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"}
                                                        persistingValidationText={false}
                                                        validationMark={false}
                                                        defaultValue={""}
                                                        isMandatory={false}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={setValidation}
                                                        inputProps={{type: "text"}}/>
                                    </Col>
                                    <Col md={6}>
                                        <ValidatedInput name={"vehicleModel"} namePrefix={"voucherSelectSearch_"}
                                                        labelText={"Modello"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"}
                                                        persistingValidationText={false}
                                                        validationMark={false}
                                                        defaultValue={""}
                                                        isMandatory={false}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={setValidation}
                                                        inputProps={{type: "text"}}/>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                        <Button color={"primary"} type={"submit"} disabled={!valid || loading}
                                className={"mb-4"} icon={true} title={"Cerca"}>
                    <span className={"rounded-icon me-2"}>
                        <Icon icon={"it-search"}/>
                    </span>
                            Cerca
                        </Button>
                    </Form>


                    <hr/>
                    {vouchersList.map((voucherListEntry, index) => (
                        <div key={index}>
                            <Row className={"d-flex align-items-center"}>
                                <Col md={3}>
                                    {isVoucherSelected(voucherListEntry.id) ? (
                                        <Button onClick={() => removeVoucher(voucherListEntry)}
                                                color={"secondary"} icon={true} title={"Rimuovi tagliando"} size={"xs"}>
                                            <span className={"rounded-icon me-2"}>
                                                <Icon icon={"it-minus"}/>
                                            </span>
                                            Rimuovi
                                        </Button>
                                    ) : (
                                        <Button onClick={() => addVoucher(voucherListEntry)}
                                                color={"primary"} icon={true} title={"Associa tagliando"} size={"xs"}>
                                            <span className={"rounded-icon me-2"}>
                                                <Icon icon={"it-plus"}/>
                                            </span>
                                            Associa
                                        </Button>
                                    )}
                                </Col>
                                <Col md={9}>

                                    <p className={"mt-2"}>
                                        <Link to={"/vouchers/list/" + voucherListEntry.id} target={"_blank"}>
                                            ID univoco: {voucherListEntry.id}{": "}
                                            <strong>Numero {voucherListEntry.number}</strong>{" - "}
                                            <strong>{voucherListEntry.currentState}</strong>
                                        </Link>
                                        <br/>
                                        Valido dal{' '}
                                        {new Date(voucherListEntry.validFromDate).toLocaleDateString()}
                                        {' '}al{' '}
                                        {new Date(voucherListEntry.validToDate).toLocaleDateString()}
                                        <br/>
                                        {voucherListEntry.vehicles == null || voucherListEntry.vehicles.length == 0 ? (
                                            <span>Nessun veicolo associato</span>
                                        ) : (
                                            voucherListEntry.vehicles.map((vehicle, index) => (
                                                <span key={index}>
                                                    <Link to={"/vehicles/list/" + vehicle.id} target={"_blank"}>
                                                        <strong>{vehicle.plate}</strong> {vehicle.brand} {vehicle.model}
                                                    </Link>
                                                    {index < voucherListEntry.vehicles.length - 1 && (",")}{' '}
                                                </span>
                                            ))
                                        )}


                                        {/*</Col>*/}
                                        {/*<Col md={6}>*/}
                                        {/*        <p>*/}
                                        {/*    Permesso <i>({voucherListEntry.permit.id})</i>: {voucherListEntry.permit.description}{" "}*/}
                                        {/*            <strong><i>{voucherListEntry.permit.disabled && "Decaduto"}</i></strong>*/}
                                        {/*</p>*/}
                                        {voucherListEntry.applications.length === 0 ? (
                                            <>
                                                Nessuna domanda associata
                                            </>
                                        ) : (
                                            <>
                                                <strong>{voucherListEntry.applications[0].cf}</strong> {voucherListEntry.applications[0].firstname} {voucherListEntry.applications[0].lastname}<br/>
                                                {!allStringsEmpty(voucherListEntry.applications[0].companyName, voucherListEntry.applications[0].companyCF) && (
                                                    <> per {voucherListEntry.applications[0].companyName} {voucherListEntry.applications[0].companyCF}</>
                                                )}<br/>
                                                {voucherListEntry.applications[0].email}<br/>
                                                Protocollo: {voucherListEntry.applications[0].registerNumber} del {new Date(voucherListEntry.applications[0].registerDate).toLocaleDateString()}<br/>
                                                {voucherListEntry.applications[0].targetHousePlace != null && voucherListEntry.applications[0].targetHousePlace.trim() !== "" &&
                                                    <>Riferita
                                                        all'immobile: {voucherListEntry.applications[0].targetHousePlace}{" - "} {voucherListEntry.applications[0].targetHouseLandRegistrySheet}/{voucherListEntry.applications[0].targetHouseLandRegistryMap}/{voucherListEntry.applications[0].targetHouseLandRegistrySubaltern}/{voucherListEntry.applications[0].targetHouseLandRegistryCategory}</>
                                                }

                                            </>
                                        )}
                                        Ultima modifica: {new Date(voucherListEntry.updatedAt).toLocaleString()}
                                    </p>


                                </Col>
                                {/*<Col md={1}>*/}
                                {/*    <Button onClick={() => navigate(`/vehicles/list/${vehicleListEntry.id}`)}*/}
                                {/*            color={"secondary"} icon={true} outline title={"Modifica"}>*/}
                                {/*        <Icon icon={"it-pencil"}/>*/}
                                {/*    </Button>*/}
                                {/*</Col>*/}
                            </Row>
                            <hr/>
                        </div>
                    ))}
                    {vouchersList.length === 0 && (
                        <>
                            <Row>
                                <strong>Nessun risultato</strong>
                            </Row>
                            <hr/>
                        </>
                    )}
                    <AutoPager pageData={pageData} onPageChange={(page) => {
                        setPageData((prevState) => {
                            return {...prevState, currentPage: page}
                        })
                    }}/>
                </Col>
            </Row>


            <LoadingSpinner loading={loading}/>

            <SuccessErrorAlert err={err} succ={null}/>

        </Container>
    )


}
