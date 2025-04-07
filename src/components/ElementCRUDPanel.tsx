import { addNewElement } from "../lib/elementCRUD";

type ElementCrudPanelProps = {
    setModelJSON: Function;
    selectionBuffer: Array<string>;
    setSelectionBuffer: Function;
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
}) => {
    const activeButtonClassName = "button-active";

    const addELement = () => {
        setModelJSON((prevModel: any) => addNewElement(prevModel, setSelectionBuffer, 0));
    }

    return (
        <div className="element-crud-panel">
            <div className="element-crud-row">
                <div
                    className={`element-crud-button ${activeButtonClassName}`}
                    onClick={addELement}
                >
                    {selectionBuffer.length === 0 ?<>New<br/>Element</> : <>New Element (Connected)</>}
                </div>
                <div
                    className={`element-crud-button ${selectionBuffer.length > 1 ? activeButtonClassName : ""}`}
                >
                    Toggle<br/>{`Dependenc${selectionBuffer.length > 2 ? "ies" : "y"}`}
                </div>
            </div>
            <div className="element-crud-row">
                <div
                    className={`element-crud-button ${selectionBuffer.length > 0 ? activeButtonClassName : ""}`}
                >
                    Delete<br/>{`Element${selectionBuffer.length > 1 ? "s" : ""}`}
                </div>
                <div
                    className={`element-crud-button ${selectionBuffer.length == 1 ? activeButtonClassName : ""}`}
                >
                    Add Display<br/>to Element
                </div>
            </div>
        </div>
    )
}

export default ElementCRUDPanel;