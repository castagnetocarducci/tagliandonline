import {useNavigate, useParams} from "react-router";
import {useEffect, useState} from "react";
import type {HistoryEvent, VehicleHistoryApiResponse} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {defaultGETRequestInit, fetchApiAsync} from "../../../utils/fetching.ts";
import {Card, Col, Container, GoBack, Row, Timeline, TimelinePin} from "design-react-kit";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";
import {RouterDesignLink} from "../../../components/links/RouterDesignLink.tsx";
import "../../../styles/timeline-fix.css";

export function ApplicationHistory() {
    const navigate = useNavigate();
    const [vehicleHistoryEvent, setVehicleHistoryEvent] = useState<HistoryEvent[]>([]);
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const urlParams = useParams();

    useEffect(() => {
        if (urlParams.vehicleID == null || urlParams.vehicleID == "") {
            navigate("/vehicles/list");
        }
    }, [navigate, urlParams]);

    useEffect(() => {
        const abort = fetchApiAsync<VehicleHistoryApiResponse>({
            urlFromApiRoot: "/applications/history/" + urlParams.vehicleID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null) {
                    setVehicleHistoryEvent(data.vehicleHistory);
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

            {vehicleHistoryEvent != null && vehicleHistoryEvent.length > 0 && (
                <Timeline>
                    <Row>
                        {vehicleHistoryEvent.map((event, index) => {
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
                        {vehicleHistoryEvent.length > 0 && (
                            <Col xs="12">
                                <TimelinePin iconTitle="Segnaposto" label="Versione corrente" now>
                                    <Card rounded shadow="sm">
                                        <h4 className="it-card-title mb-2">
                                            <RouterDesignLink  to={"/applications/list/" + urlParams.vehicleID}>
                                                Vedi dettagli veicolo corrente
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
