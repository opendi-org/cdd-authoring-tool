import * as joint from "@joint/core/dist/joint.js";
import graphData from './schema_compliant_cdd.json' assert {type: 'json'};
import newGraph from './empty_cdd.json' assert {type: 'json'};
import {FunctionButton} from "./uiButtons.js";
import {DecisionElement} from "./graphComponents/decisionElement.js";
import {CausalDependency} from "./graphComponents/causalDependency.js";
import { SelectionBuffer } from "./selectionBuffer/selectionBuffer.js";
import {Config} from "./config.js";
import { v4 as uuidv4 } from 'uuid';

import JSONEditorSelection from "vanilla-jsoneditor";
import { createJSONEditor, toJSONContent } from "vanilla-jsoneditor";
import * as fileIO from "./fileIO.js";
import { cloneDeep } from "lodash-es";
import { getValidator, validateGraphData } from "./validation.js";

import { API } from "./apiClasses/api.js";
import { StaticAPI } from "./apiClasses/staticApi.js";





// ---------------------------
// --- MAIN UI/GRAPH SETUP ---
// ---------------------------


// GLOBALS

var namespace = {
    shapes: joint.shapes,
    DecisionElement
}

var graph = new joint.dia.Graph({}, { cellNamespace: namespace });

//Get an implementation of the API
//See config.js
let api = Config.apiBaseURI === "" ? new StaticAPI() : new API(Config.apiBaseURI);
//Set the api URL textbox value to value from config
const baseURLTextbox = document.getElementById("api-base-url");
baseURLTextbox.value = Config.apiBaseURI;

//Defined in selectionBuffer/selectionBuffer.js
//Keeps track of selected elements
let selectionBuffer = new SelectionBuffer();

let runtimeGraphData = {
    graphElements: {},
    graphLinks: {},
    functionButtons: {}
};

const modelSelector = document.getElementById("models-select");

//Initialize graph and JSON views
refreshAuthoringTool();


//JOINTJS CANVAS

var paper = new joint.dia.Paper({
    el: document.getElementById('jointjspaper'),
    model: graph,
    width: Config.paperWidth,
    height: Config.paperHeight,
    background: {
        color: "#999999"
    },
    gridSize: 10,
    cellViewNamespace: namespace,
    interactive: function(cellView) {
        //Disable interaction on elements we've labeled non-interactive
        if(cellView.model.get('nonInteractive'))
        {
            return false;
        }

        //Otherwise, return the default interactivity settings value
        return {labelMove: false};
    }
});


//JSON EDITOR

let jsonEditorContent = {
    text: "",
    json: undefined,
}
var editorCurrentMode = 'tree';

const editor = createJSONEditor({
    target: document.getElementById("jsoneditor"),
    props: {
        content: jsonEditorContent,
        onChange: handleJSONEditorChange,
        validator: getValidator(),
        onSelect: handleJSONEditorSelectionChange,
        onChangeMode: (mode) => {editorCurrentMode = mode}
    }
});


//HELP MENU

// Menu and tab contents
let menu = document.getElementById("menu");
let helpMenu = document.getElementById("helpmenu");
let glossary = document.getElementById("glossary");
let jsonEditor = document.getElementById("jsoneditor");

// Menu tab buttons
let helpMenuBtn = document.getElementById("help-tab-btn");
let glossaryMenuBtn = document.getElementById("glossary-btn");
let advancedBtn = document.getElementById("advanced-tab-btn");
let exitBtn = document.getElementById("exit-btn");

// Local storage values - these help persist preferences across browser sessions
let helpMenuVal = "help";
let glossaryVal = "glossary";
let jsonEditorVal = "advanced";

// Open menu by default
if (localStorage.getItem("menu") == "open" 
    || localStorage.getItem("menu") == null 
    || localStorage.getItem("menu") == "") {
    menu.style.display = "flex"; // Show menu
    localStorage.setItem("menu", "open"); // Set preference to open
    openLastTab(); // Open last opened tab    
}

// Enable switching between menu tabs
helpMenuBtn.addEventListener("click", showHelpMenu);
glossaryMenuBtn.addEventListener("click", showGlossary);
advancedBtn.addEventListener("click", showJSONEditor);
exitBtn.addEventListener("click", exitMenu);


// API CONTROL BUTTON CLICK RESPONSES

const loadButton = document.getElementById("load-model");
loadButton.addEventListener("click", () => {
    const selectedUUID = modelSelector.value;
    const selectorLabel = document.getElementById("selector-option-" + selectedUUID).innerHTML;
    if(confirm("NOTE: Loading model " + selectorLabel + "\nAny unsaved work on the current model WILL BE LOST."))
    {
        updateViewsWithModel(selectedUUID);
    }
});

