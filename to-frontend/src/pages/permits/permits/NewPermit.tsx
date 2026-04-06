import {type FormEvent, type FormEventHandler, useEffect, useState} from "react";
import type {
    AddedElementMessageApiResponse,
    DocTemplateListEntry,
    EmailTemplateListEntry, NumerationRegisterListEntry,
    PermitAvailableTemplatesApiResponse
} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {useValidateFormInput} from "../../../hooks/useValidateFormInput.ts";
import {defaultGETRequestInit, defaultPOSTRequestInit, fetchApiAsync} from "../../../utils/fetching.ts";
import {Button, Col, Container, Form, GoBack, Row} from "design-react-kit";
import {ValidatedInput} from "../../../components/form/ValidatedInput.tsx";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";
import {useNavigate} from "react-router";
import {type SelectOption, ValidatedSelect} from "../../../components/form/ValidatedSelect.tsx";

export function NewPermit() {
    const navigate = useNavigate();
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);
    const [docTemplateList, setDocTemplateList] = useState<DocTemplateListEntry[]>([]);
    const [emailTemplateList, setEmailTemplateList] = useState<EmailTemplateListEntry[]>([]);
    const [numerationRegistersList, setNumerationRegistersList] = useState<NumerationRegisterListEntry[]>([]);

    useEffect(() => {
        const abort = fetchApiAsync<PermitAvailableTemplatesApiResponse>({
            urlFromApiRoot: "/permits/availableTemplates",
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null) {
                    setDocTemplateList(data.docTemplatesList);
                    setEmailTemplateList(data.emailTemplatesList);
                    setNumerationRegistersList(data.numerationRegisterList);
                }
            }
        });
        return abort;
    }, [setErr, setLoading, setSucc, setDocTemplateList, setEmailTemplateList]);

    const onFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();
        if (!valid) {
            executeValidation(true);
            return;
        }
        const formValues = getValueObject();
        fetchApiAsync<AddedElementMessageApiResponse>({
            urlFromApiRoot: "/permits/new",
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(formValues)
            },
            callback: (data) => {
                if (data != null && data.id != null) {
                    navigate("/permits/list/" + data.id);
                }
            }
        });
    }

    const selectableDocTemplates: SelectOption[] = [{label: "seleziona", value: ""}];
    if (docTemplateList.length > 0) {
        for (const docTemplateListEntry of docTemplateList) {
            if (docTemplateListEntry.disabled) {
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
            if (emailTemplateListEntry.disabled) {
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
            if (numerationRegisterListEntry.disabled) {
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
            <h2>Nuovo permesso</h2>

            <Form onSubmit={onFormSubmit} className={"mt-4"}>

                <Row className={"mt-4"}>
                    <Col md={6}>
                        <ValidatedInput name={"description"} labelText={"Descrizione"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={""}
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
                                        defaultValue={""}
                                        isMandatory={true}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "text"}}/>
                    </Col>
                </Row>
                <Row>
                    <Col md={3}>
                        <ValidatedInput name={"simultaneousPlatesAmount"} labelText={"Targhe simultanee"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={1}
                                        isMandatory={true}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "number"}}/>
                    </Col>
                    <Col md={3}>
                        <ValidatedInput name={"applicationPlatesAmount"} labelText={"Targhe in domanda"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={2}
                                        isMandatory={true}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "number"}}/>
                    </Col>
                    <Col md={4}>
                        <ValidatedInput name={"voucherDurationDays"} labelText={"Durata tagliando (giorni)"}
                                        validationFunc={(value) => parseInt("" + value) > 0}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={365}
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
                                         defaultValue={""}
                                         isMandatory={true}
                                         errorMessage={"Compilare i campi obbligatori"}
                                         setNewValidation={setValidation}
                                         labelText={"Mail approvazione"}
                                         options={selectableEmailTemplates}/>
                    </Col>
                    <Col md={4}>
                        <ValidatedSelect name={"revokeEmailTemplateId"} validationFunc={() => true}
                                         validationText={"Campo obbligatorio"} persistingValidationText={false}
                                         defaultValue={""}
                                         isMandatory={true}
                                         errorMessage={"Compilare i campi obbligatori"}
                                         setNewValidation={setValidation}
                                         labelText={"Mail revoca"}
                                         options={selectableEmailTemplates}/>
                    </Col>
                    <Col md={4}>
                        <ValidatedSelect name={"refuseEmailTemplateId"} validationFunc={() => true}
                                         validationText={"Campo obbligatorio"} persistingValidationText={false}
                                         defaultValue={""}
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
                                         defaultValue={""}
                                         isMandatory={true}
                                         errorMessage={"Compilare i campi obbligatori"}
                                         setNewValidation={setValidation}
                                         labelText={"Modello tagliando"}
                                         options={selectableDocTemplates}/>
                    </Col>
                    <Col md={4}>
                        <ValidatedSelect name={"authorizationTemplateId"} validationFunc={() => true}
                                         validationText={"Campo obbligatorio"} persistingValidationText={false}
                                         defaultValue={""}
                                         isMandatory={true}
                                         errorMessage={"Compilare i campi obbligatori"}
                                         setNewValidation={setValidation}
                                         labelText={"Modello autorizzazione"}
                                         options={selectableDocTemplates}/>
                    </Col>
                    <Col md={4}>
                        <ValidatedSelect name={"numerationRegisterId"} validationFunc={() => true}
                                         validationText={"Campo obbligatorio"} persistingValidationText={false}
                                         defaultValue={""}
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
                                        defaultValue={""}
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

                <LoadingSpinner loading={loading}/>

                <SuccessErrorAlert err={err} succ={succ}/>

            </Form>
        </Container>
    );
}
