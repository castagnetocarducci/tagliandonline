import {useNavigate} from "react-router";
import {useEffect, useState} from "react";
import type {VehicleListApiResponse, VehicleListEntry} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {defaultGETRequestInit, fetchApiAsync} from "../../../utils/fetching.ts";
import {Button, Col, Container, Icon, Row} from "design-react-kit";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";

export function VehiclesList() {
    const navigate = useNavigate();
    const [vehiclesList, setVehiclesList] = useState<VehicleListEntry[]>([]);
    const {err, setErr, setSucc, loading, setLoading} = useErrSuccLoad();

    useEffect(() => {
        const abort = fetchApiAsync<VehicleListApiResponse>({
            urlFromApiRoot: "/vehicles/list",
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null && data.vehiclesList != null) {
                    setVehiclesList(data.vehiclesList);
                }
            }
        });
        return abort;
    }, [setErr, setLoading, setSucc, setVehiclesList]);


    return (
        <Container>
            <h1 className={"mb-4"}>Veicoli</h1>
            <Button className={"mb-4"} onClick={() => navigate(`/vehicles/list/new`)}
                    color={"primary"} icon={true} title={"Aggiungi nuovo veicolo"}>
                        <span className={"rounded-icon me-2"}>
                            <Icon icon={"it-plus"}/>
                        </span>
                Nuovo
            </Button>

            {vehiclesList.length > 0 && (
                <Row>
                    <Col md={1}>
                        <strong>#</strong>
                    </Col>
                    <Col md={2}>
                        <strong>Targa</strong>
                    </Col>
                    <Col md={3}>
                        <strong>Marca</strong>
                    </Col>
                    <Col md={3}>
                        <strong>Modello</strong>
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
            {vehiclesList.map((vehicleListEntry, index) => (
                <div key={index}>
                    <Row className={"mt-2 d-flex align-items-center"}>
                        <Col md={1} className={""}>
                            {vehicleListEntry.id}
                        </Col>
                        <Col md={2}>
                            {vehicleListEntry.plate}
                        </Col>
                        <Col md={3} className={"text-wrap"}>
                            {vehicleListEntry.brand}
                        </Col>
                        <Col md={3} className={"text-wrap"}>
                            {vehicleListEntry.model}
                        </Col>
                        <Col md={2}>
                            {new Date(vehicleListEntry.updatedAt).toLocaleString()}
                        </Col>
                        <Col md={1}>
                            <Button onClick={() => navigate(`/vehicles/list/${vehicleListEntry.id}`)}
                                    color={"secondary"} icon={true} outline title={"Modifica"}>
                                <Icon icon={"it-pencil"}/>
                            </Button>
                        </Col>
                    </Row>
                    <hr/>
                </div>
            ))}
            {vehiclesList.length === 0 && (
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