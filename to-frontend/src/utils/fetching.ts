import {getApiUrl} from "./ConfigProvider.ts";

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
            return {data: await res.json(), status: res.status}
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





