import {useNavigate} from "react-router";
import {useEffect, useState} from "react";
import type {DocTemplateListApiResponse, DocTemplateListEntry} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {defaultGETRequestInit, fetchApiAsync} from "../../../utils/fetching.ts";
import {Button, Col, Container, Icon, Row} from "design-react-kit";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";
import {ValidatedInput} from "../../../components/form/ValidatedInput.tsx";

export function DocTemplatesList() {
    const navigate = useNavigate();
    const [docTemplatesList, setDocTemplatesList] = useState<DocTemplateListEntry[]>([]);
    const {err, setErr, setSucc, loading, setLoading} = useErrSuccLoad();
    const [showDisabled, setShowDisabled] = useState(false);

    useEffect(() => {
        const abort = fetchApiAsync<DocTemplateListApiResponse>({
            urlFromApiRoot: "/templates/doc/list",
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null) {
                    setDocTemplatesList(data.docTemplatesList);
                }
            }
        });
        return abort;
    }, [setErr, setLoading, setSucc, setDocTemplatesList]);


    return (
        <Container>
            <h2>Modelli di documento</h2>
            <Button className={"mb-4"} onClick={() => navigate(`/permits/docTemplates/new`)}
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
            {docTemplatesList.length > 0 && (
                <Row>
                    <Col md={1}>
                        <strong>#</strong>
                    </Col>
                    <Col md={1}>
                        <strong>Stato</strong>
                    </Col>
                    <Col md={4}>
                        <strong>Descrizione</strong>
                    </Col>
                    <Col md={3}>
                        <strong>Percorso</strong>
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
            {docTemplatesList.filter((docTemplateListEntry) => {
                return docTemplateListEntry.disabled ? showDisabled : true;
            }).map((docTemplateListEntry, index) => (
                <div key={index}>
                    <Row className={"mt-2 d-flex align-items-center"}>
                        <Col md={1} className={""}>
                            {docTemplateListEntry.id}
                        </Col>
                        <Col md={1}>
                            {docTemplateListEntry.disabled ? "Disabilitato" : "Attivo"}
                        </Col>
                        <Col md={4} className={"text-wrap"}>
                            {docTemplateListEntry.description}
                        </Col>
                        <Col md={3} className={"text-wrap text-break"}>
                            <i>{docTemplateListEntry.path}</i>
                        </Col>
                        <Col md={2}>
                            {new Date(docTemplateListEntry.updatedAt).toLocaleString()}
                        </Col>
                        <Col md={1}>
                            <Button onClick={() => navigate(`/permits/docTemplates/${docTemplateListEntry.id}`)}
                                    color={"secondary"} icon={true} outline title={"Modifica"}>
                                <Icon icon={"it-pencil"}/>
                            </Button>
                        </Col>
                    </Row>
                    <hr/>
                </div>
            ))}

            <LoadingSpinner loading={loading}/>

            <SuccessErrorAlert err={err} succ={null}/>
        </Container>
    )
}