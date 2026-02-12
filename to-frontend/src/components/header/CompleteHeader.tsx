import {Headers} from "design-react-kit";
import SlimHeader from "./SlimHeader.tsx";
import {CenterHeader} from "./CenterHeader.tsx";
import {NavHeader} from "./NavHeader.tsx";

export const CompleteHeader = () => {
    return (
        <Headers>
            <SlimHeader />
            <div className="it-nav-wrapper">
                <CenterHeader />
                <NavHeader />
            </div>
        </Headers>
    )
}