const saveButton = document.getElementById("save-model");
saveButton.addEventListener("click", () => {
    const jsonToSave = toJSONContent(editor.get()).json;
    api.saveModel(jsonToSave).then((success) => {
        if (success)
        {
            refreshAuthoringTool();
        }
    })
})

const deleteButton = document.getElementById("delete-model");
deleteButton.addEventListener("click", () => {
    api.deleteModel(modelSelector.value).then((success) => {
        if(success)
        {
            const currentGraphData = toJSONContent(editor.get()).json;
            console.log(modelSelector.value, " ", currentGraphData.meta?.uuid);
            if(modelSelector.value == currentGraphData.meta?.uuid)
            {
                refreshAuthoringTool();
            }
            else
            {
                const optionToDelete = document.getElementById("selector-option-" + modelSelector.value);
                modelSelector.removeChild(optionToDelete);
            }
        }
    })
})

const newModelButton = document.getElementById("new-model");
newModelButton.addEventListener("click", () => {
    const newJSON = cloneDeep(newGraph);
    newJSON.meta.uuid = uuidv4();
    newJSON.meta.createdDate = fileIO.getCurrentTimeAsTimestamp();
    newJSON.diagrams[0].meta.uuid = uuidv4();
    newJSON.diagrams[0].meta.createdDate = fileIO.getCurrentTimeAsTimestamp();

    updateViewsWithModel(null, newJSON);
})

const updateURLButton = document.getElementById("update-api-url");
updateURLButton.addEventListener("click", () => {
    if(confirm("Refreshing the API. You will lose ALL unsaved data. Continue?"))
    {
        const newURL = baseURLTextbox.value;
        api = newURL === "" ? new StaticAPI() : new API(newURL);
        refreshAuthoringTool();
    }
})





// ----------------------------------
// --- BASIC GRAPH/JSON VIEW UTIL ---
// ----------------------------------

/**
 * Refreshes the main views for the authoring tool (JointJS graph and JSON editor).
 * Updates these views with the most-recently-edited model from the API,
 * and refreshes the dropdown menu in the Controls section with an up-to-date model list.
 */
async function refreshAuthoringTool() {
    //Get UUID of the most recently updated model from the API
    let metas = await api.getModelMetas();
    const latest = metas[0]?.uuid ?? "";

    const updatedData = await updateViewsWithModel(latest)
    if(updatedData === null)
    {
        const newEditorContent = {
            text: undefined,
            json: graphData,
        };
        editor.update(newEditorContent);
        jsonEditorContent = newEditorContent;
        initializeGraph(graphData, paper, graph);
    }

    //Fill in selector with latest models
    modelSelector.innerHTML = '';
    if(metas.length > 0)
    {
        metas.forEach((meta) => {
            const metaName = meta?.name ?? "<unnamed>";
            const metaUUID = meta.uuid;
    
            let newOption = document.createElement('option');
            newOption.id = "selector-option-" + metaUUID;
            newOption.value = metaUUID;
            newOption.innerHTML = metaName + " (uuid=" + metaUUID + ")";
            modelSelector.appendChild(newOption);
        })
    }
}

/**
 * Updates the Graph and JSON Editor views with the model with the given UUID.
 * Fetches the model from API.
 * 
 * @param {string} uuid If using the API to fetch a model from the database, pass its UUID to this param
 * @param {JSON} modelJSON If updating views with an unsaved local model, pass the model JSON to this param
 * @returns {JSON} If successful, returns the JSON for the model fetched by api.fetchFullModel. Else, returns null.
 */
async function updateViewsWithModel(uuid = null, modelJSON = null) {
    //Discard old Selection Buffer
    selectionBuffer = new SelectionBuffer();

    const modelData = modelJSON ?? await api.fetchFullModel(uuid);

    if (modelData.meta !== undefined && modelData.meta?.uuid !== "")
    {
        //Elems with null causalType are stored as empty string in the database..
        //Replace these with null value
        modelData.diagrams[0]?.elements?.forEach((elem) => {
            if(elem.causalType === "")
            {
                elem.causalType = null;
            }
        })

        //Update JSON Editor view
        const newEditorContent = {
            text: undefined,
            json: modelData
        }
        editor.update(newEditorContent);
        jsonEditorContent = newEditorContent;

        //Update graph view
        initializeGraph(modelData, paper, graph);

        return modelData;
    }

    return null;
}

