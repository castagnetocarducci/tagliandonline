import {useNavigate, useParams} from "react-router";
import {useEffect, useState} from "react";
import type {ApplicationHistoryApiResponse, HistoryEvent} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {defaultGETRequestInit, fetchApiAsync} from "../../../utils/fetching.ts";
import {Card, Col, Container, GoBack, Row, Timeline, TimelinePin} from "design-react-kit";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";
import {RouterDesignLink} from "../../../components/links/RouterDesignLink.tsx";
import "../../../styles/timeline-fix.css";

export function ApplicationHistory() {
    const navigate = useNavigate();
    const [applicationHistoryEvent, setApplicationHistoryEvent] = useState<HistoryEvent[]>([]);
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const urlParams = useParams();

    useEffect(() => {
        if (urlParams.applicationID == null || urlParams.applicationID == "") {
            navigate("/applications/list");
        }
    }, [navigate, urlParams]);

    useEffect(() => {
        const abort = fetchApiAsync<ApplicationHistoryApiResponse>({
            urlFromApiRoot: "/applications/history/" + urlParams.applicationID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null) {
                    setApplicationHistoryEvent(data.applicationHistory);
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
            <h2>Storico veicolo</h2>

            {applicationHistoryEvent != null && applicationHistoryEvent.length > 0 && (
                <Timeline>
                    <Row>
                        {applicationHistoryEvent.map((event, index) => {
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
                                                            <strong>{event.modificationsMap[key].description}:</strong> {event.modificationsMap[key].value}
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
                        {applicationHistoryEvent.length > 0 && (
                            <Col xs="12">
                                <TimelinePin iconTitle="Segnaposto" label="Versione corrente" now>
                                    <Card rounded shadow="sm">
                                        <h4 className="it-card-title mb-2">
                                            <RouterDesignLink  to={"/applications/list/" + urlParams.applicationID}>
                                                Vedi dettagli domanda corrente
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
