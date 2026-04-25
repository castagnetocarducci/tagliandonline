import {type FormEvent, type FormEventHandler, useEffect, useState} from "react";
import type {
    AddedElementMessageApiResponse,
    PermitListEntry,
    VoucherAvailableOptionsApiResponse
} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {useValidateFormInput, type ValidationSupportedTypes} from "../../../hooks/useValidateFormInput.ts";
import {defaultGETRequestInit, defaultPOSTRequestInit, fetchApiAsync} from "../../../utils/fetching.ts";
import {Button, Col, Container, Form, GoBack, Row} from "design-react-kit";
import {ValidatedInput} from "../../../components/form/ValidatedInput.tsx";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";
import {useNavigate} from "react-router";
import {type SelectOption, ValidatedSelect} from "../../../components/form/ValidatedSelect.tsx";
import {ValidatedVehiclesList} from "../../../components/form/ValidatedVehiclesList.tsx";

export function NewVoucher() {
    const navigate = useNavigate();
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);
    const [permitsList, setPermitsList] = useState<PermitListEntry[]>([]);
    const [vehiclesAmount, setVehiclesAmount] = useState<number>(2);

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

    const onFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();
        if (!valid) {
            executeValidation(true);
            return;
        }
        const formValues = getValueObject();
        fetchApiAsync<AddedElementMessageApiResponse>({
            urlFromApiRoot: "/vouchers/new",
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(formValues)
            },
            callback: (data) => {
                if (data != null && data.id != null) {
                    navigate("/vouchers/list/" + data.id);
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
            <GoBack link>
                Torna indietro
            </GoBack>
            <h2>Nuovo tagliando</h2>

            <Form onSubmit={onFormSubmit} className={"mt-4"}>

                <Row className={"mt-4"}>
                    {/*
        validFromDate,
        validToDate,
        permitId,
        */}
                    <Col md={3}>
                        <ValidatedInput name={"validFromDate"} labelText={"Valido dal"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "date"}}/>
                    </Col>
                    <Col md={3}>
                        <ValidatedInput name={"validToDate"} labelText={"Scadenza"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={""}
                                        isMandatory={false}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "date"}}/>
                    </Col>
                    <Col md={4}>
                        <ValidatedSelect name={"permitId"} validationFunc={() => true}
                                         validationText={"Campo obbligatorio"} persistingValidationText={false}
                                         defaultValue={""}
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
                                        defaultValue={""}
                                        isMandatory={false}
                                        errorMessage={""}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "text"}}/>
                    </Col>
                </Row>

                <Row>
                    <Col md={4}>
                        <Button color={"primary"} type={"submit"} disabled={!valid || loading}> Salva </Button>
                    </Col>
                </Row>

                <LoadingSpinner loading={loading}/>

                <SuccessErrorAlert err={err} succ={succ}/>

            </Form>

            <Row className={"mt-4"}>
                <ValidatedVehiclesList name={"vehicles"} validationFunc={() => true}
                                       validationText={"Campo obbligatorio"} defaultValue={[]} isMandatory={true}
                                       errorMessage={"Devi associare un numero corretto di veicoli"}
                                       setNewValidation={setValidation}
                                       labelText={"Veicoli associati"} amount={vehiclesAmount} exactAmount={true}/>

            </Row>
        </Container>
    );
}
