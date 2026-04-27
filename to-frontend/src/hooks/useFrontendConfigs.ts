import {useFetch} from "./useFetch.ts";
import {useEffect, useState} from "react";
import {defaultGETRequestInit} from "../utils/fetching.ts";
import {getApiUrlBase} from "../utils/ConfigProvider.ts";

type FrontendConfig = {
    paName: string,
    paLink: string,
    pa2Name: string,
    pa2Link: string,
}

export function useFrontendConfigs() {
    const [frontendConfig, setFrontendConfig] = useState<FrontendConfig>({
        paName: "PA",
        paLink: "#",
        pa2Name: "PA2",
        pa2Link: "#",
    });
    // const [acquied, setAcquired] = useState<boolean>(false);

    const { data } = useFetch<FrontendConfig>(getApiUrlBase() + "/config.json", {...defaultGETRequestInit});

    useEffect(() => {
        if (data != null) {
            const setConfig = async () => {
                setFrontendConfig(data);
                // setAcquired(true);
            }
            setConfig();
        }
    }, [data]);

    return frontendConfig;
}
