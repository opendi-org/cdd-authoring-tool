import React from "react";

/**
 * Provides details about controls and buttons
 * @returns Help Tab component for the Help menu
 */
const HelpTab: React.FC = () => {
    return (
        <div className="info-menu">
            <h2>UI Buttons (Graph view)</h2>
            <ul>
                <li><b>New Elem</b>: Create a new decision element. The new element will be placed on the graph, with placeholder values.</li>
                <li><b>Del Elem</b>: Delete the selected element(s). Removes all associated dependencies as well. Can select and delete multiple elements at once.</li>
                <li><b>Toggle Dep</b>: When 2 or more elements are selected, toggle causal dependency arrows along the selected chain, from first selected to last selected.</li>
                <li><b>Menu</b>: Show menu resources such as information about controls and CDD terms, as well as the JSON Editor.</li>
            </ul>
            <h2>Controls (JSON Editor)</h2>
            <p>In tree view:</p>
            <ul>
                <li><b>Double-click a value</b> to edit.</li>
                <li><b>Right-click</b>: View context menu.</li>
            </ul>
            <h2>API Controls</h2>
            <ul>
                <li><b>Select a Model</b>: Select a saved model from the API's database. The selected model can be loaded or deleted.</li>
                <li><b>Load Model</b>: Load the model that is currently selected in the <b>Select a Model</b> dropdown menu.</li>
                <li><b>Delete Model</b>: Delete the model that is currently selected in the <b>Select a Model</b> dropdown menu.</li>
                <li><b>New Model</b>: Replace the model in the Graph View with an empty model. You can use this to start diagramming a new decision model.</li>
                <li><b>Save Model</b>: Save the model that is currently open in the Graph View. If the model is not in the API database, it will be added. If the model already exists, it will be updated.</li>
            </ul>
            <h2>Changing the API Base URL</h2>
            <p>
                You can direct the authoring tool to use your own local or external API by typing the new Base URL into the <b>API Base URL</b> textbox and clicking <b>Update</b>.
            </p>
            <h2>Manually load a saved JSON</h2>
            <p>To use your own JSON file as a starting point:</p>
            <ol>
                <li>Delete all contents in the JSON Editor view.</li>
                <li>Open your JSON file in a local text editor.</li>
                <li>Copy the entire text contents of your local JSON file.</li>
                <li>Paste into this tool's JSON view.</li>
            </ol>
        </div>
    )
};

export default HelpTab;