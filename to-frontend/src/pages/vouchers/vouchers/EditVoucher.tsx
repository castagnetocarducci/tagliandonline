import {Link, useNavigate, useParams} from "react-router";
import {type FormEvent, type FormEventHandler, useEffect, useState} from "react";
import type {
    PermitListEntry,
    VoucherAvailableOptionsApiResponse,
    VoucherConvertPdfApiResponse,
    VoucherDetails,
    VoucherDetailsApiResponse,
    VoucherEditApiResponse,
    VoucherUploadApiResponse
} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {useValidateFormInput, type ValidationSupportedTypes} from "../../../hooks/useValidateFormInput.ts";
import {defaultGETRequestInit, defaultPOSTRequestInit, fetchApiAsync} from "../../../utils/fetching.ts";
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

export function EditVoucher() {
    const navigate = useNavigate();
    const [voucherDetails, setVoucherDetails] = useState<VoucherDetails | null>(null);
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);
    const [permitsList, setPermitsList] = useState<PermitListEntry[]>([]);
    const [vehiclesAmount, setVehiclesAmount] = useState<number>(2);
    const urlParams = useParams();
    const [needTemplateGeneration, setNeedTemplateGeneration] = useState<boolean>(false);
    const [needPdfConversion, setNeedPdfConversion] = useState<boolean>(false);

    useEffect(() => {
        const abort = fetchApiAsync<VoucherAvailableOptionsApiResponse>({
            urlFromApiRoot: "/vouchers/availableOptions",
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

    useEffect(() => {
        if (urlParams.voucherID == null || urlParams.voucherID == "") {
            navigate("/vouchers/list", {replace: true});
            return;
        }
        if (urlParams.tab == null || urlParams.tab == "") {
            navigate("/vouchers/list/" + urlParams.voucherID + "/edit", {replace: true});
            return;
        }
    }, [navigate, urlParams]);

    useEffect(() => {
        if (urlParams.voucherID == null || urlParams.voucherID == "") {
            return;
        }
        if (voucherDetails != null && urlParams.voucherID === "" + voucherDetails.id) {
            return;
        }
        const abort = fetchApiAsync<VoucherDetailsApiResponse>({
            urlFromApiRoot: "/vouchers/detail/" + urlParams.voucherID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null) {
                    setVoucherDetails(data.voucher);
                }
            }
        });
        return abort;
    }, [setErr, setLoading, setSucc, urlParams, voucherDetails]);

    const onEditFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();
        if (!valid) {
            executeValidation(true);
            return;
        }
        const formValues = getValueObject();
        fetchApiAsync<VoucherEditApiResponse>({
            urlFromApiRoot: "/vouchers/edit/" + urlParams.voucherID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(formValues)
            },
            callback: (data) => {
                if (data != null && data.needTemplateGeneration != null) {
                    setNeedTemplateGeneration(data.needTemplateGeneration);
                }
            }
        });
    }

    const onGenerateTemplatesFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();
        //TODO: check if needed
        // if (!valid) {
        //     executeValidation(true);
        //     return;
        // }
        fetchApiAsync<VoucherConvertPdfApiResponse>({
            urlFromApiRoot: "/vouchers/generateTemplates/" + urlParams.voucherID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultGETRequestInit
            },
            callback: (data) => {
                if (data != null && data.voucher != null) {
                    setVoucherDetails(data.voucher);
                }
            }
        });
    }

    const onUploadFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();
        //TODO: check if needed
        // if (!valid) {
        //     executeValidation(true);
        //     return;
        // }
        const formValues = getValueObject();
        fetchApiAsync<VoucherUploadApiResponse>({
            urlFromApiRoot: "/vouchers/upload/" + urlParams.voucherID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(formValues)
            },
            callback: (data) => {
                if (data != null && data.voucher != null && data.needPdfConversion != null) {
                    setVoucherDetails(data.voucher);
                    setNeedPdfConversion(data.needPdfConversion);
                }
            }
        });
    }

    const onConvertPdfFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();
        //TODO: check if needed
        // if (!valid) {
        //     executeValidation(true);
        //     return;
        // }
        fetchApiAsync<VoucherConvertPdfApiResponse>({
            urlFromApiRoot: "/vouchers/convertPDFs/" + urlParams.voucherID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultGETRequestInit
            },
            callback: (data) => {
                if (data != null && data.voucher != null) {
                    setVoucherDetails(data.voucher);
                }
            }
        });
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
            <h1>Gestione tagliando</h1>
            {/* <i className={"text-muted"}>#{urlParams.voucherID}</i>*/}
            <TabContainer defaultActiveKey="vouchers">
                <TabNav>
                    <TabNavItem>
                        <RouterDesignTabLink
                            to={"/vouchers/list/" + urlParams.voucherID + "/edit"}> Modifica </RouterDesignTabLink>
                    </TabNavItem>
                    <TabNavItem>
                        <RouterDesignTabLink
                            to={"/vouchers/list/" + urlParams.voucherID + "/documents"}> Documenti </RouterDesignTabLink>
                    </TabNavItem>
                    <TabNavItem>
                        <RouterDesignTabLink
                            to={"/vouchers/list/" + urlParams.voucherID + "/emails"}> Email </RouterDesignTabLink>
                    </TabNavItem>
                </TabNav>
                <TabContent>
                    <Container className={"mt-2"}>
                        <GoBack link>
                            Torna indietro
                        </GoBack><br/>
                        {urlParams.tab === "edit" && voucherDetails != null && (
                            <>
                                <h2>Modifica tagliando</h2>
                                <Form onSubmit={onEditFormSubmit} className={"mt-4"}>

                                    <Row>
                                        <Col lg={1}>
                                            <p><strong>ID</strong><br/>{voucherDetails.id}</p>
                                        </Col>
                                        <Col lg={1}>
                                            <p>
                                                <strong>Numero</strong><br/><strong>{voucherDetails.number}</strong>
                                            </p>
                                        </Col>
                                        <Col lg={2}>
                                            <p><strong>Stato</strong><br/>{voucherDetails.currentState}</p>
                                        </Col>
                                        <Col lg={3}>
                                            <p><strong>Creato
                                                il</strong><br/>{new Date(voucherDetails.createdAt).toLocaleString()}
                                            </p>
                                        </Col>
                                        <Col lg={3}>
                                            <p><strong>Ultima
                                                modifica</strong><br/>{new Date(voucherDetails.updatedAt).toLocaleString()}
                                            </p>
                                        </Col>

                                        <Col lg={2}>
                                            <Button className={"mb-4"}
                                                    onClick={() => navigate(`/vouchers/list/${voucherDetails.id}/history`)}
                                                    color={"primary"} icon={true} outline
                                                    title={"Visualizza storico tagliando"}>
                                        <span className={"rounded-icon me-2"}>
                                            <Icon icon={"it-calendar"}/>
                                        </span>
                                                Storico
                                            </Button>
                                        </Col>
                                    </Row>

                                    <Row className={"mt-4"}>
                                        {/*
        validFromDate,
        validToDate,
        permitId,
        */}
                                        <Col md={3}>
                                            <ValidatedInput name={"validFromDate"} labelText={"Valido dal"}
                                                            validationFunc={() => true}
                                                            validationText={"Campo obbligatorio"}
                                                            persistingValidationText={false}
                                                            validationMark={false}
                                                            defaultValue={dateStrToISOString(voucherDetails.validFromDate)}
                                                            isMandatory={false}
                                                            errorMessage={"Compilare i campi obbligatori"}
                                                            setNewValidation={setValidation}
                                                            inputProps={{type: "date"}}/>
                                        </Col>
                                        <Col md={3}>
                                            <ValidatedInput name={"validToDate"} labelText={"Scadenza"}
                                                            validationFunc={() => true}
                                                            validationText={"Campo obbligatorio"}
                                                            persistingValidationText={false}
                                                            validationMark={false}
                                                            defaultValue={dateStrToISOString(voucherDetails.validToDate)}
                                                            isMandatory={false}
                                                            errorMessage={"Compilare i campi obbligatori"}
                                                            setNewValidation={setValidation}
                                                            inputProps={{type: "date"}}/>
                                        </Col>
                                        <Col md={2}>
                                            <ValidatedInput name={"revoked"} validationFunc={() => true}
                                                            validationText={"Campo obbligatorio"}
                                                            persistingValidationText={false}
                                                            validationMark={false}
                                                            defaultValue={voucherDetails.revoked}
                                                            isMandatory={true}
                                                            errorMessage={"Compilare i campi obbligatori"}
                                                            setNewValidation={setValidation}
                                                            labelText={"Revocato"}
                                                            inputProps={{
                                                                type: "checkbox",
                                                                className: "form-check-input"
                                                            }}/>
                                        </Col>
                                        <Col md={4}>
                                            <ValidatedSelect name={"permitId"} validationFunc={() => true}
                                                             validationText={"Campo obbligatorio"}
                                                             persistingValidationText={false}
                                                             defaultValue={voucherDetails.permit.id}
                                                             isMandatory={true}
                                                             errorMessage={"Compilare i campi obbligatori"}
                                                             setNewValidation={setValidation}
                                                             labelText={"Permesso associato"}
                                                             valueChangedCallback={selectedPermitChanged}
                                                             options={selectablePermits}/>
                                        </Col>
                                    </Row>

                                    {/*
        notes,
        */}
                                    <Row>
                                        <Col md={8}>
                                            <ValidatedInput name={"notes"} labelText={"Note"}
                                                            validationFunc={() => true}
                                                            validationText={""} persistingValidationText={false}
                                                            validationMark={false}
                                                            defaultValue={voucherDetails.notes}
                                                            isMandatory={false}
                                                            errorMessage={""}
                                                            setNewValidation={setValidation}
                                                            inputProps={{type: "text"}}/>
                                        </Col>
                                    </Row>

                                    {(voucherDetails.applications != null && voucherDetails.applications.length > 0) ? (
                                        <Col lg={12}>
                                            {(voucherDetails.applications.length > 0) && (
                                                <>
                                                    <h4><strong>Domande collegate</strong></h4>
                                                    <List>
                                                        <ListItem key={"header"}>
                                                            <Col lg={2} className={"text-wrap"}>
                                                                <strong>#</strong>
                                                            </Col>
                                                            <Col lg={2} className={"text-wrap"}>
                                                                <strong>Nominativo</strong>
                                                            </Col>
                                                            <Col lg={1} className={"text-wrap"}>
                                                                <strong>Tipo</strong>
                                                            </Col>
                                                            <Col lg={2} className={"text-wrap"}>
                                                                <strong>Esito</strong>
                                                            </Col>
                                                            <Col lg={1} className={"text-wrap"}>
                                                                <strong>Protocollo</strong>
                                                            </Col>
                                                            <Col lg={2} className={"text-wrap"}>
                                                                <strong>Indirizzo e Catasto</strong>
                                                            </Col>
                                                            <Col lg={1} className={"text-wrap"}>
                                                                <strong>Veicoli</strong>
                                                            </Col>
                                                            <Col lg={1} className={"text-break text-truncate"}>
                                                                <strong>Email</strong>
                                                            </Col>
                                                        </ListItem>
                                                        {voucherDetails.applications.map((application, index) => {
                                                            if (index === 0) return (
                                                                <ListItem key={application.id}>
                                                                    <Col lg={2} className={"text-wrap"}>
                                                                        <RouterDesignLink
                                                                            to={`/applications/list/${application.id}`}
                                                                            title={"Vai alla domanda"}>
                                                                            <div className={"it-right-zone"}>
                                                                    <span
                                                                        className={"text"}>Domanda {application.id}</span>
                                                                                <Icon icon="it-chevron-right"/>
                                                                            </div>
                                                                        </RouterDesignLink>
                                                                    </Col>
                                                                    <Col lg={2} className={"text-wrap"}>
                                                                        {application.firstname} {application.lastname} {application.cf}
                                                                    </Col>
                                                                    <Col lg={1} className={"text-wrap"}>
                                                                        {application.typeDescription}
                                                                    </Col>
                                                                    <Col lg={2} className={"text-wrap"}>
                                                                        {application.outcomeDescription} in
                                                                        data {application.outcomeDate == null ? "N/A" : new Date(application.outcomeDate).toLocaleDateString()}
                                                                    </Col>
                                                                    <Col lg={1} className={"text-wrap"}>
                                                                        {application.registerNumber} del {new Date(application.registerDate).toLocaleDateString()}
                                                                    </Col>
                                                                    <Col lg={2} className={"text-wrap"}>
                                                                        {application.targetHousePlace && application.targetHousePlace + " - "}
                                                                        {application.targetHouseLandRegistrySheet && application.targetHouseLandRegistrySheet + " "}
                                                                        {application.targetHouseLandRegistryMap && application.targetHouseLandRegistryMap + " "}
                                                                        {application.targetHouseLandRegistrySubaltern && application.targetHouseLandRegistrySubaltern + " "}
                                                                        {application.targetHouseLandRegistryCategory && application.targetHouseLandRegistryCategory + " "}
                                                                    </Col>
                                                                    <Col lg={1} className={"text-wrap"}>
                                                                        {application.vehicles.map((vehicle) => vehicle.plate).join(", ")}
                                                                    </Col>
                                                                    <Col lg={1}
                                                                         className={"text-break text-truncate"}>
                                                                        <Link
                                                                            to={"mailto:" + application.email}>{application.email}</Link>
                                                                    </Col>
                                                                    {/*<Col lg={1}>*/}
                                                                    {/*    {new Date(application.updatedAt).toLocaleString()}*/}
                                                                    {/*</Col>*/}
                                                                </ListItem>
                                                            );
                                                            else return (
                                                                <RouterDesignLink key={application.id}
                                                                                  to={`/applications/list/${application.id}`}
                                                                                  className={"list-item"}
                                                                                  title={"Vai alla domanda"}>
                                                                    <div className={"it-right-zone"}>
                                                                                <span
                                                                                    className={"text"}>Domanda {application.id}</span>
                                                                        <Icon icon="it-chevron-right"/>
                                                                    </div>
                                                                </RouterDesignLink>
                                                            )
                                                        })}
                                                    </List>
                                                </>
                                            )}
                                            {(voucherDetails.applications.length === 0) && (
                                                <p><strong>Nessuna domanda collegata</strong></p>
                                            )}
                                        </Col>
                                    ) : (
                                        <Row className={"mt-4"}>
                                            <Col md={12}>
                                                <p><strong>Domande collegate</strong></p>
                                            </Col>
                                        </Row>
                                    )}


                                    <Row className={"mt-4"}>
                                        <Col md={4}>
                                            <Button color={"primary"} type={"submit"}
                                                    disabled={!valid || loading}> Salva </Button>
                                        </Col>
                                    </Row>


                                    <LoadingSpinner loading={loading}/>
                                    <SuccessErrorAlert err={err} succ={succ}/>
                                </Form>

                                <Row className={"mt-4"}>
                                    <ValidatedVehiclesList name={"vehicles"} validationFunc={() => true}
                                                           validationText={"Campo obbligatorio"}
                                                           defaultValue={voucherDetails.vehicles != null ? voucherDetails.vehicles.map(vehicle => vehicle.id) : []}
                                                           isMandatory={true}
                                                           errorMessage={"Devi associare un numero corretto di veicoli"}
                                                           setNewValidation={setValidation}
                                                           labelText={"Veicoli associati"}
                                                           amount={vehiclesAmount}
                                                           exactAmount={true}/>

                                </Row>

                            </>
                        )}
                        {urlParams.tab === "documents" && voucherDetails != null && (
                            <>
                                <h2>Documenti</h2>

                                <Form onSubmit={onGenerateTemplatesFormSubmit} className={"mt-4"}>
                                    {/*TODO: generate templates*/}

                                </Form>

                                <Form onSubmit={onUploadFormSubmit} className={"mt-4"}>
                                    {/*TODO: upload*/}

                                </Form>
                                <Form onSubmit={onConvertPdfFormSubmit} className={"mt-4"}>
                                    {/*TODO: convert*/}

                                </Form>
                                <LoadingSpinner loading={loading}/>
                                <SuccessErrorAlert err={err} succ={succ}/>

                            </>
                        )}
                        {urlParams.tab === "emails" && voucherDetails != null && (
                            <>
                                <h2>Email</h2>
                                <Form onSubmit={onEditFormSubmit} className={"mt-4"}>


                                    <LoadingSpinner loading={loading}/>
                                    <SuccessErrorAlert err={err} succ={succ}/>
                                </Form>
                            </>
                        )}


                    </Container>
                </TabContent>
            </TabContainer>


        </Container>
    );
}
