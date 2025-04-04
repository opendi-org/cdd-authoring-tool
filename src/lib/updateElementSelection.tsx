/**
 * Provides the next state for the given selection buffer after perfomring an action on it.
 * Valid actions:
 * (1) Select an element. Pass element's UUID and select=true.
 * (2) Deselect an element. Pass an element's UUID and select=false.
 * (3) Clear selection buffer. Pass a null element UUID and select=any.
 * All actions require the current selection buffer as a starting point.
 * @param selectionBuffer The current state of the selection buffer.
 * @param elementToUpdateUUID The UUID of the element to select/deselect. Pass null to clear the selection buffer.
 * @param select Flag for whether this element is being selected or deselected.
 * @returns The next state for the selection buffer, with the requested action performed.
 */
export function updateElementSelection(selectionBuffer: string[], elementToUpdateUUID: string | null, select = true): string[] {
    //Handle action: Clear buffer.
    if(elementToUpdateUUID === null)
    {
        return [];
    }

    //Remove any existing instances of the element from the list.
    //An element can only be selected once, and if re-selected, should be moved to the end of the list.
    let nextBuffer = selectionBuffer.filter((elemUUID) => {return elemUUID !== elementToUpdateUUID});
    //Handle action: Select element
    //Deselect is handled naturally from the filter step.
    if(select)
    {
        nextBuffer.push(elementToUpdateUUID);
    }

    return nextBuffer;
}