import {Alert, Col, Row} from "design-react-kit";

export const SuccessErrorAlert = ({err, succ}: { err: string | null, succ: string | null }) => {

    return (<>
            {err &&
                <Row className='mt-2 mb-4'>
                    <Col>
                        <Alert color='danger'>
                            <strong>Attenzione</strong> {err}
                        </Alert>
                    </Col>
                </Row>
            }
            {
                succ &&
                <Row className='mt-2 mb-4'>
                    <Col>
                        <Alert color='success'>
                            {succ}
                        </Alert>
                    </Col>
                </Row>
            }
        </>
    )
}