/**
 * Defines the CDD graph:  
 * Initialize JointJS graph to the CDD contents given in graphData.  
 * This will clear any existing elements (and UI buttons) on the graph.
 * 
 * NOTE: Uses global runtimeGraphData, defined above.
 * @param {JSON} graphData Source JSON graph data. Must comply with OpenDI schema
 * @param {joint.dia.paper} paper JointJS paper that graph will be drawn to
 * @param {joint.dia.graph} graph JointJS graph object that will hold CDD elements
 */
function initializeGraph(graphData, paper, graph)
{
    graph.clear();
    runtimeGraphData = {
        graphElements: {},
        graphLinks: {},
        functionButtons: {}
    };

    //Validate graph data
    const validationResults = validateGraphData(graphData);
    if(validationResults.errors.length > 0)
    {
        console.log("Graph rendering validation errors:");
        console.log(validationResults.errors);
    }
    if(validationResults.canRender)
    {
        graphData = validationResults.validatedData;

        //Read graph rectangle data from JSON
        const graphElementsJSON = graphData.diagrams[0].elements;

        //Dictionary for storing runtime Rectangle objects
        //Key: Rectangle UUID from JSON (string)
        //Value: Rectangle object generated by JointJS
        const graphElements = {};

        //Send each rect's JSON data to add-to-graph function. Store runtime rects in the dict
        graphElementsJSON.forEach((rectData) => {
            graphElements[rectData.meta.uuid] = DecisionElement.addElementToGraph(rectData, graph, paper);
        });

        runtimeGraphData.graphElements = graphElements;

        //Read graph link data from JSON
        const graphDependenciesJSON = graphData.diagrams[0].dependencies;

        //Dictionary for storing runtime Link objects
        //Key: Link UUID from JSON (string)
        //Value: Link object generated by JointJS
        const graphLinks = {};

        //Send each link to add-to-graph function
        graphDependenciesJSON.forEach((depData) => {
            graphLinks[depData.meta.uuid] = CausalDependency.addLinkToGraph(depData, graph, graphElements);
        });

        runtimeGraphData.graphLinks = graphLinks;
    }


    //Dictionary for storing runtime Function Button objects
    //Key: Button UUID generated by uuidv4
    //Value: Function Button with JointJS object etc.
    const functionButtons = {};

    const newElementButton = new FunctionButton(0, 0, 80, 20, "New Elem", addNewElement, [runtimeGraphData, graph, paper]);
    functionButtons[newElementButton.uuid] = newElementButton;
    newElementButton.JointRect.addTo(graph);

    const deleteElementButton = new FunctionButton(0, 25, 80, 20, "Del Elem", deleteElements, [selectionBuffer, runtimeGraphData]);
    functionButtons[deleteElementButton.uuid] = deleteElementButton;
    deleteElementButton.JointRect.addTo(graph);

    const toggleDependencyButton = new FunctionButton(0, 50, 80, 20, "Toggle Dep", toggleDependency, [selectionBuffer, runtimeGraphData, graph]);
    functionButtons[toggleDependencyButton.uuid] = toggleDependencyButton;
    toggleDependencyButton.JointRect.addTo(graph);

    // Menu containing JSON editor, description of controls, and glossary
    const menuButton = new FunctionButton(0, 75, 80, 20, "Menu", toggleMenu, []);
    functionButtons[menuButton.uuid] = menuButton;
    menuButton.JointRect.addTo(graph);

    runtimeGraphData.functionButtons = functionButtons;
}





// -----------------------------------
// --- EDITOR/GRAPH ROUND-TRIP I/O ---
// -----------------------------------

/**
 * Callback function that runs whenever the contents of the JSON in the editor change.
 * This is only triggered when the user manually edits the JSON, and not during @see handleGraphChange
 * 
 * See https://github.com/josdejong/svelte-jsoneditor?tab=readme-ov-file#onchange
 * 
 * @param {Object} updatedContent New content object. Holds the latest JSON from the editor, in either a .json or a .text property
 * @param {JSON} [updatedContent.json] Latest JSON from the editor, in JSON object form.
 * @param {string} [updatedContent.text] Latest JSON from the editor, in string form.
 * @param {Object} previousContent Old content object. Holds the previous JSON from the editor, before current changes were made.
 * @param {JSON} [previousContent.json] Old JSON from the editor, in JSON object form.
 * @param {string} [previousContent.text] Old JSON from the editor, in string form.
 * @param {Object} param2 Splits content errors and patch results into 2 different params.
 * @param {Array<Object>} param2.contentErrors List of JSON content errors detected by the editor.
 * @param {Object} param2.patchResult JSON patch object representing the change.
 */
