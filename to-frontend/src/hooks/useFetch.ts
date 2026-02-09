import {useEffect, useState} from "react";

export function useFetch<Type> (url: string) {
    const [data, setData] = useState<Type | null>(null);
    const [isPending, setIsPending] = useState<boolean>(true);
    const [error, setError] = useState(null);

    useEffect(() => {

        const abortController = new AbortController();

        fetch(url, { signal: abortController.signal })
            .then(res => {
                if (!res.ok) {
                    throw Error('could not fetch the data for that resource');
                }
                return res.json();
            })
            .then(data => {
                setIsPending(false);
                setData(data);
                setError(null);
            })
            .catch(err => {
                if (err.name === 'AbortError') {
                    console.log('fetch aborted')
                } else {
                    setIsPending(false);
                    setError(err.message);
                }
            })
        return () => abortController.abort();
    }, [url])

    return { data, isPending, error }
}
