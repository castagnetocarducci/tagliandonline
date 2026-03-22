import {useNavigate, useSearchParams} from "react-router";
import {type FormEvent, type FormEventHandler, useEffect, useState} from "react";
import type {VehicleListApiResponse, VehicleListEntry} from "../../../utils/Types.ts";
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

export function ApplicationsList() {
    const navigate = useNavigate();
    const [vehiclesList, setVehiclesList] = useState<VehicleListEntry[]>([]);
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
        setPageData((prevState) => {return {...prevState, currentPage: 1}});
        setSearchParams(urlSearchParams);
    }

    useEffect(() => {
        const valuesMap = fromSearchParamsToValuesMap(searchParams);
        valuesMap["page"] = pageData.currentPage;
        const abort = fetchApiAsync<VehicleListApiResponse>({
            urlFromApiRoot: "/applications/list",
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
    }, [setErr, setLoading, setSucc, setVehiclesList, searchParams, pageData.currentPage, setPageData]);


    return (
        <Container>
            <h1 className={"mb-4"}>Veicoli</h1>
            <Button className={"mb-4 me-2"} onClick={() => navigate(`/vehicles/list/new`)}
                    color={"primary"} icon={true} title={"Aggiungi nuovo veicolo"}>
                        <span className={"rounded-icon me-2"}>
                            <Icon icon={"it-plus"}/>
                        </span>
                Nuovo
            </Button>

            <h2 className={"mb-4"}>
                Filtri
            </h2>
            <Form onSubmit={onFormSubmit} className={"mt-4"}>
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
                    <Col md={2}>
                        <ValidatedInput name={"plate"} labelText={"Targa"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("plate") ?? ""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "text"}}/>
                    </Col>
                    <Col md={3}>
                        <ValidatedInput name={"brand"} labelText={"Marca"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("brand") ?? ""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "text"}}/>
                    </Col>
                    <Col md={3}>
                        <ValidatedInput name={"model"} labelText={"Modello"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={searchParams.get("model") ?? ""}
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
                    <Col md={1}>
                        <strong>#</strong>
                    </Col>
                    <Col md={2}>
                        <strong>Targa</strong>
                    </Col>
                    <Col md={3}>
                        <strong>Marca</strong>
                    </Col>
                    <Col md={3}>
                        <strong>Modello</strong>
                    </Col>
                    <Col md={2}>
                        <strong>Ultimo aggiornamento</strong>
                    </Col>
                    <Col md={1}>
                        <strong>Modifica</strong>
                    </Col>
                </Row>
            )}
            <hr/>
            {vehiclesList.map((vehicleListEntry, index) => (
                <div key={index}>
                    <Row className={"mt-2 d-flex align-items-center"}>
                        <Col md={1} className={""}>
                            {vehicleListEntry.id}
                        </Col>
                        <Col md={2}>
                            {vehicleListEntry.plate}
                        </Col>
                        <Col md={3} className={"text-wrap"}>
                            {vehicleListEntry.brand}
                        </Col>
                        <Col md={3} className={"text-wrap"}>
                            {vehicleListEntry.model}
                        </Col>
                        <Col md={2}>
                            {new Date(vehicleListEntry.updatedAt).toLocaleString()}
                        </Col>
                        <Col md={1}>
                            <Button onClick={() => navigate(`/vehicles/list/${vehicleListEntry.id}`)}
                                    color={"secondary"} icon={true} outline title={"Modifica"}>
                                <Icon icon={"it-pencil"}/>
                            </Button>
                        </Col>
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

            <LoadingSpinner loading={loading}/>

            <SuccessErrorAlert err={err} succ={null}/>

        </Container>
    )
}