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
import type {VehicleListApiResponse, VehicleListEntry} from "../../utils/Types.ts";
import {useErrSuccLoad} from "../../hooks/useErrSuccLoad.ts";
import {AutoPager, type PagerPageData} from "../AutoPager.tsx";
import {defaultPOSTRequestInit, fetchApiAsync} from "../../utils/fetching.ts";
import {ValidatedInput} from "./ValidatedInput.tsx";
import {LoadingSpinner} from "../LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../SuccessErrorAlert.tsx";
import {Link} from "react-router";


type ValidatedVehiclesListProps = {
    name: string,
    validationFunc: ValidationFunc,
    validationText: string,
    // persistingValidationText: boolean,
    defaultValue: ValidationSupportedTypes,
    isMandatory: boolean,
    errorMessage: string,
    setNewValidation: SetValidationFunc,
    labelText: string,
    amount: number,
    exactAmount: boolean,
    valueChangedCallback?: (newValue: ValidationSupportedTypes) => void,
}

export function ValidatedVehiclesList(
    {
        name,
        validationFunc,
        validationText,
        // persistingValidationText,
        defaultValue,
        isMandatory,
        errorMessage,
        setNewValidation,
        labelText,
        amount,
        exactAmount,
        valueChangedCallback,
    }: ValidatedVehiclesListProps) {

    const [value, setValue] = useState<number[]>([]);
    const [selectedVehiclesList, setSelectedVehiclesList] = useState<VehicleListEntry[]>([]);

    const [vehiclesList, setVehiclesList] = useState<VehicleListEntry[]>([]);
    const {err, setErr, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);
    const [pageData, setPageData] = useState<PagerPageData>({currentPage: 1, totalPages: 0});
    const [formSearchParams, setFormSearchParams] = useState<ValidatedFormValuesMap>({});
    const [defaultValueAcquired, setDefaultValueAcquired] = useState(false);

    useEffect(() => {
        if (defaultValueAcquired) {
            return;
        }
        if (defaultValue == null ||
            !(defaultValue instanceof Array) ||
            defaultValue.length === 0) {
            return;
        }
        for (const v of defaultValue) {
            if (typeof v !== "number") {
                return;
            }
        }

        const valuesMap = {
            idArr: defaultValue,
        };
        const abort = fetchApiAsync<VehicleListApiResponse>({
            urlFromApiRoot: "/vehicles/byArr",
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(valuesMap)
            },
            callback: (data) => {
                if (data != null && data.vehiclesList != null) {
                    setSelectedVehiclesList(data.vehiclesList);
                    setValue(defaultValue as number[]);
                    setDefaultValueAcquired(true);
                }
            }
        });

        return abort;
    }, [defaultValue, setValue, setSelectedVehiclesList, setErr, setSucc, setLoading,
        defaultValueAcquired, setDefaultValueAcquired]);

    const incrementedValidationFunc = useCallback((value: ValidationSupportedTypes): boolean => {
        const isEmpty = value == null || value === "" ||
            (value instanceof Array ? value.length === 0 : false); //testo per Array perché non posso testare direttamente number[], in questo caso Array vuoto significa campo non impostato
        if (isMandatory && isEmpty) {
            return false;
        }
        if (!isMandatory && isEmpty) {
            return true;
        }
        if (!isEmpty && (value instanceof Array)) { //testo per Array perché non posso testare direttamente number[]
            if (amount === -1) { //-1 senza limite
                return true;
            }
            if (value.length > amount) {
                return false;
            }
            if (exactAmount && value.length !== amount) {
                return false;
            }
            for (const v of value) {
                if (typeof v !== "number") {
                    return false;
                }
            }
        }
        return validationFunc(value);
    }, [isMandatory, amount, exactAmount, validationFunc]);

    const isValid = incrementedValidationFunc(value);
    const labelContent = labelText || titleCase(name);


    const isVehicleSelected = (vehicleId: number) => {
        return value.includes(vehicleId);
    }

    const addVehicle = (vehicle: VehicleListEntry) => {
        if (value.includes(vehicle.id)) {
            return;
        }
        const newValue = [...value];
        newValue.push(vehicle.id);
        setValue(newValue);
        const newVehiclesList = [...selectedVehiclesList];
        newVehiclesList.push(vehicle);
        setSelectedVehiclesList(newVehiclesList);
    }

    const removeVehicle = (vehicle: VehicleListEntry) => {
        if (!value.includes(vehicle.id)) {
            return;
        }
        const newValue = [...value];
        const valueIndexToRemove = newValue.indexOf(vehicle.id);
        newValue.splice(valueIndexToRemove, 1);
        setValue(newValue);
        const newVehiclesList = [...selectedVehiclesList];
        for (const currVehicle of newVehiclesList) {
            if (currVehicle.id === vehicle.id) {
                const vehicleIndexToRemove = newVehiclesList.indexOf(currVehicle);
                newVehiclesList.splice(vehicleIndexToRemove, 1);
                setSelectedVehiclesList(newVehiclesList);
                break;
            }
        }
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
        const abort = fetchApiAsync<VehicleListApiResponse>({
            urlFromApiRoot: "/vehicles/list",
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(valuesMap)
            },
            callback: (data) => {
                if (data != null && data.vehiclesList != null) {
                    setVehiclesList(data.vehiclesList);
                }
                if (data != null && data.pageData != null) {
                    setPageData(data.pageData)
                }
            }
        });
        return abort;
    }, [setErr, setLoading, setSucc, setVehiclesList, formSearchParams, pageData.currentPage, setPageData]);


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

                    {amount === -1 ? (
                        <span>Non ci sono limiti sul numero di veicoli associabili</span>
                    ) : (<>
                        {exactAmount ? (
                            <span>Sono richiesti esattamente {amount} veicoli</span>
                        ) : (
                            <span>Sono ammessi {isMandatory ? "da 1 a" : "al più"} {amount} veicoli</span>
                        )}
                    </>)}

                    <br/>

                    {selectedVehiclesList.length > 0 ? (

                        <List className={"border border-secondary rounded me-1 ps-2"}>
                            {selectedVehiclesList.map((vehicleListEntry, index) => (
                                <ListItem key={index}>
                                    <span>
                                        <Button onClick={() => removeVehicle(vehicleListEntry)}
                                                color={"secondary"} icon={true} size={"xs"} title={"Rimuovi veicolo"}>
                                            <span className={"rounded-icon me-2"}>
                                                <Icon icon={"it-minus"}/>
                                            </span>
                                            Rimuovi
                                        </Button>
                                        <span className={"ms-3"}>
                                            <Link to={"/vehicles/list/" + vehicleListEntry.id} target={"_blank"}>
                                                {vehicleListEntry.id}{": "} <strong>{vehicleListEntry.plate}</strong>
                                            </Link>{" - "}
                                            {vehicleListEntry.brand} {vehicleListEntry.model}
                                        </span>
                                    </span>
                                </ListItem>
                            ))}
                        </List>

                    ) : (
                        <strong>Nessun veicolo associato</strong>
                    )}
                </Col>
                <Col md={7} className={"border border-secondary rounded"}>
                    <h3 className={"mb-4 mt-3"}>
                        Ricerca veicoli
                    </h3>
                    <Form onSubmit={onFormSubmit} className={"mt-4"}>
                        <Row>
                            <Col md={4}>
                                <ValidatedInput name={"idFrom"} namePrefix={"vehicleSelectSearch_"}
                                                labelText={"ID (da)"}
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
                                <ValidatedInput name={"idTo"} namePrefix={"vehicleSelectSearch_"} labelText={"ID (a)"}
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
                                <ValidatedInput name={"plate"} namePrefix={"vehicleSelectSearch_"} labelText={"Targa"}
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
                                <ValidatedInput name={"brand"} namePrefix={"vehicleSelectSearch_"} labelText={"Marca"}
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
                                <ValidatedInput name={"model"} namePrefix={"vehicleSelectSearch_"} labelText={"Modello"}
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

                    {vehiclesList.length > 0 && (
                        <Row>
                            <Col md={3}></Col>
                            <Col md={9}>
                                <p className={"mt-0 mb-0"}>
                                    {"ID: "}
                                    <strong>Targa</strong>{" - "}
                                    Marca Modello{" - "}
                                    Ultima modifica
                                </p>
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
                            </Col>
                        </Row>
                    )}
                    <hr/>
                    {vehiclesList.map((vehicleListEntry, index) => (
                        <div key={index}>
                            <Row className={"mt-2 d-flex align-items-center"}>
                                <Col md={3}>

                                    {isVehicleSelected(vehicleListEntry.id) ? (
                                        <Button onClick={() => removeVehicle(vehicleListEntry)}
                                                color={"secondary"} icon={true} title={"Rimuovi veicolo"}
                                                size={"xs"}>
                                    <span className={"rounded-icon me-2"}>
                                        <Icon icon={"it-minus"}/>
                                    </span>
                                            Rimuovi
                                        </Button>
                                    ) : (
                                        <Button onClick={() => addVehicle(vehicleListEntry)}
                                                color={"primary"} icon={true} title={"Associa veicolo"} size={"xs"}>
                                    <span className={"rounded-icon me-2"}>
                                        <Icon icon={"it-plus"}/>
                                    </span>
                                            Associa
                                        </Button>
                                    )}
                                </Col>
                                <Col md={9}>
                            <p className={"mt-0 mb-0"}>
                                <Link to={"/vehicles/list/" + vehicleListEntry.id} target={"_blank"}>
                                    {vehicleListEntry.id}{": "}<strong>{vehicleListEntry.plate}</strong>
                                </Link>{" - "}
                                {vehicleListEntry.brand} {vehicleListEntry.model}{" - "}
                                {new Date(vehicleListEntry.updatedAt).toLocaleString()}
                                        </p>
                                </Col>
                                {/*<Col md={1} className={""}>*/}
                                {/*    {vehicleListEntry.id}*/}
                                {/*</Col>*/}
                                {/*<Col md={2}>*/}
                                {/*    {vehicleListEntry.plate}*/}
                                {/*</Col>*/}
                                {/*<Col md={2} className={"text-wrap"}>*/}
                                {/*    {vehicleListEntry.brand}*/}
                                {/*</Col>*/}
                                {/*<Col md={3} className={"text-wrap"}>*/}
                                {/*    {vehicleListEntry.model}*/}
                                {/*</Col>*/}
                                {/*<Col md={2}>*/}
                                {/*    {isVehicleSelected(vehicleListEntry.id) ? (*/}
                                {/*        <Button onClick={() => removeVehicle(vehicleListEntry)}*/}
                                {/*                color={"secondary"} icon={true} title={"Rimuovi veicolo"}>*/}
                                {/*            <span className={"rounded-icon me-2"}>*/}
                                {/*                <Icon icon={"it-minus"}/>*/}
                                {/*            </span>*/}
                                {/*            Rimuovi*/}
                                {/*        </Button>*/}
                                {/*    ) : (*/}
                                {/*        <Button onClick={() => addVehicle(vehicleListEntry)}*/}
                                {/*                color={"primary"} icon={true} title={"Associa veicolo"}>*/}
                                {/*            <span className={"rounded-icon me-2"}>*/}
                                {/*                <Icon icon={"it-plus"}/>*/}
                                {/*            </span>*/}
                                {/*            Associa*/}
                                {/*        </Button>*/}
                                {/*    )}*/}
                                {/*</Col>*/}

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
                    {vehiclesList.length === 0 && (
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

            {/*<Button className={"mb-4 me-2"} onClick={() => navigate(`/vehicles/list/new`)}*/}
            {/*        color={"primary"} icon={true} title={"Aggiungi nuovo veicolo"}>*/}
            {/*            <span className={"rounded-icon me-2"}>*/}
            {/*                <Icon icon={"it-plus"}/>*/}
            {/*            </span>*/}
            {/*    Nuovo*/}
            {/*</Button>*/}


            <LoadingSpinner loading={loading}/>

            <SuccessErrorAlert err={err} succ={null}/>

        </Container>
    )


}
