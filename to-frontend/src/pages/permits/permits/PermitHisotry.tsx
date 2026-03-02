import {useNavigate, useParams} from "react-router";
import {useEffect, useState} from "react";
import type {HistoryEvent, PermitHistoryApiResponse} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {defaultGETRequestInit, fetchApiAsync} from "../../../utils/fetching.ts";
import {Card, Col, Container, GoBack, Row, Timeline, TimelinePin} from "design-react-kit";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";
import {RouterDesignLink} from "../../../components/links/RouterDesignLink.tsx";
import "../../../styles/timeline-fix.css";

export function PermitHistory() {
    const navigate = useNavigate();
    const [permitHistoryEvent, setPermitHistoryEvent] = useState<HistoryEvent[]>([]);
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const urlParams = useParams();

    useEffect(() => {
        if (urlParams.permitID == null || urlParams.permitID == "") {
            navigate("/permits/list");
        }
    }, [navigate, urlParams]);

    useEffect(() => {
        const abort = fetchApiAsync<PermitHistoryApiResponse>({
            urlFromApiRoot: "/permits/history/" + urlParams.permitID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null) {
                    console.log(data);
                    setPermitHistoryEvent(data.permitHistory);
                }
            }
        });
        return abort;
    }, [setErr, setLoading, setSucc, urlParams]);


    return (
        <Container>
            <GoBack link>
                Torna indietro
            </GoBack>
            <h2>Storico permesso</h2>

            {permitHistoryEvent != null && permitHistoryEvent.length > 0 && (
                <Timeline>
                    <Row>
                        {permitHistoryEvent.map((event, index) => {
                                const timestamp = new Date(event.timestamp);
                                return (
                                    <Col xs="12" key={index}>
                                        <TimelinePin iconTitle="Segnaposto"
                                                     label={(index === 0 ? "Creazione: " : "Modifica: ") + timestamp.toLocaleDateString()}
                                                     past>
                                            <Card rounded shadow="sm">
                                                <h4 className="it-card-title">
                                                    {event.username} [id: {event.userId}]
                                                </h4>

                                                <div className="it-card-body">
                                                    {Object.keys(event.modificationsMap).map((key, index) => (
                                                        <p className="it-card-text" key={index}>
                                                            <strong>{key}:</strong> {event.modificationsMap[key]}
                                                        </p>
                                                    ))}
                                                </div>
                                                <footer className="it-card-related it-card-footer">
                                                    <time className="it-card-date" dateTime={timestamp.toLocaleString()}>
                                                        {timestamp.toLocaleString()}
                                                    </time>
                                                </footer>
                                            </Card>
                                        </TimelinePin>
                                    </Col>

                                )
                            }
                        )}
                        {permitHistoryEvent.length > 0 && (
                            <Col xs="12">
                                <TimelinePin iconTitle="Segnaposto" label="Versione corrente" now>
                                    <Card rounded shadow="sm">
                                        <h4 className="it-card-title mb-2">
                                            <RouterDesignLink  to={"/permits/list/" + urlParams.permitID}>
                                                Vedi dettagli permesso corrente
                                            </RouterDesignLink>
                                        </h4>
                                    </Card>
                                </TimelinePin>
                            </Col>
                        )}

                    </Row>
                </Timeline>
            )}

            <LoadingSpinner loading={loading}/>

            <SuccessErrorAlert err={err} succ={succ}/>

        </Container>
    );
}
