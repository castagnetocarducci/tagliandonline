import {getApiUrl} from "./ConfigProvider.ts";
import type {ValidatedFormValuesMap} from "../hooks/useValidateFormInput.ts";

export type ErrSuccLoading = {
    setLoading: (newValue: boolean) => void,
    setErr: (newValue: string | null) => void,
    setSucc: (newValue: string | null) => void
};

type FetchParametersCommon<Type> = {
    errSuccLoading?: ErrSuccLoading,
    requestInit?: RequestInit,
    callback?: (data: Type | null, error: Error | null) => void
};
type FetchAsyncParameters<Type> = FetchParametersCommon<Type> & { url: string };
type FetchApiAsyncParameters<Type> = FetchParametersCommon<Type> & { urlFromApiRoot: string };

export function fetchAsync<Type>({url, errSuccLoading, requestInit, callback}: FetchAsyncParameters<Type>) {
    const abortController = new AbortController();
    errSuccLoading?.setLoading(true);
    fetch(url, {signal: abortController.signal, ...requestInit})
        .then(async (res) => {
            if (res.headers.get("Content-Type")?.includes("application/json")) {
                const jsonParsed = await res.json()
                return {data: jsonParsed, status: res.status}
            } else {
                const message = ("" + res.status) + ": " + await res.text();
                return {data: {message: message}, status: res.status}
            }
        })
        .then(parsed => {
            errSuccLoading?.setLoading(false);
            if (parsed.status == 200) {
                errSuccLoading?.setErr(null);
                if (parsed.data != null && parsed.data.message != null) {
                    errSuccLoading?.setSucc(parsed.data.message);
                }
                if (callback != null) callback(parsed.data, null);
            } else {
                let errMsg = "";
                if (parsed.data != null && parsed.data.message != null) {
                    errMsg = parsed.data.message;
                }
                errSuccLoading?.setSucc(null);
                errSuccLoading?.setErr(errMsg);
                if (callback != null) callback(null, new Error(errMsg));
            }
        })
        .catch(err => {
            errSuccLoading?.setLoading(false);
            errSuccLoading?.setSucc(null);
            errSuccLoading?.setErr(err);
            if (callback != null) callback(null, err);
        });
    return () => {
        abortController.abort()
    };
}

export function fetchApiAsync<Type>({
                                        urlFromApiRoot,
                                        errSuccLoading,
                                        requestInit,
                                        callback
                                    }: FetchApiAsyncParameters<Type>) {
    return fetchAsync<Type>({url: getApiUrl() + urlFromApiRoot, errSuccLoading, requestInit, callback});
}


export const defaultPOSTRequestInit: RequestInit = {
    headers: {
        'Content-Type': 'application/json'
    },
    method: "POST",
    credentials: "include"
};

export const multipartPOSTRequestInit: RequestInit = {
    //multipart/form-data non vuole il Content-Type
    method: "POST",
    credentials: "include"
};

export const defaultGETRequestInit: RequestInit = {
    method: "GET",
    credentials: "include"
};

export const fromValuesMapToSearchParams = (valuesMap: ValidatedFormValuesMap): URLSearchParams => {
    const urlSearchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(valuesMap)) {
        if (value == null) {
            continue;
        }
        const strValue = value.toString().trim();
        if (strValue.length === 0) {
            continue;
        }
        urlSearchParams.append(key, strValue);
    }
    return urlSearchParams;
}

export const fromSearchParamsToValuesMap = (searchParams: URLSearchParams): ValidatedFormValuesMap => {
    const valuesMap: ValidatedFormValuesMap = {};
    for (const [key, value] of searchParams.entries()) {
        valuesMap[key] = value;
    }
    return valuesMap;
}




