import {Container} from "design-react-kit";
import {useUserDataContext} from "../../hooks/useUserDataContext.tsx";
import {useNavigate} from "react-router";
import {useEffect} from "react";

export const Profile = () => {
    const userData = useUserDataContext();
    const navigate = useNavigate();

    useEffect(() => {
        if (userData.userData == null) {
            navigate("/login");
        }
    }, [userData, navigate]);

    return (
        <Container>
            <h1>Il mio profilo</h1>
        </Container>
    );
}
