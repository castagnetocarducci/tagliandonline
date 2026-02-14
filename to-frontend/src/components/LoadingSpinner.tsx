import {Col, Spinner} from "design-react-kit";


export function LoadingSpinner({loading}: { loading: boolean }) {
    return (
        <>
            {loading &&
                <Col className="d-flex text-center justify-content-center">
                    <Spinner active/>
                </Col>
            }
        </>

    )
}