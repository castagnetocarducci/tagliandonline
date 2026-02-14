import {Alert, Col, Row} from "design-react-kit";

export const SuccessErrorAlert = ({err, succ}: { err: string | null, succ: string | null }) => {

    return (<>
            {err &&
                <Row className='mt-2 mb-4'>
                    <Col>
                        <Alert color='danger'>
                            <strong>Attenzione</strong> {err.toString()}
                        </Alert>
                    </Col>
                </Row>
            }
            {
                succ &&
                <Row className='mt-2 mb-4'>
                    <Col>
                        <Alert color='success'>
                            {succ.toString()}
                        </Alert>
                    </Col>
                </Row>
            }
        </>
    )
}
