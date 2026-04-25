import {useNavigate, useSearchParams} from "react-router";
import {type FormEvent, type FormEventHandler, useEffect, useState} from "react";
import type {InspectionListApiResponse, InspectionListEntry} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {
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

export function InspectionsList() {
    const navigate = useNavigate();
    const [inspectionsList, setInspectionsList] = useState<InspectionListEntry[]>([]);
    const {err, setErr, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);
    const [searchParams, setSearchParams] = useSearchParams();
    const [pageData, setPageData] = useState<PagerPageData>({currentPage: 1, totalPages: 0});

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
        const abort = fetchApiAsync<InspectionListApiResponse>({
            urlFromApiRoot: "/inspections/list",
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(valuesMap)
            },
            callback: (data) => {
                if (data != null && data.inspectionsList != null) {
                    setInspectionsList(data.inspectionsList);
                }
                if (data != null && data.pageData != null) {
                    setPageData(data.pageData);
                }
            }
        });
        return abort;
    }, [setErr, setLoading, setSucc, setInspectionsList, searchParams, pageData.currentPage, setPageData]);


    return (
        <Container>
            <h1 className={"mb-4"}>Ispezioni</h1>
            <Button className={"mb-4 me-2"} onClick={() => navigate(`/inspections/list/new`)}
                    color={"primary"} icon={true} title={"Aggiungi nuova ispezione"}>
                        <span className={"rounded-icon me-2"}>
                            <Icon icon={"it-plus"}/>
                        </span>
                Nuova
            </Button>

            <h2 className={"mb-4"}>
                Filtri
            </h2>
            <Form onSubmit={onFormSubmit} className={"mt-4"}>
                {/*
        idFrom,
        idTo,

        description
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
                    <Col md={6}>
                        <ValidatedInput name={"description"} labelText={"Descrizione"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"}
                                        persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("description") ?? ""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "text"}}/>
                    </Col>
                </Row>

                {/*
        startDateFrom,
        startDateTo,

        endDateFrom,
        endDateTo,
        */}
                <Row>
                    <Col md={3}>
                        <ValidatedInput name={"startDateFrom"} labelText={"Avvio (da)"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("startDateFrom") ?? ""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "date"}}/>
                    </Col>
                    <Col md={3}>
                        <ValidatedInput name={"startDateTo"} labelText={"Avvio (a)"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("startDateTo") ?? ""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "date"}}/>
                    </Col>
                    <Col md={3}>
                        <ValidatedInput name={"endDateFrom"} labelText={"Conclusa (da)"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("endDateFrom") ?? ""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "date"}}/>
                    </Col>
                    <Col md={3}>
                        <ValidatedInput name={"endDateTo"} labelText={"Conclusa (a)"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("endDateTo") ?? ""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "date"}}/>
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

            {inspectionsList.length > 0 && (
                <Row>
                    <Col lg={1}>
                        <strong># (ID)</strong>
                    </Col>
                    <Col lg={4}>
                        <strong>Descrizione</strong>
                    </Col>
                    <Col lg={2}>
                        <strong>Stato</strong>
                    </Col>
                    <Col lg={2}>
                        <strong>Avvio</strong>
                    </Col>
                    <Col lg={2}>
                        <strong>Conclusa</strong>
                    </Col>
                    <Col lg={1}>
                        <strong>Modifica</strong>
                    </Col>
                </Row>
            )}
            <hr/>
            {inspectionsList.map((inspectionListEntry, index) => (
                <div key={index}>
                    <Row className={"mt-2 d-flex align-items-center"}>
                        <Col lg={1} className={""}>
                            {inspectionListEntry.id}
                        </Col>
                        <Col lg={4} className={""}>
                            <strong>{inspectionListEntry.description}</strong>
                        </Col>
                        <Col lg={2} className={""}>
                            {inspectionListEntry.currentState}
                        </Col>
                        <Col lg={2} className={"text-wrap"}>
                            {new Date(inspectionListEntry.startDate).toLocaleDateString()}
                        </Col>
                        <Col lg={2} className={"text-wrap"}>
                            {inspectionListEntry.endDate == null ? "N/A" : new Date(inspectionListEntry.endDate).toLocaleDateString()}
                        </Col>
                        <Col lg={1}>
                            <Button onClick={() => navigate(`/inspections/list/${inspectionListEntry.id}`)}
                                    color={"secondary"} icon={true} outline title={"Modifica"}>
                                <Icon icon={"it-pencil"}/>
                            </Button>
                        </Col>
                    </Row>
                    <hr/>
                </div>
            ))}
            {inspectionsList.length === 0 && (
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