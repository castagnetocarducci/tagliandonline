import { UserDataContext } from "../contexts/UserDataContext.tsx";
import type {UserDataContextType} from "../utils/Types.ts";
import {useContext} from "react";

export const useUserDataContext = () => useContext<UserDataContextType>(UserDataContext);