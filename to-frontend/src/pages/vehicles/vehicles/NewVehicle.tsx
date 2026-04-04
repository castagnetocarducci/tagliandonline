import {type FormEvent, type FormEventHandler} from "react";
import type {AddedElementMessageApiResponse} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {useValidateFormInput} from "../../../hooks/useValidateFormInput.ts";
import {defaultPOSTRequestInit, fetchApiAsync} from "../../../utils/fetching.ts";
import {Button, Col, Container, Form, GoBack, Row} from "design-react-kit";
import {ValidatedInput} from "../../../components/form/ValidatedInput.tsx";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";
import {useNavigate} from "react-router";

export function NewVehicle() {
    const navigate = useNavigate();
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const {valid, setValidation, getValueObject, executeValidation} = useValidateFormInput(setErr, setSucc);

    const onFormSubmit: FormEventHandler<HTMLFormElement> = (e: FormEvent) => {
        e.preventDefault();
        if (!valid) {
            executeValidation(true);
            return;
        }
        const formValues = getValueObject();
        fetchApiAsync<AddedElementMessageApiResponse>({
            urlFromApiRoot: "/vehicles/new",
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {
                ...defaultPOSTRequestInit,
                body: JSON.stringify(formValues)
            },
            callback: (data) => {
                if (data != null && data.id != null) {
                    navigate("/vehicles/list/" + data.id);
                }
            }
        });
    }

    const createFakeVehicles = () => {
        for (let i = 0; i < 100; i++) {
            fetchApiAsync<AddedElementMessageApiResponse>({
                urlFromApiRoot: "/vehicles/new",
                errSuccLoading: {setErr, setSucc, setLoading},
                requestInit: {
                    ...defaultPOSTRequestInit,
                    body: JSON.stringify({
                        plate: "AB" + i,
                        brand: "Marca " + i,
                        model: "Modello " + i
                    })
                },
                callback: (data) => {
                    console.log(data);
                }
            });
        }
        for (let i = 0; i < 100; i++) {
            fetchApiAsync<AddedElementMessageApiResponse>({
                urlFromApiRoot: "/vehicles/new",
                errSuccLoading: {setErr, setSucc, setLoading},
                requestInit: {
                    ...defaultPOSTRequestInit,
                    body: JSON.stringify({
                        plate: i + "CD",
                        brand: "Marca " + i,
                        model: "Modello " + i
                    })
                },
                callback: (data) => {
                    console.log(data);
                }
            });
        }
        for (let i = 0; i < 100; i++) {
            fetchApiAsync<AddedElementMessageApiResponse>({
                urlFromApiRoot: "/vehicles/new",
                errSuccLoading: {setErr, setSucc, setLoading},
                requestInit: {
                    ...defaultPOSTRequestInit,
                    body: JSON.stringify({
                        plate: "EF" + i + "HG",
                        brand: "Marca " + i,
                        model: "Modello " + i
                    })
                },
                callback: (data) => {
                    console.log(data);
                }
            });
        }
    }


    return (
        <Container>
            <GoBack link>
                Torna indietro
            </GoBack>
            <h2>Nuovo veicolo</h2>

            <Form onSubmit={onFormSubmit} className={"mt-4"}>

                <Row className={"mt-4"}>
                    <Col md={3}>
                        <ValidatedInput name={"plate"} labelText={"Targa"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={""}
                                        isMandatory={true}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "text"}}/>
                    </Col>
                    <Col md={3}>
                        <ValidatedInput name={"brand"} labelText={"Marca"}
                                        validationFunc={() => true}
                                        validationText={"Campo obbligatorio"} persistingValidationText={false}
                                        validationMark={false}
                                        defaultValue={""}
                                        isMandatory={true}
                                        errorMessage={"Compilare i campi obbligatori"}
                                        setNewValidation={setValidation}
                                        inputProps={{type: "text"}}/>
                    </Col>
                    <Col md={4}>
                        <ValidatedInput name={"model"} labelText={"Modello"}
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

                <Row className={"mt-4"}>
                    <Col md={4}>
                        <Button color={"primary"} type={"submit"} disabled={!valid || loading}> Salva </Button>
                    </Col>
                </Row>



                <LoadingSpinner loading={loading}/>

                <SuccessErrorAlert err={err} succ={succ}/>

            </Form>

            {import.meta.env.DEV && (
                <Row className={"mt-4"}>
                    <Col md={4}>
                        <Button color={"primary"} onClick={() => createFakeVehicles()} outline> Crea veicoli
                            fittizi </Button>
                    </Col>
                </Row>
            )}

        </Container>
    );
}
