import {
    type SetValidationFunc,
    useValidateFormInput,
    type ValidatedFormValuesMap,
    type ValidationFunc,
    type ValidationSupportedTypes
} from "../../hooks/useValidateFormInput.ts";
import {type FormEvent, type FormEventHandler, useCallback, useEffect, useState} from "react";
import {titleCase} from "../../utils/StringUtils.ts";
import {Button, Col, Form, Icon, Row} from "design-react-kit";
import type {
    InspectionAvailableOptionsApiResponse,
    PermitListEntry, VoucherByIDApiResponse,
    VoucherListApiResponse,
    VoucherListEntry
} from "../../utils/Types.ts";
import {useErrSuccLoad} from "../../hooks/useErrSuccLoad.ts";
import {AutoPager, type PagerPageData} from "../AutoPager.tsx";
import {defaultGETRequestInit, defaultPOSTRequestInit, fetchApiAsync} from "../../utils/fetching.ts";
import {ValidatedInput} from "./ValidatedInput.tsx";
import {LoadingSpinner} from "../LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../SuccessErrorAlert.tsx";
import {Link} from "react-router";
import {type SelectOption, ValidatedSelect} from "./ValidatedSelect.tsx";
import {Scanner} from "@yudiel/react-qr-scanner";
import type {IDetectedBarcode} from "@yudiel/react-qr-scanner/dist/types/IDetectedBarcode";
import {allStringsEmpty} from "../../utils/CommonFunctions.ts";


type ValidatedVoucherVehicleSelectionListProps = {
    selectedVoucherName: string,
    selectedVehicleName: string,
    validationFunc: ValidationFunc,
    validationText: string,
    isMandatory: boolean,
    errorMessage: string,
    setNewValidation: SetValidationFunc,
    labelText: string,
    resetTrigger: boolean
}

type SelectableVehicle = {
    id: number,
    plate: string,
    brand: string,
    model: string,
}

