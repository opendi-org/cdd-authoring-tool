import { useEffect, useMemo, useState } from "react";
import { addDisplayToElement, addNewElement, deleteDisplayFromElement, deleteElement, toggleDependency } from "../lib/elementCRUD";
import { AssociatedDependencyData } from "../lib/cddTypes";
import DisplayTypeRegistry from "./DisplayTypeRegistry";
import { cleanDisplayTypeName, cleanComponentDisplay } from "../lib/cleanupNames";

type ElementCrudPanelProps = {
    setModelJSON: Function;
    selectedDiagramIndex: number;
    selectionBuffer: Array<string>;
    setSelectionBuffer: Function;
    diagramElementsMap: Map<string, any>;
    elementAssociatedDependenciesMap: Map<string, Set<AssociatedDependencyData>>;
}

/**
 * Renders a panel of buttons for CRUD-ish operations on diagram elements.
 * Currently, panel has buttons for
 * - New Element: Adds a new element to the diagram. If elements are selected when
 * pressed, draws dependency arrows between the selected elements and the new one,
 * with the new element as the target.
 * - Toggle Dependency: Toggles a dependency between two or more selected elements.
 * For each pair of selected elements, dependency source has the lower index in the
 * selection buffer.
 * - Delete Element: Deletes one or more selected elements, and all associated
 * dependencies.
 * - Add Display to Element: Adds a new display to a SINGLE selected element. Button disabled
 * when more than one element is selected.
 */
