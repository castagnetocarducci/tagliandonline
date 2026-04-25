import {Link, useNavigate, useParams, useSearchParams} from "react-router";
import {type FormEvent, type FormEventHandler, useEffect, useState} from "react";
import type {
    ApplicationDetailsApiResponse, CachedAnomaly, DataMessage,
    Email, EmailAttachment, InspectionDetails, InspectionListApiResponse, InspectionPagedDetailsApiResponse,
    PermitListEntry,
    VoucherAvailableOptionsApiResponse,
    VoucherConvertPdfApiResponse,
    VoucherDetails,
    VoucherDetailsApiResponse,
    VoucherEditApiResponse, VoucherGenerateEmailApiResponse,
    VoucherGenerateTemplatesApiResponse, VoucherSendEmailApiResponse,
    VoucherUploadApiResponse
} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {
    useValidateFormInput,
    type ValidatedFormValuesMap,
    type ValidationSupportedTypes
} from "../../../hooks/useValidateFormInput.ts";
import {
    defaultGETRequestInit,
    defaultPOSTRequestInit,
    fetchApiAsync, fromSearchParamsToValuesMap, fromValuesMapToSearchParams,
    multipartPOSTRequestInit
} from "../../../utils/fetching.ts";
import {
    Button,
    Col,
    Container,
    Form,
    GoBack,
    Icon,
    List,
    ListItem,
    Row,
    TabContainer,
    TabContent,
    TabNav,
    TabNavItem
} from "design-react-kit";
import {ValidatedInput} from "../../../components/form/ValidatedInput.tsx";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";
import {type SelectOption, ValidatedSelect} from "../../../components/form/ValidatedSelect.tsx";
import {dateStrToISOString} from "../../../utils/CommonFunctions.ts";
import {ValidatedVehiclesList} from "../../../components/form/ValidatedVehiclesList.tsx";
import {RouterDesignLink} from "../../../components/links/RouterDesignLink.tsx";
import {RouterDesignTabLink} from "../../../components/links/RouterDesignTabLink.tsx";
import {getApiUrl} from "../../../utils/ConfigProvider.ts";
import {ValidatedUploadDragNdropSingle} from "../../../components/form/ValidatedUploadDragNdropSingle.tsx";
import {ValidatedTextArea} from "../../../components/form/ValidatedTextArea.tsx";
import type {PagerPageData} from "../../../components/AutoPager.tsx";

export function EditInspection() {
    const navigate = useNavigate();
    const [inspectionDetails, setInspectionDetails] = useState<InspectionDetails | null>(null);
    const [anomalies, setAnomalies] = useState<CachedAnomaly[]>([]);
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const editVFI = useValidateFormInput(setErr, setSucc);
    const urlParams = useParams();
    // const [searchParams, setSearchParams] = useSearchParams();
    const [pageData, setPageData] = useState<PagerPageData>({currentPage: 1, totalPages: 0});
    const [toggleDetailsRefresh, setToggleDetailsRefresh] = useState<boolean>(false);


    useEffect(() => {
        if (urlParams.inspectionID == null || urlParams.inspectionID == "") {
            navigate("/inspections/list", {replace: true});
        }
    }, [navigate, urlParams]);

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

    const canReopen: boolean = inspectionDetails == null ? false : inspectionDetails.currentState === "Conclusa";

    return (
        <Container>
            <GoBack link className={""}>
                Torna indietro
            </GoBack>
            <h2>Modifica ispezione</h2>
            <Form onSubmit={onEditFormSubmit} className={"mt-4"}>
                {inspectionDetails != null && (
                    <>
                        <Row>
                            <Col lg={1}>
                                <p><strong>ID</strong><br/>{inspectionDetails.id}</p>
                            </Col>
                            <Col lg={2}>
                                <p><strong>Stato</strong><br/><strong>{inspectionDetails.currentState}</strong></p>
                            </Col>
                            <Col lg={3}>
                                <p><strong>Avvio</strong><br/>{new Date(inspectionDetails.startDate).toLocaleString()}
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
                                <ValidatedInput name={canReopen ? "reopen" : "close"} validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
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
                    </>
                )}

                <LoadingSpinner loading={loading}/>

                <SuccessErrorAlert err={err} succ={succ}/>

            </Form>
            <hr/>
            {inspectionDetails != null && (
                <>

                    <h2 className={"mb-4"}>Anomalie</h2>
                    {anomalies.length === 0 ? (
                        <Row>
                            <strong>Nessuna anomalia rilevata</strong>
                        </Row>
                    ) : (
                        <>
                            {/*TODO: anomalie*/}
                        </>
                    )}

                    <hr/>

                    <h2 className={"mb-4"}>Rilievi</h2>
                    <Button className={"mb-4 me-2"}
                            onClick={() => navigate(`/inspections/list/${inspectionDetails.id}/new`)}
                            color={"primary"} icon={true} title={"Aggiungi nuovo rilievo"}>
                        <span className={"rounded-icon me-2"}>
                            <Icon icon={"it-plus"}/>
                        </span>
                        Nuovo
                    </Button>

                    {inspectionDetails.inspectionChecks.length === 0 ? (
                        <Row>
                            <strong>Nessuna rilievo</strong>
                        </Row>
                    ) : (
                        <>
                            {/*TODO: rilievi*/}

                        </>
                    )}

                </>
            )}
        </Container>
    );
}
