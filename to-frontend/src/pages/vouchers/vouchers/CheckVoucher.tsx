import {useNavigate, useParams} from "react-router";
import {useEffect, useState} from "react";
import type {VoucherPublicCheck, VoucherPublicCheckApiResponse} from "../../../utils/Types.ts";
import {useErrSuccLoad} from "../../../hooks/useErrSuccLoad.ts";
import {defaultGETRequestInit, fetchApiAsync} from "../../../utils/fetching.ts";
import {Col, Container, Row} from "design-react-kit";
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
                        <h2>
                            Tagliando numero {voucherPublicCheck.number}{'  '}
                            <small className="text-muted">
                                ID univoco: {voucherPublicCheck.id}
                            </small>
                        </h2>
                        (ultimo aggiornamento: {new Date(voucherPublicCheck.updatedAt).toLocaleString()})
                        <h3>
                            <span className={"text-decoration-underline"}><strong>{voucherPublicCheck.currentState}</strong></span>
                        </h3>
                        <h4>
                            Valido dal{' '}
                            {new Date(voucherPublicCheck.validFromDate).toLocaleDateString()}
                            {' '}al{' '}
                            {new Date(voucherPublicCheck.validToDate).toLocaleDateString()}
                        </h4>
                        <h3>
                            Veicoli:
                        </h3>
                        {voucherPublicCheck.vehicles.map((vehicle, index) => (
                            <h4 key={index}>
                                {" - "}<strong>{vehicle.plate}</strong>: {vehicle.brand} {vehicle.model}
                            </h4>
                        ))}

                    </Col>
                    <Col md={6}>
                        <h3>
                            Permesso per {voucherPublicCheck.permit.description}
                            {/*<small className="text-muted">(ID: {voucherPublicCheck.permit.id})</small>*/}
                        </h3>
                        <h4>
                            {voucherPublicCheck.permit.disabled && "Decaduto"}<br/>
                            Veicoli utilizzabili contemporaneamente: {voucherPublicCheck.permit.simultaneousPlatesAmount}<br/>
                            Numero targhe autorizzabili: {voucherPublicCheck.permit.applicationPlatesAmount}
                        </h4>
                    </Col>
                </Row>
            </> : <>

            </>}

            <LoadingSpinner loading={loading}/>

            <SuccessErrorAlert err={err} succ={succ}/>

        </Container>
    );
}
