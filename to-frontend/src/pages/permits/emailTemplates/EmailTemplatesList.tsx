import {useNavigate} from "react-router";
import {useEffect, useState} from "react";
import type {EmailTemplateListApiResponse, EmailTemplateListEntry} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {defaultGETRequestInit, fetchApiAsync} from "../../../utils/fetching.ts";
import {Button, Col, Container, Icon, Row} from "design-react-kit";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";
import {ValidatedInput} from "../../../components/form/ValidatedInput.tsx";

export function EmailTemplatesList() {
    const navigate = useNavigate();
    const [emailTemplatesList, setEmailTemplatesList] = useState<EmailTemplateListEntry[]>([]);
    const {err, setErr, setSucc, loading, setLoading} = useErrSuccLoad();
    const [showDisabled, setShowDisabled] = useState<boolean>(false);

    useEffect(() => {
        const abort = fetchApiAsync<EmailTemplateListApiResponse>({
            urlFromApiRoot: "/templates/email/list",
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null && data.emailTemplatesList != null) {
                    setEmailTemplatesList(data.emailTemplatesList);
                }
            }
        });
        return abort;
    }, [setErr, setLoading, setSucc, setEmailTemplatesList]);


    return (
        <Container>
            <h2>Modelli di email</h2>
            <Button className={"mb-4"} onClick={() => navigate(`/permits/emailTemplates/new`)}
                    color={"primary"} icon={true} title={"Aggiungi nuovo modello"}>
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
            {emailTemplatesList.length > 0 && (
                <Row>
                    <Col md={1}>
                        <strong>#</strong>
                    </Col>
                    <Col md={1}>
                        <strong>Stato</strong>
                    </Col>
                    <Col md={5}>
                        <strong>Descrizione</strong>
                    </Col>
                    <Col md={4}>
                        <strong>Ultimo aggiornamento</strong>
                    </Col>
                    <Col md={1}>
                        <strong>Modifica</strong>
                    </Col>
                </Row>
            )}
            <hr/>
            {emailTemplatesList.filter((emailTemplateListEntry) => {
                //in react il valore boolean non si comporta correttamente nelle condizioni, quindi meglio fare il cast a string
                return emailTemplateListEntry.disabled ? "" + showDisabled === "true" : true;
            }).map((emailTemplateListEntry, index) => (
                <div key={index}>
                    <Row className={"mt-2 d-flex align-items-center"}>
                        <Col md={1} className={""}>
                            {emailTemplateListEntry.id}
                        </Col>
                        <Col md={1}>
                            {emailTemplateListEntry.disabled ? "Disabilitato" : "Attivo"}
                        </Col>
                        <Col md={5} className={"text-wrap"}>
                            {emailTemplateListEntry.description}
                        </Col>
                        <Col md={4}>
                            {new Date(emailTemplateListEntry.updatedAt).toLocaleString()}
                        </Col>
                        <Col md={1}>
                            <Button onClick={() => navigate(`/permits/emailTemplates/${emailTemplateListEntry.id}`)}
                                    color={"secondary"} icon={true} outline title={"Modifica"}>
                                <Icon icon={"it-pencil"}/>
                            </Button>
                        </Col>
                    </Row>
                    <hr/>
                </div>
            ))}
            {emailTemplatesList.length === 0 && (
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