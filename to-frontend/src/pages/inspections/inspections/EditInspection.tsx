import {Link, useNavigate, useParams} from "react-router";
import {type FormEvent, type FormEventHandler, useEffect, useState} from "react";
import type {
    CachedAnomaly,
    DataMessage,
    InspectionAddCheckApiResponse,
    InspectionDetails,
    InspectionPagedDetailsApiResponse
} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {useValidateFormInput, type ValidatedFormValuesMap} from "../../../hooks/useValidateFormInput.ts";
import {defaultGETRequestInit, defaultPOSTRequestInit, fetchApiAsync} from "../../../utils/fetching.ts";
import {
    Accordion,
    AccordionBody,
    AccordionHeader,
    AccordionItem,
    Button,
    Col,
    Container,
    Form,
    GoBack,
    Icon,
    Row,
    TabContainer,
    TabContent,
    TabNav,
    TabNavItem
} from "design-react-kit";
import {ValidatedInput} from "../../../components/form/ValidatedInput.tsx";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";
import {RouterDesignTabLink} from "../../../components/links/RouterDesignTabLink.tsx";
import type {PagerPageData} from "../../../components/AutoPager.tsx";
import {ValidatedVoucherVehicleSelection} from "../../../components/form/ValidatedVoucherVehicleSelection.tsx";

