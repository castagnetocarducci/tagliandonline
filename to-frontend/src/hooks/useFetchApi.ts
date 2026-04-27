import {useFetch} from "./useFetch.ts";
import {getApiUrl} from "../utils/ConfigProvider.ts";

export function useFetchApi<Type>(urlFromApiRoot: string, requestInit: RequestInit) {
    return useFetch<Type>(getApiUrl() + urlFromApiRoot, requestInit);}