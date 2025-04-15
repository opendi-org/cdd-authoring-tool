import { useEffect, useState } from "react";
import CausalDecisionDiagram from "./components/CausalDecisionDiagram";
import EditorAndHelpMenu from "./components/RightMenu/EditorAndHelpMenu";
import { APIHandler } from "./lib/api/api";
import { NoAPI } from "./lib/api/noApi";

function App() {
    const apiHandler = new APIHandler();
    // This is the single source of truth for Model JSON, used by both VanillaJSONEditor and CausalDecisionDiagram.
    const [modelJSON, setModelJSON] = useState(() => {
        //Try to get the most recent model from the API
        if(apiHandler.apiInstance.getModelMetas().length > 0)
        {
            return apiHandler.apiInstance.fetchFullModel(
                apiHandler.apiInstance.getModelMetas()[0].uuid
            )
        }
        //Fallback: Use the first pack-in model
        const tempAPI = new NoAPI();
        return tempAPI.fetchFullModel(
            tempAPI.getModelMetas()[0].uuid
        );
    });
    const [menuIsOpen, setMenuIsOpen] = useState(() => localStorage.getItem("menu") !== "closed");
    useEffect(() => {
        localStorage.setItem("menu", menuIsOpen ? "open" : "closed");
    }, [menuIsOpen])
    const [expandedPaths, setExpandedPaths] = useState([]);

    return (
        <div style={{ paddingRight:"0.75%" }}>
            <h2 className="title-header">OpenDI CDD Authoring Tool</h2>
            <div className="cdd-editor">
                {/* Diagram view / engine */}
                <div className="cdd-editor left">
                    <CausalDecisionDiagram
                        model={modelJSON}
                        setModelJSON={setModelJSON}
                        setExpandedPaths={setExpandedPaths}
                    />
                    <div id="controls-legend">
                        <b>Move element:</b> Click and drag element's top bar.<br/>
                        <b>Select element(s):</b> Toggle element's top-right checkbox.<br/>
                        <b>Deselect all:</b> Click diagram background.
                    </div>
                    <div
                        id="menu-toggle-button"
                        onClick={() => setMenuIsOpen(!menuIsOpen)}
                    >
                        {menuIsOpen ? "-" : "+"}
                    </div>
                </div>

                {menuIsOpen && 
                    <div className="cdd-editor right">
                        {/*JSON Editor*/}
                        <EditorAndHelpMenu
                            modelJSON={modelJSON}
                            setModelJSON={setModelJSON}
                            expandedPaths={expandedPaths}
                            apiHandler={apiHandler}
                        />
                    </div>
                }
            </div>
        </div>
    )
};

export default App;