export function EditInspection() {
    const navigate = useNavigate();
    const [inspectionDetails, setInspectionDetails] = useState<InspectionDetails | null>(null);
    const [anomalies, setAnomalies] = useState<CachedAnomaly[]>([]);
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const editVFI = useValidateFormInput(setErr, setSucc);
    const addCheckVFI = useValidateFormInput(setErr, setSucc);
    const urlParams = useParams();
    // const [searchParams, setSearchParams] = useSearchParams();
    const [pageData, setPageData] = useState<PagerPageData>({currentPage: 1, totalPages: 0});
    const [toggleDetailsRefresh, setToggleDetailsRefresh] = useState<boolean>(false);
    const [resetNewCheckFields, setResetNewCheckFields] = useState<boolean>(false);
    const [expandedCheck, setExpandedCheck] = useState<number | null>(null);
    const [expandedAnomaly, setExpandedAnomaly] = useState<number | null>(null);

    useEffect(() => {
        if (urlParams.inspectionID == null || urlParams.inspectionID == "") {
            navigate("/inspections/list", {replace: true});
        }
    }, [navigate, urlParams]);

    useEffect(() => {
        if (urlParams.inspectionID == null || urlParams.inspectionID == "") {
            navigate("/inspections/list", {replace: true});
            return;
        }
        if (urlParams.tab == null || urlParams.tab == "") {
            navigate("/inspections/list/" + urlParams.inspectionID + "/edit", {replace: true});
            return;
        }
        if (urlParams.tab === "checks" && urlParams.tab2 === "new" && inspectionDetails != null && inspectionDetails.currentState !== "In corso") {
            navigate("/inspections/list/" + urlParams.inspectionID + "/checks", {replace: true});
            return;
        }
    }, [anomalies, navigate, urlParams, setExpandedAnomaly, inspectionDetails]);

    //
    // const onSearchFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
    //     e.preventDefault();
    //     if (!valid) {
    //         executeValidation(true);
    //         return;
    //     }
    //     const formValues = getValueObject();
    //     const urlSearchParams = fromValuesMapToSearchParams(formValues);
    //     setPageData((prevState) => {
    //         return {...prevState, currentPage: 1}
    //     });
    //     setSearchParams(urlSearchParams);
    // }

    useEffect(() => {
        // const valuesMap = fromSearchParamsToValuesMap(searchParams);
        const valuesMap: ValidatedFormValuesMap = {};
        valuesMap["page"] = pageData.currentPage;
        const abort = fetchApiAsync<InspectionPagedDetailsApiResponse>({
            urlFromApiRoot: "/inspections/detail/" + urlParams.inspectionID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(valuesMap)
            },
            callback: (data) => {
                if (data != null && data.inspection != null) {
                    setInspectionDetails(data.inspection);
                }
                if (data != null && data.anomalies != null) {
                    setAnomalies(data.anomalies);
                }
                if (data != null && data.pageData != null) {
                    setPageData(data.pageData);
                }
            }
        });
        return abort;
    }, [setErr, setLoading, setSucc, setInspectionDetails, setAnomalies, pageData.currentPage, setPageData, urlParams, toggleDetailsRefresh]); //searchParams


    const onEditFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();
        if (!editVFI.valid) {
            editVFI.executeValidation(true);
            return;
        }
        const formValues = editVFI.getValueObject();
        fetchApiAsync<DataMessage>({
            urlFromApiRoot: "/inspections/edit/" + urlParams.inspectionID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(formValues)
            },
            callback: (data) => {
                if (data != null) {
                    setToggleDetailsRefresh(!toggleDetailsRefresh);
                }
            }
        });
    }

    const onAddCheckFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();
        if (!addCheckVFI.valid) {
            addCheckVFI.executeValidation(true);
            return;
        }
        const formValues = addCheckVFI.getValueObject();
        fetchApiAsync<InspectionAddCheckApiResponse>({
            urlFromApiRoot: "/inspections/addCheck/" + urlParams.inspectionID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(formValues)
            },
            callback: (data) => {
                setResetNewCheckFields(!resetNewCheckFields);
                if (data != null && data.anomaly != null) {
                    setAnomalies((prevState) => [...prevState, data.anomaly]);
                    setExpandedAnomaly(data.anomaly.voucherId);
                    navigate("/inspections/list/" + urlParams.inspectionID + "/anomalies/" + data.id); // /anomalies/checkID
                    return;
                }
                setToggleDetailsRefresh(!toggleDetailsRefresh);
            }
        });
    }

    const deleteCheckSubmit = (checkId: number) => {
        fetchApiAsync<InspectionAddCheckApiResponse>({
            urlFromApiRoot: "/inspections/deleteCheck/" + checkId,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultGETRequestInit
            },
            callback: (data) => {
                if (data != null) {
                    navigate("/inspections/list/" + urlParams.inspectionID + "/checks/");
                    return;
                }
                setToggleDetailsRefresh(!toggleDetailsRefresh);
            }
        });
    }

    const canReopen: boolean = inspectionDetails == null ? false : inspectionDetails.currentState === "Conclusa";

    return (
        <Container>
            <h1>Gestione ispezione</h1>

            <TabContainer defaultActiveKey="inspections">
                <TabNav>
                    <TabNavItem>
                        <RouterDesignTabLink
                            to={"/inspections/list/" + urlParams.inspectionID + "/edit"}> Modifica </RouterDesignTabLink>
                    </TabNavItem>
                    <TabNavItem>
                        <RouterDesignTabLink
                            to={"/inspections/list/" + urlParams.inspectionID + "/checks"}> Rilievi </RouterDesignTabLink>
                    </TabNavItem>
                    <TabNavItem>
                        <RouterDesignTabLink
                            to={"/inspections/list/" + urlParams.inspectionID + "/anomalies"}> Anomalie </RouterDesignTabLink>
                    </TabNavItem>
                </TabNav>
            </TabContainer>

            <TabContent>
                <Container className={"mt-2"}>
                    <GoBack link>
                        Torna indietro
                    </GoBack>
                    {urlParams.tab === "edit" && inspectionDetails != null && (
                        <>
                            <h2>Modifica ispezione</h2>
                            <Form onSubmit={onEditFormSubmit} className={"mt-4"}>
                                <Row>
                                    <Col lg={1}>
                                        <p><strong>ID</strong><br/>{inspectionDetails.id}</p>
                                    </Col>
                                    <Col lg={2}>
                                        <p><strong>Stato</strong><br/><strong>{inspectionDetails.currentState}</strong>
                                        </p>
                                    </Col>
                                    <Col lg={3}>
                                        <p>
                                            <strong>Avvio</strong><br/>{new Date(inspectionDetails.startDate).toLocaleString()}
                                        </p>
                                    </Col>
                                    <Col lg={3}>
                                        <p>
                                            <strong>Conclusa</strong><br/>{inspectionDetails.endDate == null ? "N/A" : new Date(inspectionDetails.endDate).toLocaleString()}
                                        </p>
                                    </Col>
                                </Row>
                                <Row className={"mt-4"}>
                                    <Col md={6}>
                                        <ValidatedInput name={"description"} labelText={"Descrizione"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"}
                                                        persistingValidationText={false}
                                                        validationMark={false}
                                                        defaultValue={inspectionDetails.description}
                                                        isMandatory={true}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={editVFI.setValidation}
                                                        inputProps={{type: "text"}}/>
                                    </Col>
                                    <Col md={2}>
                                        <ValidatedInput name={canReopen ? "reopen" : "close"}
                                                        validationFunc={() => true}
                                                        validationText={"Campo obbligatorio"}
                                                        persistingValidationText={false}
                                                        validationMark={false} defaultValue={false}
                                                        isMandatory={true}
                                                        errorMessage={"Compilare i campi obbligatori"}
                                                        setNewValidation={editVFI.setValidation}
                                                        labelText={canReopen ? "Riapri" : "Chiudi"}
                                                        inputProps={{type: "checkbox", className: "form-check-input"}}/>

                                        {/*{inspectionDetails.currentState === "Conclusa" ? (*/}
                                        {/*    <Button onClick={() => {}} type={"button"}*/}
                                        {/*            color={"primary"} icon={true} outline={true} title={"Riapri ispezione"}>*/}
                                        {/*        <span className={"rounded-icon me-2"}>*/}
                                        {/*            <Icon icon={"it-restore"}/>*/}
                                        {/*        </span>*/}
                                        {/*        Riapri*/}
                                        {/*    </Button>*/}
                                        {/*) : (*/}
                                        {/*    <Button onClick={() => {}} type={"button"}*/}
                                        {/*            color={"warning"} icon={true} title={"Chiudi ispezione"}>*/}
                                        {/*        <span className={"rounded-icon me-2"}>*/}
                                        {/*            <Icon icon={"it-close"}/>*/}
                                        {/*        </span>*/}
                                        {/*        Chiudi*/}
                                        {/*    </Button>*/}
                                        {/*)}*/}
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={2}>
                                        <Button color={"primary"} type={"submit"}
                                                disabled={!editVFI.valid || loading}> Salva </Button>
                                    </Col>
                                </Row>
                                <LoadingSpinner loading={loading}/>
                                <SuccessErrorAlert err={err} succ={succ}/>
                            </Form>
                        </>
                    )}
                    {urlParams.tab === "checks" && inspectionDetails != null && (
                        <>
                            {urlParams.tab2 === "new" ? (
                                <>
                                    <ValidatedVoucherVehicleSelection
                                        selectedVoucherName={"voucherId"}
                                        selectedVehicleName={"vehicleId"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"}
                                        isMandatory={true}
                                        errorMessage={"Devi scegliere un tagliando e un veicolo"}
                                        setNewValidation={addCheckVFI.setValidation}
                                        labelText={"Nuovo rilievo"}
                                        resetTrigger={resetNewCheckFields}/>
                                    <Form onSubmit={onAddCheckFormSubmit} className={"mt-4"}>
                                        <Row className={"mt-4"}>
                                            <Col md={4}>
                                                <Button color={"primary"} type={"submit"}
                                                        disabled={!addCheckVFI.valid || loading}> Salva </Button>
                                            </Col>
                                        </Row>
                                    </Form>
                                </>
                            ) : (
                                <>
                                    <h2 className={"mb-4"}>Rilievi</h2>
                                    {inspectionDetails.currentState === "In corso" && (
                                        <Button className={"mb-4 me-2"}
                                                onClick={() => navigate(`/inspections/list/${inspectionDetails.id}/checks/new`)}
                                                color={"primary"} icon={true} title={"Aggiungi nuovo rilievo"}>
                                            <span className={"rounded-icon me-2"}>
                                                <Icon icon={"it-plus"}/>
                                            </span>
                                            Nuovo
                                        </Button>
                                    )}

                                    {inspectionDetails.inspectionChecks == null || inspectionDetails.inspectionChecks.length === 0 ? (
                                        <Row>
                                            <strong>Nessuna rilievo</strong>
                                        </Row>
                                    ) : (
                                        <>
                                            <Accordion>
                                                {inspectionDetails.inspectionChecks.map((check, index) => (

                                                    <div key={index}>
                                                        <AccordionItem>
                                                            <AccordionHeader active={expandedCheck === check.id}
                                                                             onToggle={() => setExpandedCheck(expandedCheck === check.id ? null : check.id)}>
                                                                    <span>
                                                                        Rilievo #{check.id}:{" "}
                                                                        tagliando ID {check.voucherHistory.voucherId}{" "}
                                                                        <strong>numero {check.voucherHistory.number}</strong><br/>
                                                                        <strong>{check.vehicleHistory.plate}</strong>{" "}
                                                                        {check.vehicleHistory.model}{" "}
                                                                        {check.vehicleHistory.brand}
                                                                    </span>
                                                            </AccordionHeader>
                                                            <AccordionBody active={expandedCheck === check.id}>
                                                                Tagliando{": "}
                                                                <Link
                                                                    to={"/vouchers/list/" + check.voucherHistory.voucherId}
                                                                    target={"_blank"}>
                                                                    ID univoco: {check.voucherHistory.voucherId}{": "}
                                                                    <strong>Numero {check.voucherHistory.number}</strong>{" - "}
                                                                    <strong>{check.voucherHistory.currentState}</strong>
                                                                </Link>
                                                                <br/>
                                                                Valido dal{' '}
                                                                {new Date(check.voucherHistory.validFromDate).toLocaleDateString()}
                                                                {' '}al{' '}
                                                                {new Date(check.voucherHistory.validToDate).toLocaleDateString()}
                                                                <br/>

                                                                Veicolo rilevato:{" "}
                                                                <Link
                                                                    to={"/vehicles/list/" + check.vehicleHistory.vehicleId}
                                                                    target={"_blank"}>
                                                                    <strong>{check.vehicleHistory.plate}</strong> {check.vehicleHistory.brand} {check.vehicleHistory.model}
                                                                </Link>
                                                                <br/>

                                                                Permesso{" #"}
                                                                ({check.voucherHistory.permitHistory.permitId}): {check.voucherHistory.permitHistory.description}{" "}
                                                                <strong>{check.voucherHistory.permitHistory.disabled && "Decaduto"}</strong>
                                                                <br/>
                                                                Rilevato il {new Date(check.createdAt).toLocaleString()}<br/><br/>
                                                                {inspectionDetails.currentState === "In corso" && (
                                                                    <Button onClick={() => deleteCheckSubmit(check.id)}
                                                                            color={"danger"} icon={true}
                                                                            title={"Elimina rilievo"}
                                                                            size={"xs"}>
                                                                            <span className={"rounded-icon me-2"}>
                                                                                <Icon icon={"it-delete"}/>
                                                                            </span>
                                                                        Elimina
                                                                    </Button>
                                                                )}
                                                            </AccordionBody>
                                                        </AccordionItem>
                                                    </div>
                                                ))}
                                            </Accordion>
                                        </>
                                    )}
                                </>
                            )}
                            <LoadingSpinner loading={loading}/>
                            <SuccessErrorAlert err={err} succ={succ}/>
                        </>
                    )}
                    {urlParams.tab === "anomalies" && inspectionDetails != null && (
                        <>
                            <h2 className={"mb-4"}>Anomalie</h2>
                            {anomalies.length === 0 ? (
                                <Row>
                                    <strong>Nessuna anomalia rilevata</strong>
                                </Row>
                            ) : (
                                <Accordion>
                                    {anomalies.map((anomaly, index) => (
                                        <div key={index}>
                                            <AccordionItem>
                                                <AccordionHeader active={expandedAnomaly === anomaly.voucherId}
                                                                 onToggle={() => setExpandedAnomaly(expandedAnomaly === anomaly.voucherId ? null : anomaly.voucherId)}>
                                                                    <span>
                                                                        Tagliando ID {anomaly.voucherId}{" "}
                                                                        <strong>numero {anomaly.number}</strong><br/>
                                                                        Veicoli:{" "}
                                                                        {anomaly.vehicles.map((vehicle, index) => (
                                                                            <span
                                                                                key={index}><strong>{vehicle.plate}{index < anomaly.vehicles.length - 1 && (", ")}</strong></span>
                                                                        ))}
                                                                        <br/>
                                                                    </span>
                                                </AccordionHeader>
                                                <AccordionBody active={expandedAnomaly === anomaly.voucherId}>
                                                    Motivazioni:{" "}<br/>
                                                    {anomaly.reasons.map(((reason, index) => (
                                                        <span key={index}>{" - "}<strong>{reason}</strong><br/></span>
                                                    )))}

                                                    Tagliando{": "}
                                                    <Link
                                                        to={"/vouchers/list/" + anomaly.voucherId}
                                                        target={"_blank"}>
                                                        ID univoco: {anomaly.voucherId}{": "}
                                                        <strong>Numero {anomaly.number}</strong>{" - "}
                                                        <strong>{anomaly.currentState}</strong>
                                                    </Link>
                                                    <br/>
                                                    Valido dal{' '}
                                                    {new Date(anomaly.validFromDate).toLocaleDateString()}
                                                    {' '}al{' '}
                                                    {new Date(anomaly.validToDate).toLocaleDateString()}
                                                    <br/>
                                                    Veicoli rilevati:{" "}<br/>
                                                    {anomaly.vehicles.map((vehicle, index) => (
                                                        <div key={index}>
                                                            <Row className={"mt-1 mb-1 d-flex align-items-center"}>
                                                                {inspectionDetails.currentState === "In corso" && (
                                                                    <Col xs={4}>
                                                                        <Button onClick={() => deleteCheckSubmit(vehicle.checkId)}
                                                                                color={"danger"} icon={true}
                                                                                title={"Elimina rilievo"}
                                                                                size={"xs"}>
                                                                            <span className={"rounded-icon me-2"}>
                                                                                <Icon icon={"it-delete"}/>
                                                                            </span>
                                                                            Elimina
                                                                        </Button>
                                                                    </Col>
                                                                )}
                                                                <Col xs={8}>
                                                                    <Link
                                                                        to={"/vehicles/list/" + vehicle.vehicleId}
                                                                        target={"_blank"}>
                                                                        <strong>{vehicle.plate}</strong> {vehicle.brand} {vehicle.model}
                                                                    </Link>
                                                                    {": "}<i>acquisito con rilievo #{vehicle.checkId}</i>
                                                                </Col>
                                                            </Row>
                                                        </div>
                                                    ))}

                                                    Permesso{" #"}
                                                    ({anomaly.permit.permitId}): {anomaly.permit.description}{" "}
                                                    <strong>{anomaly.permit.disabled && "Decaduto"}</strong>
                                                    <br/>
                                                </AccordionBody>
                                            </AccordionItem>
                                        </div>
                                    ))}
                                </Accordion>

                            )}
                            <LoadingSpinner loading={loading}/>
                            <SuccessErrorAlert err={err} succ={succ}/>
                        </>
                    )}
                </Container>
            </TabContent>

        </Container>
    );
}
