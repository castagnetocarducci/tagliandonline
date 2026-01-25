import "typeface-titillium-web/index.css";
import "typeface-roboto-mono/index.css";
import "typeface-lora/index.css";
import "bootstrap-italia/dist/css/bootstrap-italia.min.css";
import './App.css'
import {BrowserRouter} from "react-router";
import {RouteConfiguration} from "./components/RouteConfiguration.tsx";
import {CompleteHeader} from "./components/header/CompleteHeader.tsx";
import {RouterBreadcrumb} from "./components/RouterBreadcrumb.tsx";

function App() {

    return (
       <BrowserRouter>
           <CompleteHeader/>
           <RouterBreadcrumb/>
           <RouteConfiguration/>
       </BrowserRouter>
    )
}

export default App