function handleJSONEditorChange(updatedContent, previousContent, { contentErrors, patchResult }) {
    if(!contentErrors)
    {
        // Syntax: nullish coalescing operator. This can resolve fully nullish and that's fine.
        const newJSON = updatedContent.json ?? (updatedContent.text ? JSON.parse(updatedContent.text) : null);
        initializeGraph(newJSON, paper, graph);
        jsonEditorContent = updatedContent;
    }
}

/**
 * Generates an up-to-date JSON representation of the CDD graph. Passes new JSON to the JSON editor.
 * 
 * Called when changes relevant to the JSON save state of the CDD are made with the JointJS graph view.
 * For instance, when dragging to reposition elements, toggling dependencies, etc.
 * @param {Object} runtimeGraphData Holds maps of JointJS runtime graph data
 * @param {Map<string,CausalDependency>} runtimeGraphData.graphLinks Map of dependency UUIDs to runtime representations of dependencies
 * @param {Map<string,DecisionElement>} runtimeGraphData.graphElements Map of element UUIDs to runtime representations of elements
 * @param {Map<string, FunctionButton>} [runtimeGraphData.functionButtons] Map of button UUIDs to runtime representation of function buttons
 */
function handleGraphChange(runtimeGraphData)
{
    const oldContent = toJSONContent(editor.get());
    //cloneDeep: svelte-jsoneditor is allergic to mutable changes on its JSON content. See https://github.com/josdejong/svelte-jsoneditor?tab=readme-ov-file#immutability
    //Currently using the "simple but inefficient" solution
    const newContent = cloneDeep(oldContent);
    newContent.json = fileIO.saveGraphJSON(newContent.json, runtimeGraphData.graphElements, runtimeGraphData.graphLinks)
    editor.update(newContent);
}





// -----------------------------------
// --- OTHER JSON EDITOR CALLBACKS ---
// -----------------------------------

/**
 * Called when user selects JSON content at some editor JSON path.
 * Check if JSON selected corresponds to an element. If so, select that
 * element.
 * @param {JSONEditorSelection | undefined} selection 
 */
function handleJSONEditorSelectionChange(selection)
{
    //For a key selection, the selection object will have path property
    //For a multi selection, object will have anchorPath to mark start of selection
    //For any weirder selections, we'll just not bother for now.
    const selectionPathStart = selection?.path ?? selection?.anchorPath ?? [];
    //For multi selection, object will have focusPath to mark end of selection
    const selectionPathEnd = selection?.focusPath ?? selectionPathStart;

    //Relevant paths will be something like ["diagrams", "0", "elements", "<element index>", ... ]
    if(selectionPathStart.length >= 4 && selectionPathStart[2] === "elements")
    {
        const startElementIdx = Number(selectionPathStart[3]);
        let endElementIdx = startElementIdx;
        if(selectionPathEnd.length >= 4 && selectionPathStart[2] == "elements")
        {
            endElementIdx = Number(selectionPathEnd[3]);
        }

        selectionBuffer.updateSelections(runtimeGraphData.graphLinks, null);

        //Iterate over selected indices. Add elements at those indices to selection buffer
        for(let idx = Math.min(startElementIdx, endElementIdx); idx <= Math.max(startElementIdx, endElementIdx); idx++)
        {
            const selectedElementUUID = toJSONContent(editor.get()).json.diagrams[0].elements[idx].meta.uuid;
            const elementToSelect = runtimeGraphData.graphElements[selectedElementUUID];

            selectionBuffer.updateSelections(runtimeGraphData.graphLinks, elementToSelect);
        }
    }

}

/**
 * Update JSON view based on what has been selected in the graph view.
 * Select the JSON for the most-recently selected element.
 * Collapse all other JSON, expand JSON for selected element.
 * @param {SelectionBuffer} selectionBuffer Buffer of selected elements, used to update JSON view
 */
