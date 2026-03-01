import {useNavigate, useParams} from "react-router";
import {type FormEvent, type FormEventHandler, useEffect, useState} from "react";
import type {
    DataMessage,
    DocTemplateListEntry,
    EmailTemplateListEntry,
    NumerationRegisterListEntry,
    PermitAvailableTemplatesApiResponse,
    PermitDetails,
    PermitDetailsApiResponse
} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {useValidateFormInput} from "../../../hooks/useValidateFormInput.ts";
import {defaultGETRequestInit, defaultPOSTRequestInit, fetchApiAsync} from "../../../utils/fetching.ts";
import {Button, Col, Container, Form, GoBack, Row} from "design-react-kit";
import {ValidatedInput} from "../../../components/form/ValidatedInput.tsx";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";
import {type SelectOption, ValidatedSelect} from "../../../components/form/ValidatedSelect.tsx";

export function EditPermit() {
    const navigate = useNavigate();
    const [permitDetails, setPermitDetails] = useState<PermitDetails | null>(null);
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);
    const urlParams = useParams();
    const [docTemplateList, setdocTemplateList] = useState<DocTemplateListEntry[]>([]);
    const [emailTemplateList, setemailTemplateList] = useState<EmailTemplateListEntry[]>([]);
    const [numerationRegistersList, setNumerationRegistersList] = useState<NumerationRegisterListEntry[]>([]);

    useEffect(() => {
        if (urlParams.numerationRegisterID == null || urlParams.numerationRegisterID == "") {
            navigate("/permits/list");
        }
    }, [navigate, urlParams]);

    useEffect(() => {
        const abort = fetchApiAsync<PermitAvailableTemplatesApiResponse>({
            urlFromApiRoot: "/permits/availableTemplates",
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null) {
                    setdocTemplateList(data.docTemplatesList);
                    setemailTemplateList(data.emailTemplatesList);
                    setNumerationRegistersList(data.numerationRegisterList);
                }
            }
        });
        return abort;
    }, [setErr, setLoading, setSucc, setdocTemplateList, setemailTemplateList]);

    useEffect(() => {
        const abort = fetchApiAsync<PermitDetailsApiResponse>({
            urlFromApiRoot: "/permits/detail/" + urlParams.numerationRegisterID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null) {
                    setPermitDetails(data.permit);
                }
            }
        });
        return abort;
    }, [setErr, setLoading, setSucc, urlParams]);

    const onFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();
        if (!valid) {
            executeValidation(true);
            return;
        }
        const formValues = getValueObject();
        fetchApiAsync<DataMessage>({
            urlFromApiRoot: "/permits/edit/" + urlParams.numerationRegisterID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(formValues)
            }
        });
    }

    const selectableDocTemplates: SelectOption[] = [{label: "seleziona", value: ""}];
    if (docTemplateList.length > 0) {
        for (const docTemplateListEntry of docTemplateList) {
            if (docTemplateListEntry.disabled &&
                (permitDetails == null ||
                    (permitDetails.voucherTemplateId !== docTemplateListEntry.id &&
                        permitDetails.authorizationTemplateId !== docTemplateListEntry.id))) {
                continue;
            }
            selectableDocTemplates.push({
                label: docTemplateListEntry.description,
                value: "" + docTemplateListEntry.id
            })
        }
    }

    const selectableEmailTemplates: SelectOption[] = [{label: "seleziona", value: ""}];
    if (emailTemplateList.length > 0) {
        for (const emailTemplateListEntry of emailTemplateList) {
            if (emailTemplateListEntry.disabled &&
                (permitDetails == null ||
                    (permitDetails.approveEmailTemplateId !== emailTemplateListEntry.id &&
                        permitDetails.refuseEmailTemplateId !== emailTemplateListEntry.id &&
                        permitDetails.revokeEmailTemplateId !== emailTemplateListEntry.id))) {
                continue;
            }
            selectableEmailTemplates.push({
                label: emailTemplateListEntry.description,
                value: "" + emailTemplateListEntry.id
            })
        }
    }

    const selectableNumerationRegisters: SelectOption[] = [{label: "seleziona", value: ""}];
    if (numerationRegistersList.length > 0) {
        for (const numerationRegisterListEntry of numerationRegistersList) {
            if (numerationRegisterListEntry.disabled &&
                (permitDetails == null ||
                    (permitDetails.numerationRegisterId !== numerationRegisterListEntry.id))) {
                continue;
            }
            selectableNumerationRegisters.push({
                label: numerationRegisterListEntry.description,
                value: "" + numerationRegisterListEntry.id
            })
        }
    }

    return (
        <Container>
            <GoBack link>
                Torna indietro
            </GoBack>
            <h2>Modifica permesso</h2>
            <Form onSubmit={onFormSubmit} className={"mt-4"}>
                {permitDetails != null && (
                    <>
                        <Row>
                            <Col lg={1}>
                                <p><strong>ID</strong><br/>{permitDetails.id}</p>
                            </Col>
                            <Col lg={3}>
                                <p><strong>Creato
                                    il</strong><br/>{new Date(permitDetails.createdAt).toLocaleString()}</p>
                            </Col>
                            <Col lg={3}>
                                <p><strong>Ultima
                                    modifica</strong><br/>{new Date(permitDetails.updatedAt).toLocaleString()}
                                </p>
                            </Col>
                        </Row>
                        <Row className={"mt-4"}>
                            <Col md={6}>
                                <ValidatedInput name={"description"} labelText={"Descrizione"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={permitDetails.description}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                            <Col md={6}>
                                <ValidatedInput name={"printedName"} labelText={"Nome nel modello"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={permitDetails.printedName}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={2}>
                                <ValidatedInput name={"simultaneousPlatesAmount"} labelText={"Targhe simultanee"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={permitDetails.simultaneousPlatesAmount}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "number"}}/>
                            </Col>
                            <Col md={2}>
                                <ValidatedInput name={"applicationPlatesAmount"} labelText={"Targhe in domanda"}
                                                validationFunc={() => true}
                                                validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={permitDetails.applicationPlatesAmount}
                                                isMandatory={true}
                                                errorMessage={"Compilare i campi obbligatori"}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "number"}}/>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={4}>
                                <ValidatedSelect name={"approveEmailTemplateId"} validationFunc={() => true}
                                                 validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                 defaultValue={"" + permitDetails.approveEmailTemplateId}
                                                 isMandatory={true}
                                                 errorMessage={"Compilare i campi obbligatori"}
                                                 setNewValidation={setValidation}
                                                 labelText={"Mail approvazione"}
                                                 options={selectableEmailTemplates}/>
                            </Col>
                            <Col md={4}>
                                <ValidatedSelect name={"revokeEmailTemplateId"} validationFunc={() => true}
                                                 validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                 defaultValue={"" + permitDetails.revokeEmailTemplateId}
                                                 isMandatory={true}
                                                 errorMessage={"Compilare i campi obbligatori"}
                                                 setNewValidation={setValidation}
                                                 labelText={"Mail revoca"}
                                                 options={selectableEmailTemplates}/>
                            </Col>
                            <Col md={4}>
                                <ValidatedSelect name={"refuseEmailTemplateId"} validationFunc={() => true}
                                                 validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                 defaultValue={"" + permitDetails.refuseEmailTemplateId}
                                                 isMandatory={true}
                                                 errorMessage={"Compilare i campi obbligatori"}
                                                 setNewValidation={setValidation}
                                                 labelText={"Mail rifiuto"}
                                                 options={selectableEmailTemplates}/>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={4}>
                                <ValidatedSelect name={"voucherTemplateId"} validationFunc={() => true}
                                                 validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                 defaultValue={"" + permitDetails.voucherTemplateId}
                                                 isMandatory={true}
                                                 errorMessage={"Compilare i campi obbligatori"}
                                                 setNewValidation={setValidation}
                                                 labelText={"Modello tagliando"}
                                                 options={selectableDocTemplates}/>
                            </Col>
                            <Col md={4}>
                                <ValidatedSelect name={"authorizationTemplateId"} validationFunc={() => true}
                                                 validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                 defaultValue={"" + permitDetails.authorizationTemplateId}
                                                 isMandatory={true}
                                                 errorMessage={"Compilare i campi obbligatori"}
                                                 setNewValidation={setValidation}
                                                 labelText={"Modello autorizzazione"}
                                                 options={selectableDocTemplates}/>
                            </Col>
                            <Col md={4}>
                                <ValidatedSelect name={"numerationRegisterId"} validationFunc={() => true}
                                                 validationText={"Campo obbligatorio"} persistingValidationText={false}
                                                 defaultValue={"" + permitDetails.numerationRegisterId}
                                                 isMandatory={true}
                                                 errorMessage={"Compilare i campi obbligatori"}
                                                 setNewValidation={setValidation}
                                                 labelText={"Registro numerazione"}
                                                 options={selectableNumerationRegisters}/>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={8}>
                                <ValidatedInput name={"notes"} labelText={"Note"}
                                                validationFunc={() => true}
                                                validationText={""} persistingValidationText={false}
                                                validationMark={false}
                                                defaultValue={permitDetails.notes}
                                                isMandatory={false}
                                                errorMessage={""}
                                                setNewValidation={setValidation}
                                                inputProps={{type: "text"}}/>
                            </Col>
                        </Row>
                        <Row className={"mt-4"}>
                            <Col md={4}>
                                <Button color={"primary"} type={"submit"} disabled={!valid || loading}> Salva </Button>
                            </Col>
                        </Row>
                    </>
                )}

                <LoadingSpinner loading={loading}/>

                <SuccessErrorAlert err={err} succ={succ}/>

            </Form>
        </Container>
    );
}
