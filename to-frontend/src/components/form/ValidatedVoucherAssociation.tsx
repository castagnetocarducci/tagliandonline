import {
    type SetValidationFunc,
    useValidateFormInput,
    type ValidatedFormValuesMap,
    type ValidationFunc,
    type ValidationSupportedTypes
} from "../../hooks/useValidateFormInput.ts";
import {type FormEvent, type FormEventHandler, useCallback, useEffect, useState} from "react";
import {titleCase} from "../../utils/StringUtils.ts";
import {Button, Col, Container, Form, Icon, List, ListItem, Row} from "design-react-kit";
import type {VoucherByIDApiResponse, VoucherListApiResponse, VoucherListEntry} from "../../utils/Types.ts";
import {useErrSuccLoad} from "../../hooks/useErrSuccLoad.ts";
import {AutoPager, type PagerPageData} from "../AutoPager.tsx";
import {defaultGETRequestInit, defaultPOSTRequestInit, fetchApiAsync} from "../../utils/fetching.ts";
import {ValidatedInput} from "./ValidatedInput.tsx";
import {LoadingSpinner} from "../LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../SuccessErrorAlert.tsx";


type ValidatedVehiclesListProps = {
    name: string,
    createName: string,
    updateName: string,
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
        validationFunc,
        validationText,
        defaultValue,
        isMandatory,
        errorMessage,
        setNewValidation,
        labelText,
        valueChangedCallback,
    }: ValidatedVehiclesListProps) {

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


    const isVoucherSelected = (vehicleId: number) => {
        return value === vehicleId;
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

                        <Row>
                            <Col md={6}>
                                <Button onClick={() => removeVoucher(selectedVoucher)}
                                        color={"secondary"} icon={true} size={"xs"} title={"Rimuovi tagliando"}>
                                            <span className={"rounded-icon me-2"}>
                                                <Icon icon={"it-minus"}/>
                                            </span>
                                    Rimuovi
                                </Button>
                                <span className={"mt-2"}>
                                    ID univoco: {selectedVoucher.id}{": "}
                                    <strong>Numero {selectedVoucher.number}</strong>
                                    <br/>
                                    <strong>Numero {selectedVoucher.currentState}</strong>
                                </span>

                                <p>
                                    Valido dal
                                    {new Date(selectedVoucher.validFromDate).toLocaleDateString()}
                                    al{' '}
                                    {new Date(selectedVoucher.validToDate).toLocaleDateString()}
                                </p>
                                <p>
                                    Veicoli: <br/>
                                    {selectedVoucher.vehicles.map((vehicle, index) => (
                                        <h5 key={index}>
                                            <strong>{vehicle.plate}</strong>: {vehicle.brand} {vehicle.model}
                                        </h5>
                                    ))}
                                </p>
                            </Col>
                            <Col md={6}>
                                <p>
                                    Permesso <small className="text-muted">{selectedVoucher.permit.id}</small> per {selectedVoucher.permit.description}
                                </p>
                                <p>
                                    {selectedVoucher.permit.disabled && "Decaduto"}
                                    Veicoli utilizzabili
                                    contemporaneamente: {selectedVoucher.permit.simultaneousPlatesAmount}
                                    Numero targhe autorizzabili: {selectedVoucher.permit.applicationPlatesAmount}
                                </p>
                            </Col>

                        </Row>


                    ) : (
                        <strong>Nessun tagliando associato</strong>
                    )}
                </Col>
                <Col md={7} className={"border border-secondary rounded"}>
                    <h3 className={"mb-4 mt-3"}>
                        Ricerca veicoli
                    </h3>
                    <Form onSubmit={onFormSubmit} className={"mt-4"}>
                        <Row>
                            <Col md={4}>
                                <ValidatedInput name={"idFrom"} labelText={"ID (da)"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={""}
                                                isMandatory={false}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "number"}}/>
                            </Col>
                            <Col md={4}>
                                <ValidatedInput name={"idTo"} labelText={"ID (a)"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={""}
                                                isMandatory={false}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "number"}}/>
                            </Col>
                            <Col md={4}>
                                <ValidatedInput name={"plate"} labelText={"Targa"}
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
                            <Col md={6}>
                                <ValidatedInput name={"brand"} labelText={"Marca"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={""}
                                                isMandatory={false}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                            <Col md={6}>
                                <ValidatedInput name={"model"} labelText={"Modello"}
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
                        <Button color={"primary"} type={"submit"} disabled={!valid || loading}
                                className={"mb-4"} icon={true} title={"Cerca"}>
                    <span className={"rounded-icon me-2"}>
                        <Icon icon={"it-search"}/>
                    </span>
                            Cerca
                        </Button>
                    </Form>

                    {vouchersList.length > 0 && (
                        <Row>
                    <span className={"ms-3"}>
                        {"ID: "}
                        <strong>Targa</strong>{" - "}
                        Marca Modello{" - "}
                        Ultima modifica
                    </span>
                            {/*<Col md={1}>*/}
                            {/*    <strong>#</strong>*/}
                            {/*</Col>*/}
                            {/*<Col md={2}>*/}
                            {/*    <strong>Targa</strong>*/}
                            {/*</Col>*/}
                            {/*<Col md={2}>*/}
                            {/*    <strong>Marca</strong>*/}
                            {/*</Col>*/}
                            {/*<Col md={3}>*/}
                            {/*    <strong>Modello</strong>*/}
                            {/*</Col>*/}
                            {/*<Col md={2}>*/}
                            {/*    <strong>Modifica</strong>*/}
                            {/*</Col>*/}
                        </Row>
                    )}
                    <hr/>
                    {vouchersList.map((voucherListEntry, index) => (
                        <div key={index}>
                            <Row className={"mt-2 d-flex align-items-center"}>
                                <span>
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
                                    <span className={"ms-3"}>
                                        {voucherListEntry.id}{": "}
                                        <strong>{voucherListEntry.plate}</strong>{" - "}
                                        {voucherListEntry.brand} {voucherListEntry.model}{" - "}
                                        {new Date(voucherListEntry.updatedAt).toLocaleString()}
                                    </span>
                                </span>

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