function updateJSONEditorSelection(selectionBuffer, jsonEditor)
{
    //"Tree" is the only view mode that supports expand/collapse functions.
    if(editorCurrentMode !== "tree")
    {
        return;
    }
    //If we add multi-diagram support in the future, this will need to be settable
    const currentDiagram = "0";

    if(selectionBuffer.buffer.length > 0)
    {
        
        /**
         * Get array index of an element or dependency by its UUID.
         * svelte-jsoneditor uses array index for JSON path stuff.
         * 
         * @param {string} uuid UUID of element or dependency to find
         * @param {boolean} idIsDependency Whether to look for this UUID in the list of elements or dependencies
         * @returns {number} The array index of the given element/dependency
         */
        const findIdx = (uuid, idIsDependency = false) => {
            const listToSearch = idIsDependency ?
                toJSONContent(jsonEditor.get()).json.diagrams[0].dependencies :
                toJSONContent(jsonEditor.get()).json.diagrams[0].elements;

            // Find UUID in list, get the index.
            for(let i = 0; i < listToSearch.length; i++)
            {
                if(listToSearch[i].meta.uuid === uuid)
                {
                    return i;
                }
            }
            return undefined;
        }

        let elementPaths = [];
        let allAssociatedDependencies = new Set(); //Store dep UUIDs as strings here. Set ensures no duplicates.
        selectionBuffer.buffer.forEach((elem) => {
            //Add element's JSON path to the list
            const elemUUID = elem.originalJSON.meta.uuid.toString();
            const elemIdx = findIdx(elemUUID, false);
            if(elemIdx !== undefined)
            {
                elementPaths.push(["diagrams", currentDiagram, "elements", elemIdx.toString()]);
            }

            //Add associated dependency UUIDs to the set
            elem.associatedDependencies.forEach((depUUID) => allAssociatedDependencies.add(depUUID.toString()));
        });

        let dependencyPaths = [];
        allAssociatedDependencies.forEach((depUUID) => {
            //Add dependency's JSON path to the list
            const depIdx = findIdx(depUUID, true);
            if(depIdx !== undefined)
            {
                dependencyPaths.push(["diagrams", currentDiagram, "dependencies", depIdx.toString()]);
            }
        })

        // Perform JSON Editor view changes:
        // Collapse all groups. Expand selected elements and their associated dependencies. Scroll to most-recently-selected element.
        jsonEditor.collapse([], true);

        elementPaths.forEach((path) => jsonEditor.expand(path, () => true));
        dependencyPaths.forEach((path) => jsonEditor.expand(path, () => true));

        if(elementPaths.length > 0)
        {
            jsonEditor.scrollTo(elementPaths[elementPaths.length - 1]);
        }
    }
    else
    {
        //Expand all, scroll to top
        jsonEditor.expand([], () => true);
        jsonEditor.scrollTo([]);
    }
}





// -------------------------------
// --- ELEMENT CRUD OPERATIONS ---
// -------------------------------

/**
 * Add a new causal decision element to the CDD. The element initializes with a set of default values,
 * which can be updated in the JSON editor.
 * 
 * (Also updates the JSON Editor view)
 * 
 * @param {Object} runtimeGraphData Holds maps of JointJS runtime graph data
 * @param {Map<string,CausalDependency>} [runtimeGraphData.graphLinks] Map of dependency UUIDs to runtime representations of dependencies
 * @param {Map<string,DecisionElement>} runtimeGraphData.graphElements Map of element UUIDs to runtime representations of elements
 * @param {Map<string, FunctionButton>} [runtimeGraphData.functionButtons] Map of button UUIDs to runtime representation of function buttons
 * @param {joint.dia.paper} paper JointJS paper that displays the graph
 * @param {joint.dia.graph} graph JointJS graph object that will hold the new CDD element
 */
function addNewElement(runtimeGraphData, graph, paper)
{
    const newElementUUID = uuidv4();
    const addElementJSON = {
        "meta": {
            "uuid": newElementUUID,
            "name": "New Element"
        },
        "causalType": null,
        "diaType": "box",
        "content": {
            "position": {
                "x": 100,
                "y": 100
            },
            "boundingBoxSize": {
                "width": 400,
                "height": 500
            }
        }
    };

    runtimeGraphData.graphElements[newElementUUID] = DecisionElement.addElementToGraph(addElementJSON, graph, paper);
    handleGraphChange(runtimeGraphData); //Update JSON editor
}

/**
 * Delete a causal dependency from the CDD.
 * NOTE: This function does not delete the dependency from the JSON editor view.
 * 
 * Used here:
 * @see toggleDependency
 * @see deleteElements
 * 
 * @param {string} depUUID UUID of the dependency to delete
 * @param {Object} runtimeGraphData Holds maps of JointJS runtime graph data
 * @param {Map<string,CausalDependency>} runtimeGraphData.graphLinks Map of dependency UUIDs to runtime representations of dependencies
 * @param {Map<string,DecisionElement>} [runtimeGraphData.graphElements] Map of element UUIDs to runtime representations of elements
 * @param {Map<string, FunctionButton>} [runtimeGraphData.functionButtons] Map of button UUIDs to runtime representation of function buttons
 */
