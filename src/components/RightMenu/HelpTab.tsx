import React from "react";

/**
 * Provides details about controls and buttons
 * @returns Help Tab component for the Help menu
 */
const HelpTab: React.FC = () => {
    return (
        <>
            <h2>UI Buttons (Graph view)</h2>
            <ul>
                <li><b>New Element</b>: Create a new decision element. The new element will be placed on the graph, with placeholder values.</li>
                    <ul>
                        <li><b>Option: (Connect New?)</b>: When enabled, this option connects new elements to all selected elements when the new
                        element is created. New element will be placed to the right of the selected existing elements.</li>
                    </ul>
                <li><b>Select All Elements</b>: Selects all elements in the graph view. Elements are selected in the same order they are listed in the model JSON.</li>
                <li><b>Delete Element</b>: When one or more elements are selected, delete the selected element(s). Removes all associated dependencies as well.</li>
                <li><b>Toggle Dependency</b>: When 2 or more elements are selected, toggle causal dependency arrows between the selections.
                    <ul>
                        <li>
                            <b>Option: (Dep Behavior)</b>: Handles dependency toggle behavior:
                            <br/><b>Chain</b>: Creates a chain of dependencies. For the selection <i>[1, 2, 3, 4]</i>, creates dependencies <i>[(1 to 2), (2 to 3), (3 to 4)]</i>.
                            <br/><b>Combine</b>: Combines dependencies onto the last selected element. For the selection <i>[1, 2, 3, 4]</i>, creates dependencies <i>[(1 to 4), (2 to 4), (3 to 4)]</i>.
                        </li>
                    </ul>
                </li>
                <li><b>Add Display to Element</b>: When <b>only one</b> element is selected, adds the display selected in the <b>(Display Type)</b> dropdown to the selected element.</li>
                <ul>
                    <li><b>Option: (Display Type)</b>: Determines which type of Display is added to the selected element.</li>
                </ul>
                <li><b>Del. Display from Element</b>: When <b>only one</b> element is selected, deletes the display selected in the <b>(to delete)</b> dropdown from the selected element.</li>
                <ul>
                    <li><b>Option: (to delete)</b>: Determines which Display is deleted from the selected element.</li>
                </ul>
            </ul>
            <h2>Controls (JSON Editor)</h2>
            <p>In tree view:</p>
            <ul>
                <li><b>Double-click a value</b> to edit.</li>
                <li><b>Right-click</b>: View context menu.</li>
            </ul>
            <h2>File Settings</h2>
            <ul>
                <li><b>New Model</b>: Replace the model in the Graph View with an empty model. You can use this to start diagramming a new decision model.</li>
                <li><b>Save Model</b>: Save the model that is currently open in the Graph View. If the model is not in the API database, it will be added. If the model already exists, it will be updated.</li>
                <li><b>Save as New</b>: Save the current model as a new model. Generates new UUIDs for the model before saving.</li>
                <li><b>Download JSON</b>: Download the JSON file for the current model, for local use.</li>
                <li><b>Pick a Model</b>: Select a saved model from either the API database or the built-in list. The selected model can be loaded or deleted.</li>
                <li><b>Load Model</b>: Load the model that is currently selected in the <b>Pick a Model</b> dropdown menu.</li>
                <li><b>Delete Model</b>: Delete the model that is currently selected in the <b>Pick a Model</b> dropdown menu. Note: built-in models cannot be deleted.</li>
            </ul>
            <h2>Changing the API Base URL</h2>
            <p>
                You can direct the authoring tool to use your own local or external API:<br/>
                In the <b>File</b> menu, type the new Base URL into the <b>API Base URL</b> textbox and clicking <b>Update</b>.
            </p>
            <h2>Manually load a saved JSON file</h2>
            <p>To use your own JSON file as a starting point:</p>
            <ol>
                <li>Delete all contents in the JSON Editor view.</li>
                <li>Open your JSON file in a local text editor.</li>
                <li>Copy the entire text contents of your local JSON file.</li>
                <li>Paste into this tool's JSON view.</li>
            </ol>
            <p>If the graphical view does not update:</p>
            <ol>
                <li>Ensure the JSON editor is in "tree" view.</li>
                <li>Double-click one of the values in the JSON editor to begin editing it.</li>
                <li>Press "Enter" to re-save the JSON.</li>
                <li>This should propagate the JSON back to the graphical view.</li>
            </ol>
        </>
    )
};

export default HelpTab;