export function ValidatedVoucherVehicleSelection(
    {
        selectedVoucherName,
        selectedVehicleName,
        validationFunc,
        validationText,
        isMandatory,
        errorMessage,
        setNewValidation,
        labelText,
        resetTrigger,
    }: ValidatedVoucherVehicleSelectionListProps) {

    const [selectedVoucherValue, setSelectedVoucherValue] = useState<number | null>(null);
    const [selectedVoucher, setSelectedVoucher] = useState<VoucherListEntry | null>(null);
    const [selectedVehicleValue, setSelectedVehicleValue] = useState<number | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<SelectableVehicle | null>(null);

    const [vouchersList, setVouchersList] = useState<VoucherListEntry[]>([]);
    const {err, setErr, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);
    const [pageData, setPageData] = useState<PagerPageData>({currentPage: 1, totalPages: 0});
    const [formSearchParams, setFormSearchParams] = useState<ValidatedFormValuesMap>({});
    const [resetTriggered, setResetTriggered] = useState<boolean>(true);
    const [cameraEnabled, setCameraEnabled] = useState<boolean>(false);

    const [permitsList, setPermitsList] = useState<PermitListEntry[]>([]);


    useEffect(() => {
        if (resetTrigger === resetTriggered) {
            return;
        }
        const executeReset = async () => {
            setResetTriggered(resetTrigger);
            setSelectedVoucherValue(null);
            setSelectedVoucher(null);
            setSelectedVehicleValue(null);
            setSelectedVehicle(null);
        }
        executeReset();
    }, [resetTrigger, resetTriggered]);

    useEffect(() => {
        const abort = fetchApiAsync<InspectionAvailableOptionsApiResponse>({
            urlFromApiRoot: "/inspections/availableOptions",
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

    const isValid = incrementedValidationFunc(selectedVoucherValue) && incrementedValidationFunc(selectedVehicleValue);
    const labelContent = labelText || titleCase(selectedVoucherName + " - " + selectedVehicleName);


    const isVoucherSelected = (voucherId: number) => {
        return selectedVoucherValue === voucherId;
    }

    const selectVoucher = (voucher: VoucherListEntry) => {
        if (selectedVoucherValue === voucher.id) {
            return;
        }
        if (selectedVehicle != null) {
            if (voucher.vehicles != null && voucher.vehicles.length > 0) {
                if (voucher.vehicles.find((vehicle) => vehicle.id === selectedVehicle.id) == null) {
                    setSelectedVehicle(null);
                }
            } else {
                setSelectedVehicle(null);
            }
        }
        setSelectedVoucherValue(voucher.id);
        setSelectedVoucher(voucher);
    }

    const removeVoucher = (voucher: VoucherListEntry) => {
        if (selectedVoucherValue !== voucher.id) {
            return;
        }
        setSelectedVoucherValue(null);
        setSelectedVoucher(null);
        setSelectedVehicle(null);
        setSelectedVehicle(null);
    }


    const isVehicleSelected = (vehicleId: number) => {
        return selectedVehicleValue === vehicleId;
    }

    const selectVehicle = (vehicle: SelectableVehicle) => {
        if (selectedVehicleValue === vehicle.id) {
            return;
        }
        if (selectedVoucher != null) {
            if (selectedVoucher.vehicles != null && selectedVoucher.vehicles.length > 0) {
                if (selectedVoucher.vehicles.find((v) => v.id === vehicle.id) != null) {
                    setSelectedVehicleValue(vehicle.id);
                    setSelectedVehicle(vehicle);
                }
            }
        }
    }

    const removeVehicle = (vehicle: SelectableVehicle) => {
        console.log(selectedVehicleValue, vehicle.id);
        if (selectedVehicleValue !== vehicle.id) {
            return;
        }
        setSelectedVehicle(null);
        setSelectedVehicleValue(null);
    }


    // const onParameterChange = (newValue: string) => {
    //     setValue(newValue);
    // }

    useEffect(() => {
        setNewValidation(selectedVoucherName, {
            value: selectedVoucherValue,
            errorMessage: errorMessage,
            validateFunc: incrementedValidationFunc,
        });
    }, [errorMessage, incrementedValidationFunc, isMandatory, selectedVoucherName, setNewValidation, validationFunc, selectedVoucherValue]);


    useEffect(() => {
        setNewValidation(selectedVehicleName, {
            value: selectedVehicleValue,
            errorMessage: errorMessage,
            validateFunc: incrementedValidationFunc,
        });
    }, [errorMessage, incrementedValidationFunc, isMandatory, selectedVehicleName, setNewValidation, validationFunc, selectedVehicleValue]);


    const onSearchVoucherFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();
        if (!valid) {
            executeValidation(true);
            return;
        }
        const formValues = getValueObject();
        if (formValues["id"] != null) {
            formValues["idFrom"] = formValues["id"];
            formValues["idTo"] = formValues["id"];
        }
        if (formValues["number"] != null) {
            formValues["numberFrom"] = formValues["number"];
            formValues["numberTo"] = formValues["number"];
        }

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

    const onQrCodeScanned = (results: IDetectedBarcode[]) => {
        if (results == null || loading) {
            return;
        }
        for (const result of results) {
            if (result.rawValue == null) {
                continue;
            }
            const voucherIdStrValue = result.rawValue.trim().split("/").at(-1);
            if (voucherIdStrValue == null || voucherIdStrValue.trim().length === 0 || isNaN(parseInt(voucherIdStrValue))) {
                continue;
            }
            const voucherId = parseInt(voucherIdStrValue);
            if (voucherId <= 0) {
                continue;
            }
            fetchApiAsync<VoucherByIDApiResponse>({
                urlFromApiRoot: "/vouchers/byID/" + voucherId,
                errSuccLoading: {setErr, setSucc, setLoading},
                requestInit: {...defaultGETRequestInit},
                callback: (data) => {
                    console.log(data);
                    if (data != null && data.voucher != null) {
                        selectVoucher(data.voucher);
                    }
                }
            });
            setCameraEnabled(false);
        }
    }


    return (
        <>
            <h2>{labelContent}</h2>

            <Row className={"mt-2"}>
                {selectedVoucher == null && (
                    <>
                        <h3 className={"mb-4 mt-3"}>
                            Ricerca tagliandi
                        </h3>
                        <Form onSubmit={onSearchVoucherFormSubmit} className={"mt-4"}>
                            <Row>
                                <Col md={6}>
                                    <Row>
                                        <Col xs={6}>
                                            <ValidatedInput name={"id"} namePrefix={"voucherSelectSearch_"}
                                                            labelText={"ID univoco"}
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
                                        <Col xs={6}>
                                            <ValidatedInput name={"number"} namePrefix={"voucherSelectSearch_"}
                                                            labelText={"Numero"}
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


                                <Col md={6}>
                                    <ValidatedSelect name={"permitId"} validationFunc={() => true}
                                                     validationText={"Campo obbligatorio"}
                                                     persistingValidationText={false}
                                                     defaultValue={""}
                                                     isMandatory={false}
                                                     errorMessage={"Compilare i campi obbligatori"}
                                                     setNewValidation={setValidation}
                                                     labelText={"Permesso associato"}
                                                     options={selectablePermits}/>
                                </Col>

                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Row>
                                        <Col xs={6}>
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
                                        <Col xs={6}>
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

                            <Row>
                                <Col xl={6}>
                                    <Row>
                                        <Col xs={6}>
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
                                        <Col xs={6}>
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
                                        <Col xs={6}>
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
                                        <Col xs={6}>
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
                            <Button color={"primary"} type={"button"} disabled={!valid || loading}
                                    className={"mb-4 ms-4"} icon={true} title={"Scansiona QR"}
                                    outline={cameraEnabled}
                                    onClick={() => setCameraEnabled(!cameraEnabled)}>
                                    <span className={"rounded-icon me-2"}>
                                        <Icon icon={"it-camera"}/>
                                    </span>
                                {cameraEnabled ? "Disattiva" : "Abilita"} scansione QR
                            </Button>
                        </Form>

                        {cameraEnabled && (
                            <Row className={"mb-4"}>
                                <Scanner
                                    formats={['qr_code']}
                                    sound={true}
                                    onScan={onQrCodeScanned}
                                    components={{
                                        torch: true,
                                        zoom: true,
                                        finder: true,
                                        tracker: (detectedCodes, ctx) => {
                                            detectedCodes.forEach((detectedCode) => {
                                                const {cornerPoints} = detectedCode;
                                                // outline
                                                ctx.fillStyle = '#FF0000';
                                                ctx.strokeStyle = '#0066cc';
                                                ctx.lineWidth = 4;
                                                ctx.beginPath();
                                                for (let i = 0; i < cornerPoints.length; i++) {
                                                    if (i === 0) {
                                                        ctx.moveTo(cornerPoints[i].x, cornerPoints[i].y);
                                                    } else {
                                                        ctx.lineTo(cornerPoints[i].x, cornerPoints[i].y);
                                                    }
                                                    if (i === cornerPoints.length - 1) {
                                                        ctx.lineTo(cornerPoints[0].x, cornerPoints[0].y);
                                                    }
                                                    ctx.stroke();
                                                }
                                            });
                                        }
                                    }}
                                    constraints={{
                                        facingMode: 'environment', // Use rear camera
                                    }}
                                />
                            </Row>
                        )}

                        <h3>Scegli tagliando</h3>
                        {!isValid && (
                            <span style={{color: "#d9364f"}}>
                            {validationText}
                                <br/>
                            </span>
                        )}
                        <hr/>
                        {vouchersList.map((voucherListEntry, index) => (
                            <div key={index}>
                                <Row className={"d-flex align-items-center"}>
                                    <Col sm={4}>
                                        {isVoucherSelected(voucherListEntry.id) ? (
                                            <Button onClick={() => removeVoucher(voucherListEntry)}
                                                    color={"secondary"} icon={true} title={"Rimuovi tagliando"}
                                                    size={"xs"}>
                                            <span className={"rounded-icon me-2"}>
                                                <Icon icon={"it-minus"}/>
                                            </span>
                                                Rimuovi
                                            </Button>
                                        ) : (
                                            <Button onClick={() => selectVoucher(voucherListEntry)}
                                                    color={"primary"} icon={true} title={"Seleziona tagliando"}
                                                    size={"xs"}>
                                            <span className={"rounded-icon me-2"}>
                                                <Icon icon={"it-plus"}/>
                                            </span>
                                                Seleziona
                                            </Button>
                                        )}
                                    </Col>
                                    <Col sm={8}>

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
                    </>
                )}

                {selectedVoucher != null && (
                    <>
                        <Row>
                            <Col md={12}>
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
                        <Row>
                            {selectedVoucher.vehicles == null || selectedVoucher.vehicles.length == 0 ? (
                                <span>Nessun veicolo associato al tagliando</span>
                            ) : (
                                <>
                                    <h3>Scegli veicolo</h3>
                                    {!isValid && (
                                        <span style={{color: "#d9364f"}}>
                                        {validationText}<br/>
                                        </span>
                                    )}
                                    <hr/>
                                    {selectedVoucher.vehicles.map((vehicle, index) => (
                                        <div key={vehicle.id || index}>
                                            <Row className={"mt-2 d-flex align-items-center"}>
                                                <Col sm={4}>

                                                    {isVehicleSelected(vehicle.id) ? (
                                                        <Button onClick={() => removeVehicle(vehicle)}
                                                                color={"secondary"} icon={true}
                                                                title={"Rimuovi veicolo"}
                                                                size={"xs"}>
                                    <span className={"rounded-icon me-2"}>
                                        <Icon icon={"it-minus"}/>
                                    </span>
                                                            Rimuovi
                                                        </Button>
                                                    ) : (
                                                        <Button onClick={() => selectVehicle(vehicle)}
                                                                color={"primary"} icon={true}
                                                                title={"Seleziona veicolo"} size={"xs"}>
                                    <span className={"rounded-icon me-2"}>
                                        <Icon icon={"it-plus"}/>
                                    </span>
                                                            Seleziona
                                                        </Button>
                                                    )}
                                                </Col>
                                                <Col sm={8}>
                                                    <p className={"mt-0 mb-0"}>
                                                        <Link to={"/vehicles/list/" + vehicle.id} target={"_blank"}>
                                                            {vehicle.id}{": "}<strong>{vehicle.plate}</strong>
                                                        </Link>{" - "}
                                                        {vehicle.brand} {vehicle.model}
                                                    </p>
                                                </Col>
                                            </Row>
                                            <hr/>
                                        </div>
                                    ))}
                                </>
                            )}


                        </Row>

                    </>
                )}


            </Row>


            <LoadingSpinner loading={loading}/>

            <SuccessErrorAlert err={err} succ={null}/>


        </>
    )


}