function deleteDependency(depUUID, runtimeGraphData)
{
    //Deregister this dependency from the "associated dependencies" list in its source and target DecisionElement objects
    const deregisterSelf = (depUUID) => {
        const dep = runtimeGraphData.graphLinks[depUUID];
        const idxAtSource = dep.runtimeSource.associatedDependencies.indexOf(depUUID);
        const idxAtTarget = dep.runtimeTarget.associatedDependencies.indexOf(depUUID);
        dep.runtimeSource.associatedDependencies.splice(idxAtSource, 1);
        dep.runtimeTarget.associatedDependencies.splice(idxAtTarget, 1);
    }

    deregisterSelf(depUUID);            //Helper defined above
    runtimeGraphData.graphLinks[depUUID].remove();    //JointJS: remove from actual graph
    delete runtimeGraphData.graphLinks[depUUID];      //Remove from master dict of links
}

/**
 * Delete all elements that are currently selected.
 * Deletes all dependencies associated with all elements to be deleted.
 * 
 * (Also updates the JSON Editor view)
 * 
 * @param {SelectionBuffer} selectionBuffer SelectionBuffer containing all selected elements.
 * @param {Object} runtimeGraphData Holds maps of JointJS runtime graph data
 * @param {Map<string,CausalDependency>} runtimeGraphData.graphLinks Map of dependency UUIDs to runtime representations of dependencies
 * @param {Map<string,DecisionElement>} runtimeGraphData.graphElements Map of element UUIDs to runtime representations of elements
 * @param {Map<string, FunctionButton>} [runtimeGraphData.functionButtons] Map of button UUIDs to runtime representation of function buttons
 */
function deleteElements(selectionBuffer, runtimeGraphData)
{
    //Filter an array to unique values only
    //Thanks: https://stackoverflow.com/a/14438954
    const uniqueFilter = (value, index, array) => {
        return array.indexOf(value) === index;
    }

    //Get arrays of elements and dependencies to delete. Use counts for confirmation dialogue.
    const elemsToDelete = selectionBuffer.buffer.filter(uniqueFilter);
    const numElemsToDelete = elemsToDelete.length;

    let depsToDelete = [];
    elemsToDelete.forEach((elem) => {
        depsToDelete.push(...elem.associatedDependencies);
    });
    depsToDelete = depsToDelete.filter(uniqueFilter);
    const numDepsToDelete = depsToDelete.length;

    if(confirm("Deleting  " + numElemsToDelete + " element/s and " + numDepsToDelete + " associated dependency/ies. Are you sure?"))
    {
        //Delete all dependencies
        depsToDelete.forEach((depUUID) => {
            deleteDependency(depUUID, runtimeGraphData);
        });

        //Delete all elements
        elemsToDelete.forEach((elem) => {
            elem.remove();                                          //JointJS: remove from actual graph
            delete runtimeGraphData.graphElements[elem.originalJSON.meta.uuid];   //Remove from master dict of elements
        });
    }

    handleGraphChange(runtimeGraphData); //Update JSON editor
}

/**
 * Creates a fresh dependency with the given source and target elements, and adds it to the given graph.
 * 
 * Used here:
 * @see toggleDependency
 * 
 * @param {DecisionElement} sourceElem Source element for the dependency
 * @param {DecisionElement} targetElem Target element for the dependency
 * @param {Object} runtimeGraphData Holds maps of JointJS runtime graph data
 * @param {Map<string,CausalDependency>} runtimeGraphData.graphLinks Map of dependency UUIDs to runtime representations of dependencies
 * @param {Map<string,DecisionElement>} runtimeGraphData.graphElements Map of element UUIDs to runtime representations of elements
 * @param {Map<string, FunctionButton>} [runtimeGraphData.functionButtons] Map of button UUIDs to runtime representation of function buttons
 * @param {joint.dia.graph} graph JoinstJS Graph containing CDD elements
 */
function addNewDependency(sourceElem, targetElem, runtimeGraphData, graph)
{
    const newDepUUID = uuidv4();
    const newDepName = "" + sourceElem.originalJSON.meta.name + " --> " + targetElem.originalJSON.meta.name;
    const sourceUUID = sourceElem.originalJSON.meta.uuid;
    const targetUUID = targetElem.originalJSON.meta.uuid;
    const addDepJSON = {
        "meta": {
            "uuid": newDepUUID,
            "name": newDepName
        },
        "source": sourceUUID,
        "target": targetUUID
    };

    runtimeGraphData.graphLinks[newDepUUID] = CausalDependency.addLinkToGraph(addDepJSON, graph, runtimeGraphData.graphElements);
    runtimeGraphData.graphLinks[newDepUUID].updateSelection();
}

/**
 * Opens/closes menu when "Menu" button on graph is clicked.
 * When menu is opened, it should open to the last opened menu tab.
 */
