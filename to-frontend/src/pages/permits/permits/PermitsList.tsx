import {useNavigate} from "react-router";
import {useEffect, useState} from "react";
import type {PermitListApiResponse, PermitListEntry} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {defaultGETRequestInit, fetchApiAsync} from "../../../utils/fetching.ts";
import {Button, Col, Container, Icon, Row} from "design-react-kit";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";
import {ValidatedInput} from "../../../components/form/ValidatedInput.tsx";

export function PermitsList() {
    const navigate = useNavigate();
    const [permitsList, setPermitsList] = useState<PermitListEntry[]>([]);
    const {err, setErr, setSucc, loading, setLoading} = useErrSuccLoad();
    const [showDisabled, setShowDisabled] = useState<boolean>(false);

    useEffect(() => {
        const abort = fetchApiAsync<PermitListApiResponse>({
            urlFromApiRoot: "/permits/list",
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null && data.permitsList != null) {
                    setPermitsList(data.permitsList);
                }
            }
        });
        return abort;
    }, [setErr, setLoading, setSucc, setPermitsList]);


    return (
        <Container>
            <h2>Permessi</h2>
            <Button className={"mb-4"} onClick={() => navigate(`/permits/list/new`)}
                    color={"primary"} icon={true} title={"Aggiungi nuovo permesso"}>
                        <span className={"rounded-icon me-2"}>
                            <Icon icon={"it-plus"}/>
                        </span>
                Nuovo
            </Button>
            <ValidatedInput name={"disabledFilter"} validationFunc={() => true}
                            validationText={""} persistingValidationText={false} validationMark={false}
                            defaultValue={false} isMandatory={false}
                            errorMessage={""} setNewValidation={() => {
            }}
                            labelText={"Mostra disabilitati"}
                            inputProps={{type: "checkbox", className: "form-check-input"}}
                            valueChangedCallback={(newValue) => setShowDisabled(newValue as boolean)}/>
            {permitsList.length > 0 && (
                <Row>
                    <Col md={1}>
                        <strong>#</strong>
                    </Col>
                    <Col md={1}>
                        <strong>Stato</strong>
                    </Col>
                    <Col md={3}>
                        <strong>Descrizione</strong>
                    </Col>
                    <Col md={2}>
                        <strong>Targhe simultanee</strong>
                    </Col>
                    <Col md={2}>
                        <strong>Targhe in domanda</strong>
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
            {permitsList.filter((permitListEntry) => {
                return permitListEntry.disabled ? "" + showDisabled === "true" : true;
            }).map((permitListEntry, index) => (
                <div key={index}>
                    <Row className={"mt-2 d-flex align-items-center"}>
                        <Col md={1} className={""}>
                            {permitListEntry.id}
                        </Col>
                        <Col md={1}>
                            {permitListEntry.disabled ? "Disabilitato" : "Attivo"}
                        </Col>
                        <Col md={3} className={"text-wrap"}>
                            {permitListEntry.description}
                        </Col>
                        <Col md={2}>
                            {permitListEntry.simultaneousPlatesAmount}
                        </Col>
                        <Col md={2}>
                            {permitListEntry.applicationPlatesAmount}
                        </Col>
                        <Col md={2}>
                            {new Date(permitListEntry.updatedAt).toLocaleString()}
                        </Col>
                        <Col md={1}>
                            <Button onClick={() => navigate(`/permits/list/${permitListEntry.id}`)}
                                    color={"secondary"} icon={true} outline title={"Modifica"}>
                                <Icon icon={"it-pencil"}/>
                            </Button>
                        </Col>
                    </Row>
                    <hr/>
                </div>
            ))}
            {permitsList.length === 0 && (
                <>
                    <Row>
                        <strong>Nessun risultato</strong>
                    </Row>
                    <hr/>
                </>
            )}

            <LoadingSpinner loading={loading}/>

            <SuccessErrorAlert err={err} succ={null}/>
        </Container>
    )
}