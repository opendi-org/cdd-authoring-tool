import { useEffect, useState } from "react";
import rawModelJSON from "./model_json/coffee.json" assert { type: "json" };
import CausalDecisionDiagram from "./components/CausalDecisionDiagram";
import EditorAndHelpMenu from "./components/RightMenu/EditorAndHelpMenu";

function App() {
    // This is the single source of truth for Model JSON, used by both VanillaJSONEditor and CausalDecisionDiagram.
    const [modelJSON, setModelJSON] = useState(rawModelJSON);
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
                        />
                    </div>
                }
            </div>
        </div>
    )
};

export default App;