function toggleMenu() {
    if (menu.style.display == "none" || menu.style.display == "") { // Open menu
        menu.style.display = "flex";
        localStorage.setItem("menu", "open");
        // Open to last opened menu tab
        openLastTab();
    } else { // Close menu
        exitMenu();
    }
}

/**
 * Open the last opened menu tab.
 */
function openLastTab()
{
    if (localStorage.getItem("tab") == glossaryVal) {
        showGlossary();
    } else if (localStorage.getItem("tab") == helpMenuVal) {
        showHelpMenu();
    } else { // Default...
        showJSONEditor();
    }
}

/**
 * Switches menu tab to help menu when the user clicks on the "Help" tab.
 */
function showHelpMenu() {
    showMenuTab(helpMenu, helpMenuBtn, helpMenuVal);
}

/**
 * Switches menu tab to glossary when the user clicks on the "Glossary" tab.
 */
function showGlossary() {
    showMenuTab(glossary, glossaryMenuBtn, glossaryVal);
}

/**
 * Switches menu tab to JSON editor when the user clicks on the "Advanced" tab.
 */
function showJSONEditor() {
    showMenuTab(jsonEditor, advancedBtn, jsonEditorVal);
}

/**
 * Switches to specified menu tab.
 * @param {HTMLElement} menuContent Menu contents to display (i.e. JSON Editor)
 * @param {HTMLElement} menuTab Menu tab button that corresponds to menuContent (i.e. Advanced button)
 * @param {string} localStorageVal Local storage value that corresponds to menuContent (i.e. "advanced")
 */
function showMenuTab(menuContent, menuTab, localStorageVal) {
    // Show only open menu tab contents (i.e. JSON Editor)
    let menuContents = document.getElementById("menu-contents").children;
    for (var i = 0; i < menuContents.length; i++) {
        let currentTab = menuContents[i];
        if (currentTab == menuContent) {
            currentTab.style.display = "flex";
        } else {
            currentTab.style.display = "none";
        }
    }

    // Highlight only selected menu tab button (i.e. Advanced button)
    let menuTabs = document.getElementById("menu-tabs").children;
    for (var i = 0; i < menuTabs.length; i++) {
        let currentButton = menuTabs[i];
        if (currentButton == menuTab) {
            currentButton.classList.add("selected-tab");
        } else {
            currentButton.classList.remove("selected-tab");
        }
    }

    // Set tab preference - when user refreshes or visits the page from another browser tab/window, 
    // the same menu tab will be open
    localStorage.setItem("tab", localStorageVal);
}

/**
 * Closes menu when the user presses the "Exit" button in the menu banner.
 */
function exitMenu() {
    menu.style.display = "none";
    localStorage.setItem("menu", "closed");
}

/**
 * Toggles dependencies between all selected elements.
 * If 2 elements are selected, toggles dependency directed in order of the selection.
 * If more than 2 elements are selected, toggles multiple dependencies in a chain ordered by selection.
 * For chaining, prefers ADDING dependencies if some already exist but chain is incomplete.
 * 
 * (Also updates the JSON Editor view)
 * 
 * @param {SelectionBuffer} selectionBuffer SelectionBuffer containing all selected elements.
 * @param {Object} runtimeGraphData Holds maps of JointJS runtime graph data
 * @param {Map<string,CausalDependency>} runtimeGraphData.graphLinks Map of dependency UUIDs to runtime representations of dependencies
 * @param {Map<string,DecisionElement>} runtimeGraphData.graphElements Map of element UUIDs to runtime representations of elements
 * @param {Map<string, FunctionButton>} [runtimeGraphData.functionButtons] Map of button UUIDs to runtime representation of function buttons
 * @param {joint.dia.graph} graph JoinstJS Graph containing CDD elements
 */
