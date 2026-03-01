import {Button, Col, Container, Icon, Table} from "design-react-kit";
import {useUserDataContext} from "../../hooks/useUserDataContext.ts";
import {useNavigate} from "react-router";
import {useEffect, useState} from "react";
import type {UserListEntry, UserListEntryApiResponse} from "../../utils/Types.ts";
import {defaultGETRequestInit, fetchApiAsync} from "../../utils/fetching.ts";
import {useErrSuccLoad} from "../../hooks/useErrSuccLoad.ts";
import {SuccessErrorAlert} from "../../components/SuccessErrorAlert.tsx";
import {LoadingSpinner} from "../../components/LoadingSpinner.tsx";

export const Users = () => {
    const userDataCtx = useUserDataContext();
    const navigate = useNavigate();
    const [usersList, setUsersList] = useState<UserListEntry[]>([]);
    const {err, setErr, setSucc, loading, setLoading} = useErrSuccLoad();

    useEffect(() => {
        if (userDataCtx.userData == null || userDataCtx.userData.role !== "admin") {
            navigate("/");
        }
    }, [userDataCtx, navigate]);

    useEffect(() => {
        const abort = fetchApiAsync<UserListEntryApiResponse>({
            urlFromApiRoot: "/users/list",
            errSuccLoading: {setErr, setSucc, setLoading},
            requestInit: {...defaultGETRequestInit},
            callback: (data) => {
                if (data != null && data.usersList != null) {
                    setUsersList(data.usersList);
                }
            }
        });
        return abort;
    }, [setErr, setLoading, setSucc, setUsersList]);


    return (
        <Container>
            <h1>Gestione utenti</h1>
            <Col lg={12}>
                <Col md={3}>
                    <Button onClick={() => navigate(`/users/new`)}
                            color={"primary"} icon={true} title={"Aggiungi nuovo utente"}>
                        <span className={"rounded-icon me-2"}>
                        <Icon icon={"it-plus"} />
                            </span>
                        Nuovo
                    </Button>
                </Col>
                <Table>
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Nome</th>
                        <th>Cognome</th>
                        <th>Email</th>
                        <th>Ruolo</th>
                        <th>Disabilitato</th>
                        <th>Modifica</th>
                    </tr>
                    </thead>
                    <tbody>
                    {usersList != null && usersList.map((userListEntry) => (
                        <tr key={userListEntry.id}>
                            <th>{userListEntry.id}</th>
                            <td>{userListEntry.username}</td>
                            <td>{userListEntry.firstName}</td>
                            <td>{userListEntry.lastName}</td>
                            <td>{userListEntry.email}</td>
                            <td>{userListEntry.role}</td>
                            <td>{userListEntry.disabled ? "Disabilitato" : "Attivo"}</td>
                            <td>
                                <Button onClick={() => navigate(`/users/${userListEntry.id}`)}
                                        color={"secondary"} icon={true} outline title={"Modifica"}>
                                    <Icon icon={"it-pencil"}/>
                                </Button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
                <LoadingSpinner loading={loading}/>

                <SuccessErrorAlert err={err} succ={null}/>
            </Col>
        </Container>
    );
}
