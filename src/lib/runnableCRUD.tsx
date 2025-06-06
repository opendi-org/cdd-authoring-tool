
/**
 * Pure/immutable: Updates the given IO Value UUID list to add or remove the
 * "selected" IO Value UUIDs in selectedIOs.
 * 
 * @param ioList List of IO value UUIDs to edit
 * @param selectedIOs List of IO value UUIDs to add or remove from ioList
 * @param add Flag for whether selectedIOs will be added (true) or removed (false) from ioList
 * @returns Modified version of ioList with selectedIOs added or removed as requested
 */
function addRemoveIOsFromList(ioList: string[], selectedIOs: string[], add = true): string[] {
    let workingIOList = structuredClone(ioList);
    if(!selectedIOs || selectedIOs.length < 1) return workingIOList;

    if(!workingIOList) workingIOList = [];
    workingIOList = workingIOList.filter((entryUUID: string) => !selectedIOs.includes(entryUUID)); //Remove selected
    if(add) workingIOList = [...workingIOList, ...selectedIOs]; //Optionally, add selected to end of list

    return workingIOList;
}

/**
 * Pure/immutable: Updates the given IO Value UUID list to move the "selected"
 * IO Value UUID by the amount specified in moveAmt.
 * 
 * For example, if selectedIO is at index 3 and moveAmt is -2, this function
 * will return a modified ioList where selectedIO is at index 1, instead of 3.  
 * If moveAmt is 0, this function will return an unmodified copy of ioList.
 * 
 * @param ioList List of IO value UUIDs to edit
 * @param selectedIO UUID of the IO value to move within the list
 * @param moveAmt Distance to move selectedIO value relative to its current position in the list
 * @returns Modified version of ioList with selectedIO moved as requested
 */
function moveIOInList(ioList: string[], selectedIO: string, moveAmt = 0): string[] {
    let workingIOList = structuredClone(ioList);
    const originalIOIndex = ioList.indexOf(selectedIO);
    if(originalIOIndex === -1) return workingIOList;

    const movedIdx = originalIOIndex + moveAmt;
    const clampedIdx = Math.min(Math.max(movedIdx, 0), ioList.length - 1);
    workingIOList = workingIOList.filter((entryUUID: string) => entryUUID !== selectedIO); //Remove selected
    workingIOList.splice(clampedIdx, 0, selectedIO);
    return workingIOList;
}

/**
 * Pure/immutable: Updates the given model JSON, modifying the specified Eval Element in the specified
 * runnable model, adding or removing a list of I/O values from that element's list of Inputs or Outputs.
 * 
 * @param model Model JSON to modify (contains the eval element being modified)
 * @param ioSelectionBuffer Array of UUIDs for selected I/O values to add/remove from the specified Eval Elem
 * @param evalUUID UUID of the Evaluatable Element (within model) to add/remove I/O value(s) from
 * @param runnableModelIndex The index of the Runnable Model (within model) to search for the specified Eval Elem in
 * @param modifyInputs Flag determining whether the selected I/O values should be added/removed from the Eval Elem's Inputs (true) or Outputs (false) list
 * @param add Flag for whether the IOs in ioSelectionBuffer will be added (true) or removed (false) from the Eval Elem
 * @returns Updated model, with the result of the add/remove of IO value(s) from the specified Eval Elem in the given runnable model
 */
function addRemoveIOsFromEvalElement(model: any, ioSelectionBuffer: string[], evalUUID: string, runnableModelIndex: number, modifyInputs = true, add = true) {
    let workingModel = structuredClone(model);
    if(!ioSelectionBuffer || ioSelectionBuffer.length < 1) return workingModel;
    if(workingModel.runnableModels && workingModel.runnableModels[runnableModelIndex] !== undefined)
    {
        const evalElemToModify = workingModel.runnableModels[runnableModelIndex].elements.find(
            (elemJSON: any) => elemJSON.meta.uuid == evalUUID
        );

        if(evalElemToModify !== undefined)
        {
            let listToModify = modifyInputs ? evalElemToModify.inputs : evalElemToModify.outputs;
            listToModify = addRemoveIOsFromList(listToModify, ioSelectionBuffer, add);
            if(modifyInputs) evalElemToModify.inputs = listToModify;
            else evalElemToModify.outputs = listToModify;
        }
    }
    return workingModel;
}

