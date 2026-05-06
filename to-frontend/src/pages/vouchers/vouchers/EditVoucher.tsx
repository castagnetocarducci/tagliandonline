import {Link, useNavigate, useParams} from "react-router";
import {type FormEvent, type FormEventHandler, useEffect, useState} from "react";
import type {
    Email, EmailAttachment,
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
import {useValidateFormInput, type ValidationSupportedTypes} from "../../../hooks/useValidateFormInput.ts";
import {
    defaultGETRequestInit,
    defaultPOSTRequestInit,
    fetchApiAsync,
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

export function EditVoucher() {
    const navigate = useNavigate();
    const [voucherDetails, setVoucherDetails] = useState<VoucherDetails | null>(null);
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);
    const uploadValidation = useValidateFormInput(setErr, setSucc);
    const emailValidation = useValidateFormInput(setErr, setSucc);
    const [permitsList, setPermitsList] = useState<PermitListEntry[]>([]);
    const [vehiclesAmount, setVehiclesAmount] = useState<number>(2);
    const urlParams = useParams();
    const [needTemplateGeneration, setNeedTemplateGeneration] = useState<boolean>(false);
    const [needPdfConversion, setNeedPdfConversion] = useState<boolean>(false);
    const [email, setEmail] = useState<Email | null>(null);
    const [emailAttachments, setEmailAttachments] = useState<EmailAttachment[] | null>(null);

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
                    if (!needTemplateGeneration) {
                        setNeedTemplateGeneration(data.needTemplateGeneration);
                    }
                }
            }
        });
    }

    const onGenerateTemplatesFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();

        fetchApiAsync<VoucherGenerateTemplatesApiResponse>({
            urlFromApiRoot: "/vouchers/generateTemplates/" + urlParams.voucherID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultGETRequestInit
            },
            callback: (data) => {
                if (data != null && data.voucherDetails != null) {
                    setVoucherDetails(data.voucherDetails);
                    if (!needPdfConversion) {
                        setNeedPdfConversion(data.needPdfConversion);
                    }
                    setNeedTemplateGeneration(false);
                }
            }
        });
    }

    const onUploadFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();
        if (!uploadValidation.valid) {
            uploadValidation.executeValidation(true);
            return;
        }
        const formValues = uploadValidation.getValueObject();
        //https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Sending_forms_through_JavaScript
        const formData = new FormData();
        for (const [key, value] of Object.entries(formValues)) {
            // FormData accetta solo Blob o string
            if (value instanceof Array) {
                if (value.length > 0 && (value[0] instanceof Blob || typeof value[0] === "string")) {
                    formData.set(key, value[0]);
                }
            } else {
                formData.set(key, "" + value);
            }
        }

        fetchApiAsync<VoucherUploadApiResponse>({
            urlFromApiRoot: "/vouchers/upload/" + urlParams.voucherID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...multipartPOSTRequestInit,
                body: formData
            },
            callback: (data) => {
                if (data != null && data.voucherDetails != null) {
                    setVoucherDetails(data.voucherDetails);
                    if (!needPdfConversion) {
                        setNeedPdfConversion(data.needPdfConversion);
                    }
                }
            }
        });
    }

    const onConvertPdfFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();

        fetchApiAsync<VoucherConvertPdfApiResponse>({
            urlFromApiRoot: "/vouchers/convertPDFs/" + urlParams.voucherID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultGETRequestInit
            },
            callback: (data) => {
                if (data != null && data.voucherDetails != null) {
                    setVoucherDetails(data.voucherDetails);
                    setNeedPdfConversion(false);
                }
            }
        });
    }

    const onGenerateEmailFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();

        fetchApiAsync<VoucherGenerateEmailApiResponse>({
            urlFromApiRoot: "/vouchers/generateEmail/" + urlParams.voucherID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultGETRequestInit
            },
            callback: (data) => {
                if (data != null && data.email != null) {
                    setEmail(data.email);
                    setEmailAttachments(data.email.attachments);
                }
            }
        });
    }

    const onSendEmailFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();
        if (!emailValidation.valid) {
            emailValidation.executeValidation(true);
            return;
        }
        const formValues = emailValidation.getValueObject();
        const attachments: { path: string, filename: string }[] = [];
        for (let i = 0; i < (emailAttachments != null ? emailAttachments.length : 0); i++) {
            const path = formValues["attachment" + i + "-path"];
            const filename = formValues["attachment" + i + "-filename"];
            if (path == null || filename == null) {
                continue;
            }
            delete formValues["attachment" + i + "-path"];
            delete formValues["attachment" + i + "-filename"];
            attachments.push({
                path: "" + path,
                filename: "" + filename
            });
        }
        const toSendValues = {
            ...formValues,
            attachments: attachments
        }

        fetchApiAsync<VoucherSendEmailApiResponse>({
            urlFromApiRoot: "/vouchers/sendEmail/" + urlParams.voucherID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(toSendValues)
            },
            callback: (data) => {
                if (data != null && data.voucherDetails != null) {
                    setVoucherDetails(data.voucherDetails);
                    setEmail(null);
                    setEmailAttachments(null);
                }
            }
        });
    }

    const onRemoveEmailAttachmentClick = (attachmentIndex: number) => {
        if (emailAttachments == null) {
            return;
        }
        const newAttachments = [...emailAttachments];
        newAttachments.splice(attachmentIndex, 1);
        setEmailAttachments(newAttachments);
    }

    const convertStringAttachments = (attachments: string): string[] => {
        try {
            const attachmentArr = JSON.parse(attachments);
            if (!(attachmentArr instanceof Array)) {
                return [];
            }
            const res: string[] = [];
            for (const attachment of attachmentArr) {
                if (attachment.filename != null && typeof attachment.filename === "string") {
                    res.push(attachment.filename);
                }
            }
            return res;
        } catch {
            return [];
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
                                                                        {application.companyName != null || application.companyCF != null && (
                                                                            <> per {application.companyName} {application.companyCF}</>
                                                                        )}
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
                                                           exactAmount={false}/>

                                </Row>

                            </>
                        )}
                        {urlParams.tab === "documents" && voucherDetails != null && (
                            <>
                                <h2>Documenti</h2>
                                <Row>
                                    <Col md={3}>
                                        <Form onSubmit={onGenerateTemplatesFormSubmit} className={"mt-4"}>
                                            <Button
                                                color={(needTemplateGeneration || voucherDetails.generatedVoucherTemplatePath === null) ? "primary" : "warning"}
                                                outline={!(needTemplateGeneration || voucherDetails.generatedVoucherTemplatePath === null)}
                                                type={"submit"}
                                                disabled={loading}>
                                                Genera da modello
                                            </Button>
                                        </Form>
                                    </Col>
                                    <Col md={3}>
                                        <Form onSubmit={onConvertPdfFormSubmit} className={"mt-4"}>
                                            <Button
                                                color={(needPdfConversion || voucherDetails.generatedVoucherPdfPath === null) ? "primary" : "warning"}
                                                outline={!(needPdfConversion || voucherDetails.generatedVoucherPdfPath === null)}
                                                type={"submit"}
                                                disabled={loading || voucherDetails.generatedVoucherTemplatePath === null}>
                                                Converti in PDF
                                            </Button>
                                        </Form>
                                    </Col>
                                </Row>

                                <Form onSubmit={onUploadFormSubmit} className={"mt-4"}>
                                    <Row className={"align-items-center mt-4"}>
                                        <Col md={3}>
                                            <span><strong>Tagliando modificabile</strong></span><br/>
                                            <Button href={getApiUrl() + voucherDetails.generatedVoucherTemplatePath}
                                                    color={"primary"} icon={true}
                                                    disabled={voucherDetails.generatedVoucherTemplatePath === null}
                                                    title={"Scarica tagliando modificabile"}>
                                                <Icon icon={"it-download"} color={"white"}/>
                                                <span className={"ps-1"}>Scarica</span>
                                            </Button>
                                        </Col>
                                        <Col md={8}>
                                            {voucherDetails.generatedVoucherTemplatePath === null ? (
                                                <i>Ancora da generare</i>
                                            ) : (
                                                <ValidatedUploadDragNdropSingle
                                                    name={"generatedVoucherTemplate"}
                                                    acceptedFileExtensions={[".docx"]}
                                                    validationFunc={() => true}
                                                    validationText={""}
                                                    isMandatory={false}
                                                    errorMessage={"File non valido"}
                                                    setNewValidation={uploadValidation.setValidation}
                                                />
                                            )}
                                        </Col>
                                    </Row>

                                    <Row className={"align-items-center mt-4"}>
                                        <Col md={3}>
                                            <span><strong>Autorizzazione modificabile</strong></span><br/>
                                            <Button
                                                href={getApiUrl() + voucherDetails.generatedAuthorizationTemplatePath}
                                                color={"primary"} icon={true}
                                                disabled={voucherDetails.generatedAuthorizationTemplatePath === null}
                                                title={"Scarica autorizzazione modificabile"}>
                                                <Icon icon={"it-download"} color={"white"}/>
                                                <span className={"ps-1"}>Scarica</span>
                                            </Button>
                                        </Col>
                                        <Col md={8}>
                                            {voucherDetails.generatedAuthorizationTemplatePath === null ? (
                                                <i>Ancora da generare</i>
                                            ) : (
                                                <ValidatedUploadDragNdropSingle
                                                    name={"generatedAuthorizationTemplate"}
                                                    acceptedFileExtensions={[".docx"]}
                                                    validationFunc={() => true}
                                                    validationText={""}
                                                    isMandatory={false}
                                                    errorMessage={"File non valido"}
                                                    setNewValidation={uploadValidation.setValidation}
                                                />
                                            )}
                                        </Col>
                                    </Row>

                                    <Row className={"align-items-center mt-4"}>
                                        <Col md={3}>
                                            <span><strong>Tagliando PDF</strong></span><br/>
                                            {/*href={getApiUrl() + voucherDetails.generatedVoucherPdfPath}*/}
                                            <Button type={"button"}
                                                    onClick={() => {
                                                        window.open(getApiUrl() + voucherDetails.generatedVoucherPdfPath, "_blank")
                                                    }}
                                                    color={"primary"} icon={true}
                                                    disabled={voucherDetails.generatedVoucherPdfPath === null}
                                                    title={"Scarica pdf tagliando"}>
                                                <Icon icon={"it-download"} color={"white"}/>
                                                <span className={"ps-1"}>Scarica</span>
                                            </Button>
                                        </Col>
                                        <Col md={8}>
                                            {voucherDetails.generatedVoucherPdfPath === null && (
                                                <i>Ancora da generare</i>
                                            )}
                                        </Col>
                                    </Row>

                                    <Row className={"align-items-center mt-4"}>
                                        <Col md={3}>
                                            <span><strong>Autorizzazione PDF</strong></span><br/>
                                            {/*href={getApiUrl() + voucherDetails.generatedAuthorizationPdfPath}*/}
                                            <Button type={"button"}
                                                    onClick={() => {
                                                        window.open(getApiUrl() + voucherDetails.generatedAuthorizationPdfPath, "_blank")
                                                    }}
                                                    color={"primary"} icon={true}
                                                    disabled={voucherDetails.generatedAuthorizationPdfPath === null}
                                                    title={"Scarica pdf autorizzazione"}>
                                                <Icon icon={"it-download"} color={"white"}/>
                                                <span className={"ps-1"}>Scarica</span>
                                            </Button>
                                        </Col>
                                        <Col md={8}>
                                            {voucherDetails.generatedAuthorizationPdfPath === null && (
                                                <i>Ancora da generare</i>
                                            )}
                                        </Col>
                                    </Row>

                                    <Row className={"align-items-center mt-4"}>
                                        <Col md={3}>
                                            <span><strong>Autorizzazione firmata</strong></span><br/>
                                            {/*href={getApiUrl() + voucherDetails.signedAuthorizationPath}*/}
                                            <Button type={"button"}
                                                    onClick={() => {
                                                        window.open(getApiUrl() + voucherDetails.signedAuthorizationPath, "_blank")
                                                    }}
                                                    color={"primary"} icon={true}
                                                    disabled={voucherDetails.signedAuthorizationPath === null}
                                                    title={"Scarica autorizzazione firmata"}>
                                                <Icon icon={"it-download"} color={"white"}/>
                                                <span className={"ps-1"}>Scarica</span>
                                            </Button>
                                        </Col>
                                        <Col md={8}>
                                            <ValidatedUploadDragNdropSingle
                                                name={"signedAuthorization"}
                                                acceptedFileExtensions={[".pdf", ".p7m"]}
                                                validationFunc={() => true}
                                                validationText={""}
                                                isMandatory={false}
                                                errorMessage={"File non valido"}
                                                setNewValidation={uploadValidation.setValidation}
                                            />
                                        </Col>
                                    </Row>
                                    <Row className={"align-items-center mt-5"}>
                                        <Col md={3}>
                                            <Button color={"primary"}
                                                    type={"submit"}
                                                    disabled={!uploadValidation.valid || loading}>
                                                Carica file
                                            </Button>
                                        </Col>
                                    </Row>
                                </Form>
                                <br/>

                                <LoadingSpinner loading={loading}/>
                                <SuccessErrorAlert err={err} succ={succ}/>

                            </>
                        )}
                        {urlParams.tab === "emails" && voucherDetails != null && (
                            <>
                                <h2>Email</h2>

                                <Row>
                                    <Col md={3}>
                                        <Form onSubmit={onGenerateEmailFormSubmit} className={"mt-4"}>
                                            <Button
                                                color={(email === null) ? "primary" : "warning"}
                                                outline={!(email === null)}
                                                type={"submit"}
                                                disabled={loading}>
                                                Genera da modello
                                            </Button>
                                        </Form>
                                    </Col>
                                </Row>

                                {email != null ? (
                                    <Form onSubmit={onSendEmailFormSubmit} className={"mt-5"}>
                                        <Row className={"mt-4"}>
                                            <Col md={12}>
                                                <ValidatedInput name={"to"} labelText={"Destinatario"}
                                                                validationFunc={() => true}
                                                                validationText={"Campo obbligatorio"}
                                                                persistingValidationText={false}
                                                                validationMark={false} defaultValue={email.to}
                                                                isMandatory={true}
                                                                errorMessage={"Compilare i campi obbligatori"}
                                                                setNewValidation={emailValidation.setValidation}
                                                                inputProps={{type: "text"}}/>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={12}>
                                                <ValidatedInput name={"subject"} labelText={"Oggetto"}
                                                                validationFunc={() => true}
                                                                validationText={"Campo obbligatorio"}
                                                                persistingValidationText={false}
                                                                validationMark={false} defaultValue={email.subject}
                                                                isMandatory={true}
                                                                errorMessage={"Compilare i campi obbligatori"}
                                                                setNewValidation={emailValidation.setValidation}
                                                                inputProps={{type: "text"}}/>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={12}>
                                                <ValidatedTextArea name={"body"} labelText={"Corpo"}
                                                                   validationFunc={() => true}
                                                                   validationText={"Campo obbligatorio"}
                                                                   persistingValidationText={false}
                                                                   validationMark={false} defaultValue={email.body}
                                                                   isMandatory={true}
                                                                   errorMessage={"Compilare i campi obbligatori"}
                                                                   setNewValidation={emailValidation.setValidation}
                                                                   textAreaProps={{rows: 5}}/>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={12}>
                                                {emailAttachments != null && emailAttachments.length > 0 ? (
                                                    <>
                                                        <List>
                                                            {emailAttachments.map((attachment, index) => (
                                                                <Row key={attachment.path}>
                                                                    <Col md={4}>
                                                                        <ValidatedInput
                                                                            name={"attachment" + index + "-filename"}
                                                                            labelText={"Allegato " + (index + 1)}
                                                                            validationFunc={() => true}
                                                                            validationText={"Campo obbligatorio"}
                                                                            persistingValidationText={false}
                                                                            validationMark={false}
                                                                            defaultValue={attachment.filename}
                                                                            isMandatory={true}
                                                                            errorMessage={"Compilare i campi obbligatori"}
                                                                            setNewValidation={emailValidation.setValidation}
                                                                            inputProps={{type: "text"}}/>
                                                                    </Col>
                                                                    <Col md={2}>
                                                                        <Button type={"button"}
                                                                                onClick={() => {
                                                                                    window.open(getApiUrl() + attachment.downloadPath, "_blank")
                                                                                }}
                                                                                color={"primary"} icon={true}
                                                                                size={"xs"}
                                                                                disabled={attachment.downloadPath == null}
                                                                                title={"Scarica allegato"}>
                                                                            <span className={"rounded-icon"}>
                                                                                <Icon icon={"it-download"}
                                                                                      color={"black"}/>
                                                                            </span>
                                                                            <span className={"ps-1"}>Scarica</span>
                                                                        </Button>
                                                                    </Col>
                                                                    <Col md={2}>
                                                                        <Button type={"button"}
                                                                                onClick={() => onRemoveEmailAttachmentClick(index)}
                                                                                color={"secondary"} icon={true}
                                                                                size={"xs"}
                                                                                title={"Rimuovi allegato"}>
                                                                            <span className={"rounded-icon me-2"}>
                                                                                <Icon icon={"it-minus"}/>
                                                                            </span>
                                                                            <span className={"ps-1"}>Rimuovi</span>
                                                                        </Button>
                                                                    </Col>
                                                                    <Col md={2} className={"d-none"}>
                                                                        {/*hidden for path parameter*/}
                                                                        <ValidatedInput
                                                                            name={"attachment" + index + "-path"}
                                                                            labelText={"Percorso allegato " + (index + 1)}
                                                                            validationFunc={() => true}
                                                                            validationText={"Campo obbligatorio"}
                                                                            persistingValidationText={false}
                                                                            validationMark={false}
                                                                            defaultValue={attachment.path}
                                                                            isMandatory={true}
                                                                            errorMessage={"Compilare i campi obbligatori"}
                                                                            setNewValidation={emailValidation.setValidation}
                                                                            inputProps={{type: "text"}}/>
                                                                    </Col>
                                                                </Row>
                                                            ))}
                                                            {/*    <ListItem key={index} className="icon-left">
                                                                    <RouterDesignLink
                                                                        to={getApiUrl() + attachment.downloadPath}
                                                                        target={"_blank"}
                                                                        title={"Vedi allegato"}>
                                                                        <Icon aria-hidden color="primary"
                                                                            icon="it-chevron-right"/>
                                                                        <span>
                                                                            {attachment.filename}
                                                                        </span>
                                                                    </RouterDesignLink>
                                                                </ListItem>*/}
                                                        </List>
                                                    </>
                                                ) : (
                                                    <span>Nessun allegato</span>
                                                )}
                                            </Col>
                                        </Row>
                                        <Row className={"align-items-center mt-4"}>
                                            <Col md={3}>
                                                <Button color={"primary"}
                                                        type={"submit"}
                                                        disabled={!emailValidation.valid || loading}>
                                                    Invia email
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Form>
                                ) : (
                                    <Row className={"mt-4"}>
                                        <Col md={12}>
                                            <i>Ancora da generare</i>
                                        </Col>
                                    </Row>
                                )}

                                <LoadingSpinner loading={loading}/>
                                <SuccessErrorAlert err={err} succ={succ}/>

                                <h3 className={"mt-4"}>Email inviate</h3>
                                {voucherDetails.emails == null || voucherDetails.emails.length === 0 ? (
                                    <span>Nessuna email inviata</span>
                                ) : (
                                    <>
                                        <Row>
                                            {/*
                                    id
                                    sentDate
                                    to
                                    subject
                                    body
                                    attachments*/}
                                            <Col lg={1}>
                                                <strong>#</strong>
                                            </Col>
                                            <Col lg={1}>
                                                <strong>Data invio</strong>
                                            </Col>
                                            <Col lg={2}>
                                                <strong>Destinatario</strong>
                                            </Col>
                                            <Col lg={2}>
                                                <strong>Oggetto</strong>
                                            </Col>
                                            <Col lg={4}>
                                                <strong>Corpo</strong>
                                            </Col>
                                            <Col lg={2}>
                                                <strong>Allegati</strong>
                                            </Col>
                                        </Row>
                                        {voucherDetails.emails.map((emailHistory, index) => (
                                                <Row key={index}>
                                                    <Col lg={1}>
                                                        <span>{emailHistory.id}</span>
                                                    </Col>
                                                    <Col lg={1} className={"text-wrap"}>
                                                        {new Date(emailHistory.sentDate).toLocaleDateString()}
                                                    </Col>
                                                    <Col lg={2} className={"text-wrap text-break"}>
                                                        {emailHistory.to}
                                                    </Col>
                                                    <Col lg={2} className={"text-wrap"}>
                                                        {emailHistory.subject}
                                                    </Col>
                                                    <Col lg={4} className={"text-wrap"}>
                                                        {emailHistory.body}
                                                    </Col>
                                                    <Col lg={2}>
                                                        {emailHistory.attachments == null || emailHistory.attachments.trim() === "" ? (
                                                            <span>Nessun allegato</span>
                                                        ) : (
                                                            <>
                                                                {convertStringAttachments(emailHistory.attachments).map((attachmentName, index) => (
                                                                    <p key={index}>{attachmentName}</p>
                                                                ))}
                                                            </>
                                                        )}

                                                    </Col>

                                                </Row>
                                            )
                                        )}
                                    </>
                                )}

                            </>
                        )}


                    </Container>
                </TabContent>
            </TabContainer>


        </Container>
    );
}
