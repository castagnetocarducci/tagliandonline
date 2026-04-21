import {Container} from "design-react-kit";
import {Link} from "react-router";

export const Home = () => {
    return (
        <Container>
            <h1>TagliandOnline</h1>
            <p className={"mt-4"}>Tagliandi, permessi, domande, direttamente da web</p>
            <p>Seguici su <Link to={"https://github.com/castagnetocarducci/tagliandonline/"} target={"_blank"}>GitHub</Link> </p>
        </Container>
    );
}
