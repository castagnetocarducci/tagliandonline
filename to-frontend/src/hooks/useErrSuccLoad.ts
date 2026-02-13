import {useState} from "react";

export const useErrSuccLoad = () => {
    const [err, setErr] = useState<string | null>(null);
    const [succ, setSucc] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    return {err, setErr, succ, setSucc, loading, setLoading};
}
