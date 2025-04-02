import React, { useEffect, useMemo, useState } from "react";
import VanillaJSONEditor from "./VanillaJSONEditor";
import GlossaryTab from "./GlossaryTab";
import HelpTab from "./HelpTab";


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
                            onChange={(newContent: any) => {
                                if(newContent.json)
                                {
                                    setModelJSON(newContent.json);
                                }
                            }}
                            readOnly={false}
                        />
                    )}
                </div>
                
            </div>
    )
};
export default EditorAndHelpMenu