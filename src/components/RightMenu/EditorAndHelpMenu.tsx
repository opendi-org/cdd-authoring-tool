import React, { useEffect, useMemo, useState } from "react";
import VanillaJSONEditor from "./VanillaJSONEditor";
import GlossaryTab from "./GlossaryTab";
import HelpTab from "./HelpTab";
import { getValidator, validateGraphData } from "../../lib/validation";


type EditorAndHelpMenuProps = {
    modelJSON: any;
    setModelJSON: Function;
    menuIsOpen: boolean;
    setMenuIsOpen: Function;
}

const TABS = {
    HELP: "help",
    GLOSSARY: "glossary",
    JSON: "jsoneditor",
};

const EditorAndHelpMenu: React.FC<EditorAndHelpMenuProps> = ({
    modelJSON,
    setModelJSON,
    menuIsOpen,
    setMenuIsOpen,
}) => {
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem("tab") || TABS.JSON);

    useEffect(() => {
        localStorage.setItem("tab", activeTab);
    }, [activeTab]);

    useEffect(() => {
        localStorage.setItem("menu", menuIsOpen ? "open" : "closed");
    }, [menuIsOpen])

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
                                            console.log("Graph rendering validation errors:");
                                            console.log(validationResults.errors);
                                        }
                                        if(validationResults.canRender)
                                        {
                                            setModelJSON(validationResults.validatedData);
                                        }
                                    }
                                }
                            }}
                            readOnly={false}
                            validator={getValidator()}
                        />
                    )}
                </div>
                
            </div>
    )
};
export default EditorAndHelpMenu