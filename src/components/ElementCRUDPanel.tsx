import { useMemo } from "react";
import { addNewElement, deleteElement } from "../lib/elementCRUD";

type ElementCrudPanelProps = {
    setModelJSON: Function;
    selectionBuffer: Array<string>;
    setSelectionBuffer: Function;
    diagramElementsMap: Map<string, any>;
    elementAssociatedDependenciesMap: Map<string, Set<string>>;
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
    setSelectionBuffer,
    diagramElementsMap,
    elementAssociatedDependenciesMap,
}) => {
    //For style, to differentiate between active and inactive buttons
    const activeButtonClassName = "button-active";

    // Active state and click callback for: Add Element
    const addElementIsActive = true;
    const addELementClick = () => {
        if(addElementIsActive)
        {
            setModelJSON((prevModel: any) =>
                addNewElement(prevModel, selectionBuffer, setSelectionBuffer, diagramElementsMap, 0));
        }
    }

    // Active state and click callback for: Toggle Dependency
    const toggleDependencyIsActive = useMemo(() => {
        return selectionBuffer.length > 1;
    }, [selectionBuffer]);
    const toggleDependencyClick = () => {
        if(toggleDependencyIsActive)
        {
            //TODO: Implement
        }
    }

    // Active state and click callback for: Delete Element
    const deleteElementIsActive = useMemo(() => {
        return selectionBuffer.length > 0;
    }, [selectionBuffer]);
    const deleteElementClick = () => {
        if(deleteElementIsActive)
        {
            setModelJSON((prevModel: any) => deleteElement(prevModel, selectionBuffer, setSelectionBuffer, elementAssociatedDependenciesMap, 0))
        }
    }

    // Active state and click callback for: Add Display to Element
    const addDisplayIsActive = useMemo(() => {
        return selectionBuffer.length == 1;
    }, [selectionBuffer]);
    const addDisplayClick = () => {
        if(addDisplayIsActive)
        {
            //TODO: Implement
        }
    }

    return (
        <div className="element-crud-panel">
            <div className="element-crud-row">
                <div
                    className={`element-crud-button ${addElementIsActive ? activeButtonClassName : ""}`}
                    onClick={addELementClick}
                >
                    {selectionBuffer.length === 0 ?<>New<br/>Element</> : <>New Element (Connected)</>}
                </div>
                <div
                    className={`element-crud-button ${toggleDependencyIsActive ? activeButtonClassName : ""}`}
                    onClick={toggleDependencyClick}
                >
                    Toggle<br/>{`Dependenc${selectionBuffer.length > 2 ? "ies" : "y"}`}
                </div>
            </div>
            <div className="element-crud-row">
                <div
                    className={`element-crud-button ${deleteElementIsActive ? activeButtonClassName : ""}`}
                    onClick={deleteElementClick}
                >
                    Delete<br/>{`Element${selectionBuffer.length > 1 ? "s" : ""}`}
                </div>
                <div
                    className={`element-crud-button ${addDisplayIsActive ? activeButtonClassName : ""}`}
                    onClick={addDisplayClick}
                >
                    Add Display<br/>to Element
                </div>
            </div>
        </div>
    )
}

export default ElementCRUDPanel;