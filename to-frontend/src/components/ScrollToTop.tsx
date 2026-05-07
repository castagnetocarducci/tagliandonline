import {useLayoutEffect, useState} from "react";
import {useLocation} from "react-router";


export function ScrollToTop() {
    const [previousSection, setPreviousSection] = useState<string>("");
    const [previousID, setPreviousID] = useState<number>(0);
    const {pathname} = useLocation();

    useLayoutEffect(() => {
        const split = pathname.split("/");
        if (split.length >= 2) {
            const newSection = split[1];
            if (newSection !== previousSection) {
                const scroll = () => {
                    setPreviousSection(newSection);
                    window.scroll({
                        top: 0,
                        left: 0,
                        behavior: "auto"
                    });
                }
                scroll();
            } else if (split.length >= 3) {
                let newVal = previousID;
                for (const val of split) {
                    if (!isNaN(parseInt(val))) {
                        const idVal = parseInt(val);
                        newVal = idVal;
                    }
                }
                if (newVal !== previousID) {
                    const scroll = () => {
                        setPreviousID(newVal);
                        window.scroll({
                            top: 0,
                            left: 0,
                            behavior: "instant"
                        });
                    }
                    scroll();
                }
            }
        }
    }, [pathname, previousID, previousSection]);


    return (
        <></>
    );
}