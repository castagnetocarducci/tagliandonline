import {useNavigate} from "react-router";
import {useEffect, useState} from "react";
import type {NumerationRegisterListApiResponse, NumerationRegisterListEntry} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {defaultGETRequestInit, fetchApiAsync} from "../../../utils/fetching.ts";
import {Button, Col, Container, Icon, Row} from "design-react-kit";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";

export function NumerationRegistersList() {
    const navigate = useNavigate();
    const [numerationRegisterList, setNumerationRegisterList] = useState<NumerationRegisterListEntry[]>([]);
    const {err, setErr, setSucc, loading, setLoading} = useErrSuccLoad();

    useEffect(() => {
        const abort = fetchApiAsync<NumerationRegisterListApiResponse>({
            urlFromApiRoot: "/numerations/list",
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null) {
                    setNumerationRegisterList(data.numerationRegisterList);
                }
            }
        });
        return abort;
    }, [setErr, setLoading, setSucc, setNumerationRegisterList]);


    return (
        <Container>
            <h2>Registri di numerazione</h2>
            <Button className={"mb-4"} onClick={() => navigate(`/permits/numerations/new`)}
                    color={"primary"} icon={true} title={"Aggiungi nuovo registro"}>
                        <span className={"rounded-icon me-2"}>
                            <Icon icon={"it-plus"}/>
                        </span>
                Nuovo
            </Button>

            {numerationRegisterList.length > 0 && (
                <Row>
                    <Col md={1}>
                        <strong>#</strong>
                    </Col>
                    <Col md={2}>
                        <strong>Prossimo numero</strong>
                    </Col>
                    <Col md={5}>
                        <strong>Descrizione</strong>
                    </Col>
                    <Col md={3}>
                        <strong>Ultimo aggiornamento</strong>
                    </Col>
                    <Col md={1}>
                        <strong>Modifica</strong>
                    </Col>
                </Row>
            )}
            <hr/>
            {numerationRegisterList.map((numerationRegisterListEntry, index) => (
                <div key={index}>
                    <Row className={"mt-2 d-flex align-items-center"}>
                        <Col md={1} className={""}>
                            {numerationRegisterListEntry.id}
                        </Col>
                        <Col md={2}>
                            <strong>{numerationRegisterListEntry.nextNumber}</strong>
                        </Col>
                        <Col md={5} className={"text-wrap"}>
                            {numerationRegisterListEntry.description}
                        </Col>
                        <Col md={3}>
                            {new Date(numerationRegisterListEntry.updatedAt).toLocaleString()}
                        </Col>
                        <Col md={1}>
                            <Button onClick={() => navigate(`/permits/numerations/${numerationRegisterListEntry.id}`)}
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