function toggleDependency(selectionBuffer, runtimeGraphData, graph)
{
    /**
     * lil helper function
     * Checks to see if a dependency already exists between the given source element and target element.
     * If found, returns UUID for the dependency. Otherwise, returns null.
     * @param {DecisionElement} sourceElem Source element to check
     * @param {DecisionElement} targetElem Target element to check
     * @returns {string} UUID of found existing dependency. null if no dependency found.
     */
    const dependencyExists = (sourceElem, targetElem) => {
        const targetUUID = targetElem.originalJSON.meta.uuid;
        let result = null;
        //Check associated dependencies on the source.
        //See if associated target matches the target we're checking.
        sourceElem.associatedDependencies.forEach((depUUID) => {
            const associatedTargetUUID = runtimeGraphData.graphLinks[depUUID].runtimeTarget.originalJSON.meta.uuid;
            if(associatedTargetUUID == targetUUID)
            {
                result = depUUID;
            }
        });

        return result;
    }

    
    //MAIN LOGIC STARTS HERE

    //Make sure we have enough selected to bother
    if(selectionBuffer.buffer.length >= 2)
    {
        /**
         * Run through the selection buffer, pairwise. Initially, assume that we will add
         * new deps wherever they are missing. However, if we get to the end of the buffer
         * and no deps were missing, remove all deps. To make this easier, keep a running
         * list of existing deps until the first "hole" is found. That way, if no holes
         * exist, we'll have our list of deletions ready.
         */
        let someDepsMissing = false;
        let existingDeps = [];
        for(let bufferIdx = 0; bufferIdx + 1 < selectionBuffer.buffer.length; bufferIdx++)
        {
            //Skip instances where consecutive selections are the same (double-selected one element)
            if(selectionBuffer.buffer[bufferIdx].originalJSON.meta.uuid !== selectionBuffer.buffer[bufferIdx + 1].originalJSON.meta.uuid)
            {
                const existingDepUUID = dependencyExists(selectionBuffer.buffer[bufferIdx], selectionBuffer.buffer[bufferIdx + 1]);
                if(existingDepUUID !== null)
                {
                    //If this flag is set, no need to occupy more memory. We won't use this array.
                    if(!someDepsMissing)
                    {
                        existingDeps.push(existingDepUUID);
                    }
                }
                else
                {
                    someDepsMissing = true;
                    addNewDependency(selectionBuffer.buffer[bufferIdx], selectionBuffer.buffer[bufferIdx + 1], runtimeGraphData, graph);
                }
            }
        }

        //If we got through the whole buffer and added no new deps,
        //delete all existing deps.
        if(!someDepsMissing)
        {
            existingDeps.forEach((depUUID) => {
                deleteDependency(depUUID, runtimeGraphData);
            });
        }
    }
    handleGraphChange(runtimeGraphData); //Update JSON editor
}





// ----------------------------
// --- JOINTJS GRAPH EVENTS ---
// ----------------------------

/**
 * Click event (elements)
 */
paper.on('element:pointerclick', function (cell) {
    const cellUUID = cell.model.get('uuid');

    //Handles all function buttons
    if(cell.model.get('isFunctionButton'))
    {
        //Get the button by id, call its callback function with the supplied args array
        const button = runtimeGraphData.functionButtons[cellUUID];
        button.callback(...button.args);    //Spread args to convert array to arguments
    }
});

/**
 * Pointer up event (elements)
 */
paper.on('element:pointerup', function (cellView)
{
    const cellUUID = cellView.model.get('uuid');

    //See if it's a decision element
    const decisionElem = runtimeGraphData.graphElements[cellUUID];
    if(decisionElem != null)
    {
        //Select the element
        selectionBuffer.bufferSize = SelectionBuffer.DefaultBufferSize;
        selectionBuffer.updateSelections(runtimeGraphData.graphLinks, decisionElem);

        handleGraphChange(runtimeGraphData);

        updateJSONEditorSelection(selectionBuffer, editor);
    }
});

/**
 * Pointer up event (non-element, blank area of the paper)
 */
paper.on('blank:pointerup', function (evt, x, y) {
    //Deselect elements
    selectionBuffer.bufferSize = SelectionBuffer.DefaultBufferSize;
    selectionBuffer.updateSelections(runtimeGraphData.graphLinks);

    updateJSONEditorSelection(selectionBuffer, editor);
});

/**
 * Right-click event (elements)
 */
paper.on('element:contextmenu', function(cell) {
    const cellUUID = cell.model.get('uuid');

    //See if it's a decision element
    const decisionElem = runtimeGraphData.graphElements[cellUUID];
    if(decisionElem != null)
    {
        //Multi-select elements
        selectionBuffer.bufferSize = SelectionBuffer.MaxBufferSize;
        selectionBuffer.updateSelections(runtimeGraphData.graphLinks, decisionElem);

        updateJSONEditorSelection(selectionBuffer, editor);
    }
})





/**
 * ACKNOWLEDGEMENTS
 * 
 * svelte-jsoneditor:
 * Svelte JSON Editor used here under the ISC License, with its copyright notice and permission notice included as required:
 *      Copyright (c) 2020-2024 by Jos de Jong.
 *      Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted,
 *      provided that the above copyright notice and this permission notice appear in all copies.
 * See original license online: https://github.com/josdejong/svelte-jsoneditor?tab=License-1-ov-file#readme
 */