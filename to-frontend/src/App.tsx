import "typeface-titillium-web/index.css";
import "typeface-roboto-mono/index.css";
import "typeface-lora/index.css";
import "bootstrap-italia/dist/css/bootstrap-italia.min.css";
import './App.css'
import {BrowserRouter} from "react-router";
import {RouteConfiguration} from "./components/RouteConfiguration.tsx";
import {CompleteHeader} from "./components/header/CompleteHeader.tsx";
import {RouterBreadcrumb} from "./components/RouterBreadcrumb.tsx";
import {CustomFooter} from "./components/CustomFooter.tsx";

function App() {

    return (
       <BrowserRouter>
           <CompleteHeader/>
           <div className={"min-vh-100 pt-2"}>
           <RouterBreadcrumb/>
           <RouteConfiguration/>
           </div>
           <CustomFooter/>
       </BrowserRouter>
    )
}

export default App
