import {Col, Container, Row} from "design-react-kit";
import {useUserDataContext} from "../../hooks/useUserDataContext.ts";
import {Link, useNavigate} from "react-router";
import {useEffect} from "react";

export const Profile = () => {
    const userDataCtx = useUserDataContext();
    const navigate = useNavigate();

    useEffect(() => {
        if (userDataCtx.userData == null) {
            navigate("/login");
        }
    }, [userDataCtx, navigate]);


    return (
        <Container>
            <h1>Il mio profilo</h1>

            {userDataCtx.userData && (
                <div className={"mt-4"}>
                    <Row>
                        <Col>
                            <Row><Col><strong>ID:</strong> {userDataCtx.userData.id}</Col></Row>
                            <Row><Col><strong>Ruolo:</strong> {userDataCtx.userData.role}</Col></Row>
                            <Row><Col><strong>Username:</strong> {userDataCtx.userData.username}</Col></Row>
                            <Row><Col><strong>Email:</strong> {userDataCtx.userData.email}</Col></Row>
                            <Row><Col><strong>Nome:</strong> {userDataCtx.userData.firstName}</Col></Row>
                            <Row><Col><strong>Cognome:</strong> {userDataCtx.userData.lastName}</Col></Row>
                            <Row><Col><strong>CF:</strong> {userDataCtx.userData.cf}</Col></Row>
                            <Row><Link to={"/password-reset"} className={"mt-2"}>Cambia password</Link></Row>
                        </Col>
                    </Row>
                </div>
            )}

        </Container>
    );
}
