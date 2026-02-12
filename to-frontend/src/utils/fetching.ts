import {getApiUrl} from "./ConfigProvider.ts";

export function fetchAsync<Type>(url: string, requestInit?: RequestInit, callback?: (data: Type | null, error: Error | null) => void) {
    const abortController = new AbortController();
    fetch(url, {signal: abortController.signal, ...requestInit})
        .then(async (res) => {
            return {data: await res.json(), status: res.status}
        })
        .then(parsed => {
            if (callback != null) {
                if (parsed.status == 200) {
                    callback(parsed.data, null);
                } else {
                    let errMsg = "";
                    if (parsed.data != null && parsed.data.message != null) {
                        errMsg = parsed.data.message;
                    }
                    callback(null, new Error(errMsg));
                }
            }
        })
        .catch(err => callback != null && callback(null, err));
    return () => {
        abortController.abort()
    };
}

export function fetchApiAsync<Type>(urlFromApiRoot: string, requestInit?: RequestInit, callback?: (data: Type | null, error: Error | null) => void) {
    return fetchAsync<Type>(getApiUrl() + urlFromApiRoot, requestInit, callback);
}