const ElementCRUDPanel: React.FC<ElementCrudPanelProps> = ({
    setModelJSON,
    selectionBuffer,
    selectedDiagramIndex,
    setSelectionBuffer,
    diagramElementsMap,
    elementAssociatedDependenciesMap,
}) => {
    //For style, to differentiate between active and inactive buttons
    const activeButtonClassName = "button-active";


    // Active state and click callback for: New Element
    const addElementIsActive = true;
    //Flag for whether to connect new element to selected existing elements
    //Controlled by a textbox in the options entry next to the new element button
    const [connectNewElement, setConnectNewElement] = useState(false);
    const addELementClick = () => {
        if(addElementIsActive)
        {
            setModelJSON((prevModel: any) =>
            {
                const [newModelJSON, newSelectionBuffer] = addNewElement(prevModel, selectionBuffer, diagramElementsMap, connectNewElement, selectedDiagramIndex);
                setSelectionBuffer(newSelectionBuffer);
                return newModelJSON;
            });
        }
    }

    //State and click callback for: Toggle Dependency (and related options)
    const toggleDependencyIsActive = useMemo(() => {
        return selectionBuffer.length > 1;
    }, [selectionBuffer]);
    //Used to populate the dropdown for dependnecy toggle behavior
    const dependencyBehaviors: Record<string, string> = {
        chain: "Chain",
        combine: "Combine",
    }
    const [dependencyBehavior, setDependencyBehavior] = useState(dependencyBehaviors[0]); //Which dep behavior, for combine/chain flag
    const toggleDependencyClick = () => {
        if(toggleDependencyIsActive)
        {
            setModelJSON((prevModel: any) => toggleDependency(prevModel, selectionBuffer, diagramElementsMap, elementAssociatedDependenciesMap, dependencyBehavior === dependencyBehaviors.combine, selectedDiagramIndex));
            //Set selection buffer to a copy of itself. Effectively re-selects the selected elements. Re-triggers the JSON path expansion useEffect in CausalDecisionDiagram
            setSelectionBuffer((prev: Array<string>) => structuredClone(prev));
        }
    }

    // Active state and click callback for: Select All
    const selectAllIsActive = useMemo(() => {
        return diagramElementsMap.size > 0;
    }, [diagramElementsMap]);
    const selectAllClick = () => {
        if(selectAllIsActive)
        {
            setSelectionBuffer(Array.from(diagramElementsMap.keys()));
        }
    }

    // Active state and click callback for: Delete Element
    const deleteElementIsActive = useMemo(() => {
        return selectionBuffer.length > 0;
    }, [selectionBuffer]);
    const deleteElementClick = () => {
        if(deleteElementIsActive)
        {
            setModelJSON((prevModel: any) => deleteElement(prevModel, selectionBuffer, elementAssociatedDependenciesMap, selectedDiagramIndex));
            setSelectionBuffer([]);
        }
    }

    // State and click callback for: Add Display to Element (and related options)
    const addDisplayIsActive = useMemo(() => {
        return selectionBuffer.length == 1;
    }, [selectionBuffer]);
    const [displayType, setDisplayType] = useState(Object.keys(DisplayTypeRegistry)[0]); //Display type to add
    const addDisplayClick = () => {
        if(addDisplayIsActive)
        {
            setModelJSON((prevModel: any) => addDisplayToElement(prevModel, selectionBuffer, displayType, selectedDiagramIndex));
            //Set selection buffer to a copy of itself. Effectively re-selects the selected elements. Re-triggers the JSON path expansion useEffect in CausalDecisionDiagram
            setSelectionBuffer((prev: Array<string>) => structuredClone(prev));
        }
    }

    //State and click callback for: Del. Display from Element (and related options)
    const delDisplayIsActive = useMemo(() => {
        if(selectionBuffer.length == 1)
        {
            const elem = diagramElementsMap.get(selectionBuffer[0]);
            return elem && elem.displays && elem.displays.length > 0
        }
        return false;
    }, [selectionBuffer, diagramElementsMap]);
    const [displayToDelete, setDisplayToDelete] = useState("");
    const delDisplayClick = () => {
        if(delDisplayIsActive)
        {
            if(displayToDelete)
            {
                setModelJSON((prevModel: any) => deleteDisplayFromElement(prevModel, selectionBuffer, displayToDelete, selectedDiagramIndex));
                setDisplayToDelete("");
                //Set selection buffer to a copy of itself. Effectively re-selects the selected elements. Re-triggers the JSON path expansion useEffect in CausalDecisionDiagram
                setSelectionBuffer((prev: Array<string>) => structuredClone(prev));
            }
            else
            {
                confirm("Please pick a Display to delete from the selected Diagram Element.")
            }
        }
    }

    //Make sure the display to delete dropdown always starts on (Select)
    useEffect(() => {
        setDisplayToDelete("");
    }, [selectionBuffer, diagramElementsMap])

    /**
     * Generate a <select> with options for all of the Displays attached to
     * the requested Diagram Element. For Del. Display from Element
     * 
     * @param elem The selected Diagram Element to generate options for
     * @returns A <select> tag with options for all the Displays attached to the given Diagram Element
     */
    const generateDisplayOptionsForElement = (elem: any) =>
    {
        if(elem && elem.displays && elem.displays.length > 0)
            {
                const options = [
                    <option value={undefined} key={`option-delElem-none`}>(Pick)</option>
                ];
        
                elem.displays.forEach((displayJSON: any) => {
                    const optionDisplay = `${cleanComponentDisplay(displayJSON.meta, `Display of type [${cleanDisplayTypeName(String(displayJSON.displayType ?? "noDisplayType"))}]`)}`
                    options.push(
                        <option value={displayJSON.meta.uuid} key={`option-delElem-${displayJSON.meta.uuid}`}>{optionDisplay}</option>
                    )
                })
                return (
                    <select name="Display to Delete" value={displayToDelete} onChange={(event) => {setDisplayToDelete(event.target.value)}}>
                        {options}
                    </select>
                )
            }
            return null;
    }

    return (
        <div className="element-crud-panel">
            <div className="element-crud-row">
                <div
                    className={`element-crud-button ${addElementIsActive ? activeButtonClassName : ""}`}
                    onClick={addELementClick}
                >
                    {selectionBuffer.length === 0 || !connectNewElement ?<>New<br/>Element</> : <>New Element (Connected)</>}
                </div>
                <div className="element-crud-options">
                    <label>(Connect New?)</label>
                    <input type="checkbox" className="hoverable" onChange={() => {setConnectNewElement(prev => !prev)}} checked={connectNewElement}/>
                </div>
            </div>
            <div className="element-crud-row">
                <div
                    className={`element-crud-button ${selectAllIsActive ? activeButtonClassName : ""}`}
                    onClick={selectAllClick}
                >
                    Select All<br/>Elements
                </div>
                <div
                    className={`element-crud-button ${deleteElementIsActive ? activeButtonClassName : ""}`}
                    onClick={deleteElementClick}
                >
                    Delete<br/>{`Element${selectionBuffer.length > 1 ? "s" : ""}`}
                </div>
            </div>
            <div className="element-crud-row">
                <div
                    className={`element-crud-button ${toggleDependencyIsActive ? activeButtonClassName : ""}`}
                    onClick={toggleDependencyClick}
                >
                    Toggle<br/>Dependenc{selectionBuffer.length > 2 ? "ies" : "y"}
                </div>
                <div className="element-crud-options">
                    <label>(Dep Behavior)</label>
                    <select name="Dependency Behavior" value={dependencyBehavior} onChange={(event) => {setDependencyBehavior(event.target.value)}}>
                        {Object.keys(dependencyBehaviors).map((behaviorKey: string) => {
                            return <option value={dependencyBehaviors[behaviorKey]} key={`option-${dependencyBehaviors[behaviorKey]}`}>{dependencyBehaviors[behaviorKey]}</option>
                        })}
                    </select>
                </div>
            </div>
            <div className="element-crud-row">
                <div
                    className={`element-crud-button ${addDisplayIsActive ? activeButtonClassName : ""}`}
                    onClick={addDisplayClick}
                >
                    Add Display<br/>to Element
                </div>
                <div className="element-crud-options">
                    <label>(Display type)</label>
                    <select name="Display Type" value={displayType} onChange={(event) => setDisplayType(event.target.value)}>
                        {Object.keys(DisplayTypeRegistry).map((displayType: string) => {
                            return (
                                //Don't create an entry for the 'unknown' type
                                displayType == "unknown" || 
                                <option value={displayType} key={`option-${displayType}`}>{cleanDisplayTypeName(displayType)}</option>
                            )
                        })} 
                    </select>
                </div>
            </div>
            <div className="element-crud-row">
                <div
                    className={`element-crud-button ${delDisplayIsActive ? activeButtonClassName : ""}`}
                    onClick={delDisplayClick}
                >
                    Del. Display<br/>from Element
                </div>
                <div className="element-crud-options">
                    <label>(to delete)</label>
                    {selectionBuffer.length == 1 && generateDisplayOptionsForElement(diagramElementsMap.get(selectionBuffer[0]))}
                </div>
            </div>
        </div>
    )
}

export default ElementCRUDPanel;