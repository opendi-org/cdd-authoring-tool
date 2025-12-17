import { useEffect, useState } from "react";
import CausalDecisionDiagram from "./components/Diagram/CausalDecisionDiagram";
import EditorAndHelpMenu from "./components/RightMenu/EditorAndHelpMenu";
import { getNewModel } from "./lib/api/modelCRUD";
import { APIInterface } from "./lib/api/api";
import { NoAPI } from "./lib/api/noApi";
import RunnableModelEditor from "./components/RunnableEditor/RunnableModelEditor";
import { RIGHT_MENU_TABS } from "./lib/rightMenu/menuTabIDs";

function App() {
    // This is the single source of truth for Model JSON, used by both VanillaJSONEditor and CausalDecisionDiagram.
    const [modelJSON, setModelJSON] = useState(() => {
        return getNewModel();
    });

    const [selectedDiagramIndex, setSelectedDiagramIndex] = useState((0));
    const [selectedRunnableModelIndices, setSelectedRunnableModelIndices] = useState(([0]));

    /**
     * This combo of useState and useEffect means I conditionally run some code
     * ONLY when the we get a new model that has a different UUID from the one
     * before. So if modelJSON just gets updated, but its UUID didn't change,
     * then code that checks for modelUUIDChanged below won't run.
     */
    const [currentModelUUID, setCurrentModelUUID] = useState((""));
    useEffect(() => {
        const modelHasValidUUID = modelJSON.meta && modelJSON.meta.uuid;
        const modelUUIDChanged = modelHasValidUUID && modelJSON.meta.uuid != currentModelUUID;
        
        if(modelUUIDChanged)
        {
            setCurrentModelUUID(modelJSON.meta.uuid);
            setSelectedDiagramIndex(0);
            setSelectedRunnableModelIndices([0]);
        }
        else if(modelJSON.diagrams && !modelJSON.diagrams[selectedDiagramIndex])
        {
            let selectionCandidate = selectedDiagramIndex;
            while(!modelJSON.diagrams[selectionCandidate] && selectionCandidate > 0)
            {
                selectionCandidate--;
            }
            setSelectedDiagramIndex(selectionCandidate >= 0 ? selectionCandidate : 0);
        }
    }, [modelJSON]);

    const [apiInstance, setApiInstance] = useState<APIInterface>(new NoAPI());

    // When the API instance changes, retrieve the latest model and set it
    // as the active model
    useEffect(() => {
        const getLatestModel = async () => {
            let newModel = null;
            let modelMetas: Array<any> = await apiInstance.getModelMetas();
            if(modelMetas.length > 0)
            {
                newModel = await apiInstance.fetchFullModel(
                    modelMetas[0].uuid
                );
            }

            //If anything went wrong, fall back on one of the built-in models
            if(newModel === null)
            {
                const tempAPI = new NoAPI();
                modelMetas = await tempAPI.getModelMetas();
                if(modelMetas.length > 0)
                {
                    newModel = await tempAPI.fetchFullModel(
                        modelMetas[0].uuid
                    );
                }
            }

            if(newModel !== null)
            {
                setModelJSON(newModel);
            }
        }

        const confirmMessage = `New API URL detected: ${apiInstance.baseURL}`
            + `\nWould you like to load the most recently-edited model from the API?`
            + `\nAny unsaved progress will be lost.`;
        if(apiInstance instanceof NoAPI || confirm(confirmMessage))
        {
            getLatestModel();
        }
        
    }, [apiInstance])


    const [menuIsOpen, setMenuIsOpen] = useState(() => localStorage.getItem("menu") !== "closed");
    useEffect(() => {
        localStorage.setItem("menu", menuIsOpen ? "open" : "closed");
    }, [menuIsOpen]);
    const [activeRightMenuTab, setActiveRightMenuTab] = useState(() => localStorage.getItem("tab") || RIGHT_MENU_TABS.JSON);

    const [expandedPaths, setExpandedPaths] = useState([]);

    const [leftEditorState, setLeftEditorState] = useState("cdd");

    return (
        <div>
            <div className="authoring-tool-container">
                <div className="left">
                    {/* Runnable Model Editor */}
                    {leftEditorState == "runnable" && (
                        <div className={`editor`}>
                            <RunnableModelEditor
                                model={modelJSON}
                                setModel={setModelJSON}
                                selectedRunnableModelIndices={selectedRunnableModelIndices}
                                selectedDiagramIndex={selectedDiagramIndex}
                                setExpandedPaths={setExpandedPaths}
                                setActiveRightMenuTab={setActiveRightMenuTab}
                                setMenuIsOpen={setMenuIsOpen}
                            />
                            <div
                                className="menu-toggle-button"
                                onClick={() => setMenuIsOpen(!menuIsOpen)}
                            >
                                {menuIsOpen ? "-" : "+"}
                            </div>
                        </div>
                    )}
                    {/* Diagram view / engine */}
                    {leftEditorState == "cdd" && (
                        <div className={`editor`}>
                            <CausalDecisionDiagram
                                model={modelJSON}
                                setModelJSON={setModelJSON}
                                setExpandedPaths={setExpandedPaths}
                                selectedDiagramIndex={selectedDiagramIndex}
                                selectedRunnableModelIndices={selectedRunnableModelIndices}
                            />
                            <div id="controls-legend">
                                <b>Move element:</b> Click and drag element's top bar.<br/>
                                <b>Select element(s):</b> Toggle element's top-right checkbox.<br/>
                                <b>Deselect all:</b> Click diagram background.
                            </div>
                            <div
                                className="menu-toggle-button"
                                onClick={() => setMenuIsOpen(!menuIsOpen)}
                            >
                                {menuIsOpen ? "-" : "+"}
                            </div>
                        </div>
                    )}
                </div>

                <div className={`editor right ${menuIsOpen ? "" : "hidden"}`}>
                    {/*JSON Editor*/}
                    <EditorAndHelpMenu
                        modelJSON={modelJSON}
                        setModelJSON={setModelJSON}
                        selectedDiagramIndex={selectedDiagramIndex}
                        setSelectedDiagramIndex={setSelectedDiagramIndex}
                        selectedRunnableModelIndices={selectedRunnableModelIndices}
                        setSelectedRunnableModelIndices={setSelectedRunnableModelIndices}
                        expandedPaths={expandedPaths}
                        apiInstance={apiInstance}
                        setApiInstance={setApiInstance}
                        setLeftEditorState={setLeftEditorState}
                        activeRightMenuTab={activeRightMenuTab}
                        setActiveRightMenuTab={setActiveRightMenuTab}
                    />
                </div>
            </div>
            <div className="instructions">
                <div className="header-section">
                    <img src={`${import.meta.env['BASE_URL']}/img/opendi-logo.png`} alt="OpenDI Logo" className="logo" />
                    <h1 className="title-header">OpenDI Causal Decision Model Authoring Tool</h1>
                </div>
                <p>
                    This tool allows you to create and edit OpenDI standards-compliant
                    Causal Decision Diagrams, using a graphical view and JSON editor.
                    <br/>
                    For more info about OpenDI, visit <a href="https://opendi.org" target="_blank">OpenDI.org</a>.
                </p>
                <p>
                    <b>This tool is a prototype!</b><br/>We cannot guarantee that the system
                    is bug-free. This tool may crash unexpectedly, and you may lose data.
                    <br/>
                    The tool provides a Download button to save your work as a JSON file.
                    Use it often!
                </p>
                <p>
                    Original coffee purchasing CDD by Nadine Malcolm and Dr. Lorien Pratt. See original on Dr. Pratt's blog: <a href="https://www.lorienpratt.com/a-framework-for-how-data-informs-decisions/" target="_blank">A Framework for How Data Informs Decisions</a>.
                    <br/>Adaptations for simulation and simulation logic by Isaac Kellogg. All other built-in example models by Isaac Kellogg.
                </p>
                <h2>Source</h2>
                <p>
                    You can view and contribute to this project's source code on <a href="https://github.com/opendi-org/cdd-authoring-tool" target="_blank">GitHub</a>.
                    <br/>Contributions are very welcome!
                </p>
                <br/><br/>
                <hr/>
                <h2>Acknowledgements</h2>
                <ul>
                    <li>Graphical view uses:
                        <ul>
                            <li><a href="https://www.npmjs.com/package/react-draggable" target="_blank"><b>react-draggable</b></a> for draggable elements.</li>
                            <li><a href="https://www.npmjs.com/package/react-xarrows" target="_blank"><b>react-xarrows</b></a> for reactive, stylish dependency arrows.</li>
                            <li><a href="https://www.npmjs.com/package/react-collapsed" target="_blank"><b>react-collapsed</b></a> for animated collapsible sections.</li>
                            <li><a href="https://www.npmjs.com/package/react-markdown/v/8.0.6" target="_blank"><b>react-markdown</b></a> for nicely-rendered markdown in CDM summaries.</li>
                        </ul>
                    </li>
                    <li>JSON Editor view and right-side menu uses:
                        <ul>
                            <li><a href="https://www.npmjs.com/package/vanilla-jsoneditor" target="_blank"><b>vanilla-jsoneditor</b></a> for fully-featured in-browser JSON editing. See their copyright notice in this project's source code.</li>
                            <li><a href="https://www.npmjs.com/package/ajv/v/7.0.4" target="_blank"><b>ajv</b></a> for JSON Schema validation.</li>
                            <li><a href="https://www.npmjs.com/package/file-saver" target="_blank"><b>file-saver</b></a> for saving large JSON files with nice formatting, using browser blobs.</li>
                        </ul>
                    </li>
                </ul>
            </div>
            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-links">
                        <div>
                            <h3>Community</h3>
                            <ul>
                                <li><a href="https://discord.gg/FtAX3JStJz" target="_blank">Discord</a></li>
                                <li><a href="https://github.com/opendi-org" target="_blank">GitHub</a></li>
                                <li><a href="https://quantellia.com/" target="_blank">Quantellia</a></li>
                                <li><a href="https://www.cmodel.io" target="_blank">CModel Data, Inc</a></li>
                                <li><a href="https://www.ncsu.edu/" target="_blank">NC State University</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3>Resources</h3>
                            <ul>
                                <li><a href="http://opendi.org/blog" target="_blank">Blog</a></li>
                                <li><a href="https://www.scoop.it/topic/decision-intelligence/" target="_blank">Decision Intelligence News</a></li>
                                <li><a href="http://opendi.org/glossary" target="_blank">OpenDI Glossary</a></li>
                                <li><a href="https://quantellia.com/ai-and-di-workshops/" target="_blank">Decision Intelligence Webinars</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3>Follow Us</h3>
                            <ul>
                                <li><a href="https://www.linkedin.com/company/opendi-org/" target="_blank">LinkedIn</a></li>
                                <li><a href="https://www.facebook.com/people/OpenDi/100095177432725/" target="_blank">Facebook</a></li>
                                <li><a href="https://www.youtube.com/channel/UC4Thj0JegsJ3csqb-iEPI5A" target="_blank">YouTube</a></li>
                                <li><a href="https://bsky.app/profile/opendi.bsky.social" target="_blank">BlueSky</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3>OpenDI</h3>
                            <ul>
                                <li><a href="http://opendi.org/" target="_blank">Main Site</a></li>
                                <li><a href="http://opendi.org/roles-user-stories" target="_blank">Roles and User Stories</a></li>
                                <li><a href="http://opendi.org/api-specification" target="_blank">API Specification</a></li>
                                <li><a href="http://opendi.org/cdd-authoring-tool" target="_blank">CDM Authoring Tool</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-copyright">
                        &copy; 2025-26 OpenDI. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    )
};

export default App;