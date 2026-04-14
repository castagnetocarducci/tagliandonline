import {useNavigate, useParams} from "react-router";
import {useEffect, useState} from "react";
import type {VoucherPublicCheck, VoucherPublicCheckApiResponse} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {defaultGETRequestInit, fetchApiAsync} from "../../../utils/fetching.ts";
import {Col, Container, GoBack, Row} from "design-react-kit";
import {LoadingSpinner} from "../../../components/LoadingSpinner.tsx";
import {SuccessErrorAlert} from "../../../components/SuccessErrorAlert.tsx";

export function CheckVoucher() {
    const navigate = useNavigate();
    const [voucherPublicCheck, setVoucherPublicCheck] = useState<VoucherPublicCheck | null>(null);
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();
    const urlParams = useParams();


    useEffect(() => {
        if (urlParams.voucherID == null || urlParams.voucherID == "") {
            navigate("/vouchers/list");
        }
    }, [navigate, urlParams]);

    useEffect(() => {
        const abort = fetchApiAsync<VoucherPublicCheckApiResponse>({
            urlFromApiRoot: "/vouchers/check/" + urlParams.voucherID,
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null) {
                    setVoucherPublicCheck(data.voucherPublicCheck);
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
            <h2>Controllo tagliando online</h2>

            {/*
            id: number,
            createdAt: Date,
            updatedAt: Date,
            number: number,
            revoked: boolean,
            validFromDate: Date,
            validToDate: Date,

            permit: {
                id: number,
                description: string,
                disabled: boolean,
                simultaneousPlatesAmount: number,
                applicationPlatesAmount: number,
                voucherDurationDays: number
            },

            vehicles: {
                id: number,
                plate: string,
                model: string,
                brand: string,
            }[]
            */}
            {voucherPublicCheck != null ? <>
                <Row>
                    <Col md={6}>
                        <h3>
                            Tagliando numero {voucherPublicCheck.number}{'  '}
                            <small className="text-muted">
                                ID univoco: {voucherPublicCheck.number} (ultimo aggiornamento: {new Date(voucherPublicCheck.updatedAt).toLocaleString()})
                            </small>
                        </h3>
                        <h4>
                            {voucherPublicCheck.currentState}
                        </h4>
                        <h5>
                            Valido dal
                            {new Date(voucherPublicCheck.validFromDate).toLocaleDateString()}
                            al{' '}
                            {new Date(voucherPublicCheck.validToDate).toLocaleDateString()}
                        </h5>
                        <h4>
                            Veicoli:
                        </h4>
                        {voucherPublicCheck.vehicles.map((vehicle, index) => (
                            <h5 key={index}>
                                <strong>{vehicle.plate}</strong>: {vehicle.brand} {vehicle.model}
                            </h5>
                        ))}

                    </Col>
                    <Col md={6}>
                        <h4>
                            Permesso <small className="text-muted">{voucherPublicCheck.permit.id}</small> per {voucherPublicCheck.permit.description}
                        </h4>
                        <h5>
                            {voucherPublicCheck.permit.disabled && "Decaduto"}
                            Veicoli utilizzabili contemporaneamente: {voucherPublicCheck.permit.simultaneousPlatesAmount}
                            Numero targhe autorizzabili: {voucherPublicCheck.permit.applicationPlatesAmount}
                        </h5>
                    </Col>
                </Row>
            </> : <>

            </>}

            <LoadingSpinner loading={loading}/>

            <SuccessErrorAlert err={err} succ={succ}/>

        </Container>
    );
}
