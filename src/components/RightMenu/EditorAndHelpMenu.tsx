import React, { useEffect, useMemo, useState } from "react";
import VanillaJSONEditor from "./VanillaJSONEditor";
import GlossaryTab from "./GlossaryTab";
import HelpTab from "./HelpTab";
import { getValidator, validateGraphData } from "../../lib/validation";
import { Mode } from "vanilla-jsoneditor";
import FileTab from "./FileTab";
import { APIInterface } from "../../lib/api/api";
import { RIGHT_MENU_TABS } from "../../lib/rightMenu/menuTabIDs";


type EditorAndHelpMenuProps = {
    modelJSON: any;
    setModelJSON: Function;
    selectedDiagramIndex: number;
    setSelectedDiagramIndex: Function;
    selectedRunnableModelIndices: Array<number>;
    setSelectedRunnableModelIndices: Function;
    expandedPaths: Array<Array<string>>;
    apiInstance: APIInterface;
    setApiInstance: Function;
    setLeftEditorState: Function;
    activeRightMenuTab: string;
    setActiveRightMenuTab: Function;
}

/**
 * Renders the right-side menu for the authoring tool. Holds the
 * JSON editor, a help menu for controls, and a glossary for
 * relevant DI modeling terms.
 */
const EditorAndHelpMenu: React.FC<EditorAndHelpMenuProps> = ({
    modelJSON,
    setModelJSON,
    selectedDiagramIndex,
    setSelectedDiagramIndex,
    selectedRunnableModelIndices,
    setSelectedRunnableModelIndices,
    expandedPaths,
    apiInstance,
    setApiInstance,
    setLeftEditorState,
    activeRightMenuTab,
    setActiveRightMenuTab
}) => {

    useEffect(() => {
        localStorage.setItem("tab", activeRightMenuTab);
    }, [activeRightMenuTab]);

    /**
     * Tracks whether the JSON editor is in tree, text, or table mode.
     */
    const [editorMode, setEditorMode] = useState(Mode.tree);

    /**
     * Memoized copy of the input model JSON.
     */
    const content = useMemo(() => {
        return {
            json: modelJSON,
            text: undefined
        }
    }, [modelJSON])

    return (
        <div id="menu">
                <div id="menu-options"> {/* Menu buttons */}
                    <div className="menu-tab-container"> {/* Menu tab buttons */}
                        <div
                            id="file-tab-btn"
                            className={`menu-tab ${activeRightMenuTab === RIGHT_MENU_TABS.FILE ? "selected-tab" : ""}`}
                            onClick={() => setActiveRightMenuTab(RIGHT_MENU_TABS.FILE)}
                        >
                            File
                        </div>
                        <div
                            id="advanced-tab-btn"
                            className={`menu-tab ${activeRightMenuTab === RIGHT_MENU_TABS.JSON ? "selected-tab" : ""}`}
                            onClick={() => setActiveRightMenuTab(RIGHT_MENU_TABS.JSON)}
                        >
                            JSON Editor
                        </div>
                        <div
                            id="help-tab-btn"
                            className={`menu-tab ${activeRightMenuTab === RIGHT_MENU_TABS.HELP ? "selected-tab" : ""}`}
                            onClick={() => setActiveRightMenuTab(RIGHT_MENU_TABS.HELP)}
                        >
                            Help
                        </div>
                        <div
                            id="glossary-btn"
                            className={`menu-tab ${activeRightMenuTab === RIGHT_MENU_TABS.GLOSSARY ? "selected-tab" : ""}`}
                            onClick={() => setActiveRightMenuTab(RIGHT_MENU_TABS.GLOSSARY)}
                        >
                            Glossary
                        </div>
                    </div>
                </div>
                <div id="menu-contents"> {/* Actual menu content */}
                    <div className={`file-tab info-menu ${activeRightMenuTab === RIGHT_MENU_TABS.FILE ? "" : "hidden"}`}>
                        <FileTab
                            model={modelJSON}
                            setModel={setModelJSON}
                            selectedDiagramIndex={selectedDiagramIndex}
                            setSelectedDiagramIndex={setSelectedDiagramIndex}
                            selectedRunnableModelIndices={selectedRunnableModelIndices}
                            setSelectedRunnableModelIndices={setSelectedRunnableModelIndices}
                            apiInstance={apiInstance}
                            setApiInstance={setApiInstance}
                            setLeftEditorState={setLeftEditorState}
                        />
                    </div>
                    <div className={`info-menu-json ${activeRightMenuTab === RIGHT_MENU_TABS.JSON ? "" : "hidden"}`}>
                        <VanillaJSONEditor
                            content={content}
                            onChange={(newContent: any, _previousContent, { contentErrors, patchResult: _ }) => {
                                if(!contentErrors)
                                {
                                    const newJSON = newContent.json ?? (newContent.text ? JSON.parse(newContent.text) : null);
                                    if(newJSON)
                                    {
                                        const validationResults = validateGraphData(newContent.json);
                                        if(validationResults.errors.length > 0)
                                        {
                                            console.error("Graph rendering validation errors:");
                                            console.error(validationResults.errors);
                                        }
                                        if(validationResults.canRender)
                                        {
                                            setModelJSON(validationResults.validatedData);
                                        }
                                    }
                                }
                            }}
                            onChangeMode={(newMode) => {
                                setEditorMode(newMode);
                            }}
                            readOnly={false}
                            validator={getValidator()}
                            expandedPaths={expandedPaths}
                            mode={editorMode}
                        />
                    </div>
                    <div className={`info-menu ${activeRightMenuTab === RIGHT_MENU_TABS.HELP ? "" : "hidden"}`}>
                        <HelpTab />
                    </div>
                    <div className={`info-menu ${activeRightMenuTab === RIGHT_MENU_TABS.GLOSSARY ? "" : "hidden"}`}>
                        <GlossaryTab />
                    </div>
                </div>
                
            </div>
    )
};
export default EditorAndHelpMenu