import {Link, useNavigate, useSearchParams} from "react-router";
import {type FormEvent, type FormEventHandler, useEffect, useState} from "react";
import type {
    ApplicationAvailableOptionsApiResponse,
    ApplicationListApiResponse,
    ApplicationListEntry,
    ApplicationOutcomeListEntry,
    ApplicationTypeListEntry,
    PermitListEntry
} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {
    defaultGETRequestInit,
    defaultPOSTRequestInit,
    fetchApiAsync,
    fromSearchParamsToValuesMap,
    fromValuesMapToSearchParams
} from "../../../utils/fetching.ts";
import {Button, Col, Container, Form, Icon, Row} from "design-react-kit";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";
import {ValidatedInput} from "../../../components/form/ValidatedInput.tsx";
import {useValidateFormInput} from "../../../hooks/useValidateFormInput.ts";
import {AutoPager, type PagerPageData} from "../../../components/AutoPager.tsx";
import {validateEmail} from "../../../utils/CommonFunctions.ts";
import {type SelectOption, ValidatedSelect} from "../../../components/form/ValidatedSelect.tsx";

export function ApplicationsList() {
    const navigate = useNavigate();
    const [applicationsList, setApplicationsList] = useState<ApplicationListEntry[]>([]);
    const {err, setErr, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);
    const [searchParams, setSearchParams] = useSearchParams();
    const [pageData, setPageData] = useState<PagerPageData>({currentPage: 1, totalPages: 0});
    const [applicationTypeList, setApplicationTypeList] = useState<ApplicationTypeListEntry[]>([]);
    const [applicationOutcomeList, setApplicationOutcomeList] = useState<ApplicationOutcomeListEntry[]>([]);
    const [permitsList, setPermitsList] = useState<PermitListEntry[]>([]);

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
        const urlSearchParams = fromValuesMapToSearchParams(formValues);
        setPageData((prevState) => {
            return {...prevState, currentPage: 1}
        });
        setSearchParams(urlSearchParams);
    }

    useEffect(() => {
        const valuesMap = fromSearchParamsToValuesMap(searchParams);
        valuesMap["page"] = pageData.currentPage;
        const abort = fetchApiAsync<ApplicationListApiResponse>({
            urlFromApiRoot: "/applications/list",
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(valuesMap)
            },
            callback: (data) => {
                if (data != null && data.applicationsList != null) {
                    setApplicationsList(data.applicationsList);
                }
                if (data != null && data.pageData != null) {
                    setPageData(data.pageData)
                }
            }
        });
        return abort;
    }, [setErr, setLoading, setSucc, setApplicationsList, searchParams, pageData.currentPage, setPageData]);

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

    return (
        <Container>
            <h1 className={"mb-4"}>Domande</h1>
            <Button className={"mb-4 me-2"} onClick={() => navigate(`/applications/list/new`)}
                    color={"primary"} icon={true} title={"Aggiungi nuova domanda"}>
                        <span className={"rounded-icon me-2"}>
                            <Icon icon={"it-plus"}/>
                        </span>
                Nuovo
            </Button>

            <h2 className={"mb-4"}>
                Filtri
            </h2>
            <Form onSubmit={onFormSubmit} className={"mt-4"}>
                {/*
        idFrom,
        idTo,
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
        permitId,
        outcomeId,
        typeId,
        voucherId,
        voucherNumber,
        emailTo,
        vehicleId,
        vehiclePlate,
        vehicleModel,
        vehicleBrand,
        page
        */}
                <Row>
                    <Col md={2}>
                        <ValidatedInput name={"idFrom"} labelText={"ID (da)"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("idFrom") ?? ""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "number"}}/>
                    </Col>
                    <Col md={2}>
                        <ValidatedInput name={"idTo"} labelText={"ID (a)"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("idTo") ?? ""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "number"}}/>
                    </Col>
                </Row>
                <Row>
                    <Col md={4}>
                        <ValidatedSelect name={"permitId"} validationFunc={() => true}
                                         validationText={"Campo obbligatorio"} persistingValidationText={false}
                                         defaultValue={searchParams.get("permitId") ?? ""}
                                         isMandatory={false}
                                         errorMessage={"Compilare i campi obbligatori"}
                                         setNewValidation={setValidation}
                                         labelText={"Permesso associato"}
                                         options={selectablePermits}/>
                    </Col>
                    <Col md={4}>
                        <ValidatedSelect name={"typeId"} validationFunc={() => true}
                                         validationText={"Campo obbligatorio"} persistingValidationText={false}
                                         defaultValue={searchParams.get("typeId") ?? ""}
                                         isMandatory={false}
                                         errorMessage={"Compilare i campi obbligatori"}
                                         setNewValidation={setValidation}
                                         labelText={"Tipo"}
                                         options={selectableApplicationTypes}/>
                    </Col>
                    <Col md={4}>
                        <ValidatedSelect name={"outcomeId"} validationFunc={() => true}
                                         validationText={"Campo obbligatorio"} persistingValidationText={false}
                                         defaultValue={searchParams.get("outcomeId") ?? ""}
                                         isMandatory={false}
                                         errorMessage={"Compilare i campi obbligatori"}
                                         setNewValidation={setValidation}
                                         labelText={"Esito"}
                                         options={selectableApplicationOutcomes}/>
                    </Col>
                </Row>

                <Row>
                    <Col md={3}>
                        <ValidatedInput name={"requestDate"} labelText={"Data richiesta"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("requestDate") ?? ""}
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
                                        defaultValue={searchParams.get("outcomeDate") ?? ""}
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
                                        defaultValue={searchParams.get("registerNumber") ?? ""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "number"}}/>
                    </Col>
                    <Col md={3}>
                        <ValidatedInput name={"registerDate"} labelText={"Data protocollo"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("registerDate") ?? ""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "date"}}/>
                    </Col>
                </Row>

                <p className={"mb-4"}><strong>Filtra per dati intestatario</strong></p>
                <Row>
                    <Col md={3}>
                        <ValidatedInput name={"cf"} labelText={"Codice fiscale"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("cf") ?? ""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "text"}}/>
                    </Col>
                    <Col md={2}>
                        <ValidatedInput name={"firstname"} labelText={"Nome"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("firstname") ?? ""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "text"}}/>
                    </Col>
                    <Col md={2}>
                        <ValidatedInput name={"lastname"} labelText={"Cognome"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("lastname") ?? ""}
                                        isMandatory={false}
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
                                        defaultValue={searchParams.get("email") ?? ""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "text"}}/>
                    </Col>
                </Row>
                <Row>
                    <Col md={5}>
                        <ValidatedInput name={"emailTo"} labelText={"Mail inviate a questo destinatario"}
                                        validationFunc={validateEmail}
                                        validationText={"Inserisci un indirizzo email valido"}
                                        persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("emailTo") ?? ""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "text"}}/>
                    </Col>
                </Row>
                <Row>
                    <Col md={3}>
                        <ValidatedInput name={"birthDate"} labelText={"Data di nascita"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("birthDate") ?? ""}
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
                                        defaultValue={searchParams.get("birthCity") ?? ""}
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
                                        defaultValue={searchParams.get("residencePlace") ?? ""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "text"}}/>
                    </Col>

                </Row>

                <p className={"mb-4"}><strong>Filtra per immobile di riferimento</strong></p>

                <Row>
                    <Col md={4}>
                        <ValidatedInput name={"targetHousePlace"} labelText={"Indirizzo immobile"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("targetHousePlace") ?? ""}
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
                                        defaultValue={searchParams.get("targetHouseLandRegistrySheet") ?? ""}
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
                                        defaultValue={searchParams.get("targetHouseLandRegistryMap") ?? ""}
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
                                        defaultValue={searchParams.get("targetHouseLandRegistrySubaltern") ?? ""}
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
                                        defaultValue={searchParams.get("targetHouseLandRegistryCategory") ?? ""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "text"}}/>
                    </Col>
                </Row>

                <p className={"mb-4"}><strong>Filtra per tagliando associato</strong></p>
                <Row>
                    <Col md={2}>
                        <ValidatedInput name={"voucherId"} labelText={"ID tagliando"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("voucherId") ?? ""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "number"}}/>
                    </Col>
                    <Col md={2}>
                        <ValidatedInput name={"voucherNumber"} labelText={"Numero"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("voucherNumber") ?? ""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "number"}}/>
                    </Col>
                </Row>

                <p className={"mb-4"}><strong>Filtra per veicolo associato</strong></p>
                <Row>
                    <Col md={2}>
                        <ValidatedInput name={"vehicleId"} labelText={"ID veicolo"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"}
                                        persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("vehicleId") ?? ""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "number"}}/>
                    </Col>
                    <Col md={2}>
                        <ValidatedInput name={"vehiclePlate"} labelText={"Targa"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"}
                                        persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("vehiclePlate") ?? ""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "text"}}/>
                    </Col>
                    <Col md={3}>
                        <ValidatedInput name={"vehicleBrand"} labelText={"Marca"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"}
                                        persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("vehicleBrand") ?? ""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "text"}}/>
                    </Col>
                    <Col md={3}>
                        <ValidatedInput name={"vehicleModel"} labelText={"Modello"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"}
                                        persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("vehicleModel") ?? ""}
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

            {applicationsList.length > 0 && (
                <Row>
                    <Col md={1}>
                        <strong>#</strong>
                    </Col>
                    <Col md={1}>
                        <strong>Nominativo</strong>
                    </Col>
                    <Col md={1}>
                        <strong>Tipo</strong>
                    </Col>
                    <Col md={1}>
                        <strong>Esito</strong>
                    </Col>
                    <Col md={1}>
                        <strong>Permesso</strong>
                    </Col>
                    <Col md={1}>
                        <strong>Protocollo</strong>
                    </Col>
                    <Col md={1}>
                        <strong>Veicoli</strong>
                    </Col>
                    <Col md={1}>
                        <strong>Tagliando</strong>
                    </Col>
                    <Col md={1}>
                        <strong>Indirizzo e Catasto</strong>
                    </Col>
                    <Col md={1}>
                        <strong>Email</strong>
                    </Col>
                    <Col md={1}>
                        <strong>Ultimo aggiornamento</strong>
                    </Col>
                    <Col md={1}>
                        <strong>Modifica</strong>
                    </Col>
                </Row>
            )}
            <hr/>
            {applicationsList.map((applicationListEntry, index) => (
                <div key={index}>
                    <Row className={"mt-2 d-flex align-items-center"}>
                        <Col md={1} className={""}>
                            {applicationListEntry.id}
                        </Col>
                        <Col md={1} className={"text-wrap"}>
                            {applicationListEntry.firstname} {applicationListEntry.lastname}
                        </Col>
                        <Col md={1} className={"text-wrap"}>
                            {applicationListEntry.type.description}
                        </Col>
                        <Col md={1} className={"text-wrap"}>
                            {applicationListEntry.outcome.description}
                        </Col>
                        <Col md={1} className={"text-wrap"}>
                            {applicationListEntry.permit.description}
                        </Col>
                        <Col md={1} className={"text-wrap"}>
                            {applicationListEntry.registerNumber} del {new Date(applicationListEntry.registerDate).toLocaleDateString()}
                        </Col>
                        <Col md={1} className={"text-wrap"}>
                            {applicationListEntry.vehicles.map((vehicle) => vehicle.plate).join(", ")}
                        </Col>
                        <Col md={1} className={"text-wrap"}>
                            {applicationListEntry.voucher == null ? (
                                "non presente"
                            ) : (
                                applicationListEntry.voucher.number + " scadenza " + applicationListEntry.voucher.validToDate
                            )}
                        </Col>
                        <Col md={1} className={"text-wrap"}>
                            {applicationListEntry.targetHousePlace && applicationListEntry.targetHousePlace + " - "}
                            {applicationListEntry.targetHouseLandRegistrySheet && applicationListEntry.targetHouseLandRegistrySheet + " "}
                            {applicationListEntry.targetHouseLandRegistryMap && applicationListEntry.targetHouseLandRegistryMap + " "}
                            {applicationListEntry.targetHouseLandRegistrySubaltern && applicationListEntry.targetHouseLandRegistrySubaltern + " "}
                            {applicationListEntry.targetHouseLandRegistryCategory && applicationListEntry.targetHouseLandRegistryCategory + " "}
                        </Col>
                        <Col md={1} className={"text-break text-truncate"}>
                            <Link to={"mailto:" + applicationListEntry.email}>{applicationListEntry.email}</Link>
                        </Col>
                        <Col md={1}>
                            {new Date(applicationListEntry.updatedAt).toLocaleString()}
                        </Col>
                        <Col md={1}>
                            <Button onClick={() => navigate(`/applications/list/${applicationListEntry.id}`)}
                                    color={"secondary"} icon={true} outline title={"Modifica"}>
                                <Icon icon={"it-pencil"}/>
                            </Button>
                        </Col>
                    </Row>
                    <hr/>
                </div>
            ))}
            {applicationsList.length === 0 && (
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

            <LoadingSpinner loading={loading}/>

            <SuccessErrorAlert err={err} succ={null}/>

        </Container>
    )
}