import React, { useEffect, useMemo, useState } from "react";
import VanillaJSONEditor from "./VanillaJSONEditor";
import GlossaryTab from "./GlossaryTab";
import HelpTab from "./HelpTab";
import { getValidator, validateGraphData } from "../../lib/validation";
import { Mode } from "vanilla-jsoneditor";


type EditorAndHelpMenuProps = {
    modelJSON: any;
    setModelJSON: Function;
    setMenuIsOpen: Function;
    expandedPaths: Array<Array<string>>;
}

const TABS = {
    HELP: "help",
    GLOSSARY: "glossary",
    JSON: "jsoneditor",
};

const EditorAndHelpMenu: React.FC<EditorAndHelpMenuProps> = ({
    modelJSON,
    setModelJSON,
    setMenuIsOpen,
    expandedPaths,
}) => {
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem("tab") || TABS.JSON);

    useEffect(() => {
        localStorage.setItem("tab", activeTab);
    }, [activeTab]);

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
                    <div id ="menu-tabs"> {/* Menu tab buttons */}
                        <div
                            id="help-tab-btn"
                            className={`menu-tab ${activeTab === TABS.HELP ? "selected-tab" : ""}`}
                            onClick={() => setActiveTab(TABS.HELP)}
                        >
                            Help
                        </div>
                        <div
                            id="glossary-btn"
                            className={`menu-tab ${activeTab === TABS.GLOSSARY ? "selected-tab" : ""}`}
                            onClick={() => setActiveTab(TABS.GLOSSARY)}
                        >
                            Glossary
                        </div>
                        <div
                            id="advanced-tab-btn"
                            className={`menu-tab ${activeTab === TABS.JSON ? "selected-tab" : ""}`}
                            onClick={() => setActiveTab(TABS.JSON)}
                        >
                            JSON Editor
                        </div>
                    </div>
                    <div
                        id="exit-btn"
                        className="menu-tab"
                        onClick={() => setMenuIsOpen(false)}
                    >
                        Close
                    </div>
                </div>
                <div id="menu-contents"> {/* Actual menu content */}
                    {activeTab === TABS.HELP && <HelpTab />}
                    {activeTab === TABS.GLOSSARY && <GlossaryTab />}
                    {activeTab === TABS.JSON && (
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
                    )}
                </div>
                
            </div>
    )
};
export default EditorAndHelpMenu