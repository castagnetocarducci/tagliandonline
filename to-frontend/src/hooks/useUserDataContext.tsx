import { UserDataContext } from "../contexts/UserDataContext.tsx";
import type {UserData} from "../utils/Types.ts";
import {useContext} from "react";

export const useUserDataContext = () => useContext<UserData>(UserDataContext);