import {Button, Col, Container, Icon, Table} from "design-react-kit";
import {useUserDataContext} from "../hooks/useUserDataContext.ts";
import {useNavigate} from "react-router";
import {useEffect, useState} from "react";
import type {UserListEntry, UserListEntryApiResponse} from "../utils/Types.ts";
import {defaultGETRequestInit, fetchApiAsync} from "../utils/fetching.ts";
import {useErrSuccLoad} from "../hooks/useErrSuccLoad.ts";
import {SuccessErrorAlert} from "../components/SuccessErrorAlert.tsx";
import {LoadingSpinner} from "../components/LoadingSpinner.tsx";

export const Users = () => {
    const userDataCtx = useUserDataContext();
    const navigate = useNavigate();
    const [usersList, setUsersList] = useState<UserListEntry[]>([]);
    const {err, setErr, succ, setSucc, loading, setLoading} = useErrSuccLoad();

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
                if (data != null) {
                    console.log(data.usersList);
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
                <Table>
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Nome</th>
                        <th>Cognome</th>
                        <th>Email</th>
                        <th>CF</th>
                        <th>Ruolo</th>
                        <th>Disabilitato</th>
                        <th>Ultimo aggiornamento password</th>
                        <th>Data creazione</th>
                        <th>Data aggiornamento</th>
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
                            <td>{userListEntry.cf}</td>
                            <td>{userListEntry.role}</td>
                            <td>{userListEntry.disabled}</td>
                            <td>{new Date(userListEntry.lastPasswordResetDate).toLocaleString()}</td>
                            <td>{new Date(userListEntry.createdAt).toLocaleString()}</td>
                            <td>{new Date(userListEntry.updatedAt).toLocaleString()}</td>
                            <td>
                                <Button onClick={() => navigate(`/users/${userListEntry.id}`)} icon={true}
                                        color={"secondary"} outline title={"Modifica"}>
                                    <Icon icon={"it-pencil"}/>
                                </Button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
                <LoadingSpinner loading={loading}/>

                <SuccessErrorAlert err={err} succ={succ}/>
            </Col>
        </Container>
    );
}
