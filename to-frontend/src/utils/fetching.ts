import {getApiUrl} from "./ConfigProvider.ts";

export function fetchAsync<Type>(url: string, callback: (data: Type | null, error: Error | null) => void) {
    const abortController = new AbortController();
    fetch(url, { signal: abortController.signal })
        .then(res => res.json())
        .then(data => callback(data, null))
        .catch(err => callback(null, err));
    return () => {abortController.abort()};
}

export function fetchApiAsync<Type>(urlFromApiRoot: string, callback: (data: Type | null, error: Error | null) => void) {
    return fetchAsync<Type>(getApiUrl() + urlFromApiRoot, callback);
}