/**
 * Pure/immutable: Updates the given model JSON, modifying the specified Eval Element in the specified
 * runnable model, adding a list of I/O values to that element's list of Inputs or Outputs.
 * 
 * @param model Model JSON to modify (contains the eval element being modified)
 * @param ioSelectionBuffer Array of UUIDs for selected I/O values to add to the specified Eval Elem
 * @param evalUUID UUID of the Evaluatable Element (within model) to add selected I/O values to
 * @param runnableModelIndex Index of the Runnable Model (wtihin model) to add I/O values to
 * @param addAsInput Flag for whether the selected I/O values should be added to the Eval Elem's Inputs list (true) or Outputs list (false)
 * @returns Updated model, with the result of the add applied
 */
export function addIOToEvalElement(model: any, ioSelectionBuffer: string[], evalUUID: string, runnableModelIndex: number, addAsInput = true) {
    return addRemoveIOsFromEvalElement(model, ioSelectionBuffer, evalUUID, runnableModelIndex, addAsInput, true)
}

/**
 * Pure/immutable: Updates the given model JSON, modifying the specified Eval Element in the specified
 * runnable model, removing a list of I/O values from that element's list of Inputs or Outputs (if present).
 * 
 * @param model Model JSON to modify (contains the eval element being modified)
 * @param ioSelectionBuffer Array of UUIDs for selected I/O values to remove from the specified Eval Elem
 * @param evalUUID UUID of the Evaluatable Element (within model) to remove selected I/O values from
 * @param runnableModelIndex Index of the Runnable Model (wtihin model) to remove I/O values from
 * @param removeAsInput Flag for whether the selected I/O values should be removed from the Eval Elem's Inputs list (true) or Outputs list (false)
 * @returns Updated model, with the result of the remove applied
 */
export function removeIOFromEvalElement(model: any, ioSelectionBuffer: string[], evalUUID: string, runnableModelIndex: number, removeAsInput = true) {
    return addRemoveIOsFromEvalElement(model, ioSelectionBuffer, evalUUID, runnableModelIndex, removeAsInput, false);
}

/**
 * Pure/immutable: Updates the given model JSON, modifying the specified Control, adding or removing a
 * list of I/O values from its I/O list
 * 
 * @param model Model JSON to modify (contains the control being modified)
 * @param ioSelectionBuffer Array of UUIDs for selected I/O values to add/remove from the specified Control
 * @param controlUUID UUID of the Control (within model) to add/remove I/O value(s) from
 * @param add Flag for whether the IOs in ioSelectionBuffer will be added (true) or removed (false) from the Control
 * @returns Updated model, with the result of the add/remove of IO value(s) from the specified Control
 */
function addRemoveIOsFromControl(model: any, ioSelectionBuffer: string[], controlUUID: string, add = true) {
    let workingModel = structuredClone(model);
    if(!ioSelectionBuffer || ioSelectionBuffer.length < 1) return workingModel;
    if(workingModel.controls)
    {
        const controlToModify = workingModel.controls.find(
             (controlJSON: any) => controlJSON.meta.uuid == controlUUID
        );

        if(controlToModify !== undefined)
        {
            let listToModify = controlToModify.inputOutputValues ?? [];
            listToModify = addRemoveIOsFromList(listToModify, ioSelectionBuffer, add);
            controlToModify.inputOutputValues = listToModify;
        }
    }
    return workingModel;
}

/**
 * Pure/immutable: Updates the given model JSON, modifying the specified Control, adding a list
 * of I/O values from its I/O list
 * 
 * @param model Model JSON to modify (contains the control being modified)
 * @param ioSelectionBuffer Array of UUIDs for selected I/O values to add to the specified Control
 * @param controlUUID UUID of the Control (within model) to add I/O value(s) to
 * @returns Updated model, with the result of the add applied
 */
export function addIOsToControl(model: any, ioSelectionBuffer: string[], controlUUID: string)
{
    return addRemoveIOsFromControl(model, ioSelectionBuffer, controlUUID, true);
}

/**
 * Pure/immutable: Updates the given model JSON, modifying the specified Control, removing a list
 * of I/O values from its I/O list
 * 
 * @param model Model JSON to modify (contains the control being modified)
 * @param ioSelectionBuffer Array of UUIDs for selected I/O values to remove from the specified Control
 * @param controlUUID UUID of the Control (within model) to remove I/O value(s) from
 * @returns Updated model, with the result of the remove applied
 */
export function removeIOsFromControl(model: any, ioSelectionBuffer: string[], controlUUID: string)
{
    return addRemoveIOsFromControl(model, ioSelectionBuffer, controlUUID, false);
}

/**
 * Pure/immutable: Updates the given model JSON, modifying the specified Eval Element in the specified
 * runnable model, moving an I/O value within that element's list of Inputs or Outputs.
 * 
 * For example, if selectedIO is at index 3 and moveAmt is -2, this function
 * will return a modified ioList where selectedIO is at index 1, instead of 3.  
 * If moveAmt is 0, this function will return an unmodified copy of ioList.
 * 
 * @param model Model JSON to modify (contains the eval element being modified)
 * @param ioUUID UUID of the I/O value to move within one of the Eval Elem's I/O lists
 * @param evalUUID UUID of the Eval Element containing the list with the I/O value to be moved
 * @param runnableModelIndex Index of the runnable model containing the specified Eval Element
 * @param moveAmount Distance to move selectedIO value relative to its current position in the list
 * @param moveAsInput Flag for whether the selected I/O value should be moved in the Eval Elem's Inputs list (true) or Outputs list (false)
 * @returns Updated model, with the result of the move applied
 */
export function moveIOsInEvalElement(model: any, ioUUID: string, evalUUID: string, runnableModelIndex: number, moveAmount: number, moveAsInput: boolean)
{
    let workingModel = structuredClone(model);
    if(workingModel.runnableModels && workingModel.runnableModels[runnableModelIndex] !== undefined)
    {
        const evalElemToModify = workingModel.runnableModels[runnableModelIndex].elements.find(
            (elemJSON: any) => elemJSON.meta.uuid == evalUUID
        );

        if(evalElemToModify !== undefined)
        {
            let listToModify = moveAsInput ? evalElemToModify.inputs : evalElemToModify.outputs;
            listToModify = moveIOInList(listToModify, ioUUID, moveAmount);
            if(moveAsInput) evalElemToModify.inputs = listToModify;
            else evalElemToModify.outputs = listToModify;
        }
    }
    return workingModel;
}

/**
 * Pure/immutable: Updates the given model JSON, modifying the specified Control,
 * moving an I/O value within the Control's I/O list.
 * 
 * For example, if selectedIO is at index 3 and moveAmt is -2, this function
 * will return a modified ioList where selectedIO is at index 1, instead of 3.  
 * If moveAmt is 0, this function will return an unmodified copy of ioList.
 * 
 * @param model Model JSON to modify (contains the Control being modified)
 * @param ioUUID UUID of the I/O value to move within one of the Control's I/O list
 * @param controlUUID UUID of the Control containing the list with the I/O value to be moved
 * @param moveAmount Distance to move selectedIO value relative to its current position in the list
 * @returns Updated model, with the result of the move applied
 */
export function moveIOsInControl(model: any, ioUUID: string, controlUUID: string, moveAmount: number)
{
    let workingModel = structuredClone(model);
    if(workingModel.controls)
    {
        const controlToModify = workingModel.controls.find(
             (controlJSON: any) => controlJSON.meta.uuid == controlUUID
        );

        if(controlToModify !== undefined)
        {
            let listToModify = controlToModify.inputOutputValues ?? [];
            listToModify = moveIOInList(listToModify, ioUUID, moveAmount);
            controlToModify.inputOutputValues = listToModify;
        }
    }
    return workingModel;
}

