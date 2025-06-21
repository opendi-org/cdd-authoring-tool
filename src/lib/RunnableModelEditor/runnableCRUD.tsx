import { cleanComponentDisplay } from "../cleanupNames";
import { defaultControlJSON, defaultEvaluatableElementJSON, defaultInputOutputValueJSON, defaultScriptJSON } from "../defaultJSON";

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

/**
 * Pure/immutable: Updates the given model JSON, deleting the specified Eval Element in the specified
 * runnable model
 * 
 * @param model Model JSON to modify (contains the evaluatable element being deleted)
 * @param evalUUID UUID of the evaluatable element (within model) to delete
 * @param runnableModelIndex Index of the Runnable Model (within model) to delete Eval Element from
 * @returns Updated model, with the result of the delete applied
 */
export function deleteEvaluatableElement(model: any, evalUUID: string, runnableModelIndex: number)
{
    let workingModel = structuredClone(model);
    if(workingModel.runnableModels && workingModel.runnableModels[runnableModelIndex] !== undefined)
    {
        if(workingModel.runnableModels[runnableModelIndex].elements)
        {
            const newElements = workingModel.runnableModels[runnableModelIndex].elements.filter((evalElemJSON: any) => evalElemJSON.meta?.uuid !== evalUUID);
            workingModel.runnableModels[runnableModelIndex].elements = newElements;
        }
    }
    return workingModel;
}

/**
 * Pure/immutable: Updates the given model JSON, adding a new Evaluatable Element to the specified
 * runnable model.
 * 
 * @param model Model JSON to modify (contains the runnable model to add eval element to)
 * @param runnableModelIndex Index of the Runnable Model (within model) to add a new Eval Element to
 * @returns Updated model, with the result of the add applied
 */
export function addNewEvaluatableElement(model: any, runnableModelIndex: number)
{
    let workingModel = structuredClone(model);
    if(workingModel.runnableModels && workingModel.runnableModels[runnableModelIndex] !== undefined)
    {
        const newElementJSON = defaultEvaluatableElementJSON();
        let evalElemList = workingModel.runnableModels[runnableModelIndex].elements ?? [];
        evalElemList = [...evalElemList, newElementJSON];
        workingModel.runnableModels[runnableModelIndex].elements = evalElemList;
    }
    return workingModel;
}

/**
 * Pure/immutable: Updates the given model JSON, deleting the specified Control
 * 
 * @param model Model JSON to modify (contains the control to be deleted)
 * @param controlUUID UUID of the Control (within model) to delete
 * @returns Updated model, with the result of the delete applied
 */
export function deleteControl(model: any, controlUUID: string)
{
    let workingModel = structuredClone(model);
    if(workingModel.controls)
    {
        workingModel.controls = workingModel.controls.filter((controlJSON: any) => controlJSON.meta.uuid !== controlUUID)
    }
    return workingModel;
}

/**
 * Pure/immutable: Updates the given model JSON, deleting the specified Display from the specified
 * Control
 * 
 * @param model Model JSON to modify (contains the Control to modify)
 * @param controlUUID UUID of the control to modify (contains the Display to delete)
 * @param displayUUID UUID of the display to delete from the given control (within model)
 * @returns Updated model, with the result of the delete applied
 */
export function deleteDisplayFromControl(model: any, controlUUID: string, displayUUID: string)
{
    let workingModel = structuredClone(model);
    if(workingModel.controls)
    {
        const controlIndex = workingModel.controls.findIndex((controlJSON: any) => controlJSON.meta.uuid === controlUUID);
        if(controlIndex >= 0 && workingModel.controls[controlIndex].displays)
        {
            workingModel.controls[controlIndex].displays = workingModel.controls[controlIndex].displays.filter(
                (entryUUID: string) => entryUUID !== displayUUID
            );
        }
    }
    return workingModel;
}

/**
 * Pure/immutable: Updates the given model JSON, adding the specified Display to the specified
 * Control
 * 
 * @param model Model JSON to modify (contains the control being modified)
 * @param controlUUID UUID of the Control (within model) to add display to
 * @param displayUUID UUID of the display to add to the given control (within model)
 * @returns Updated model, with the result of the add applied
 */
export function addDisplayToControl(model: any, controlUUID: string, displayUUID: string)
{
    let workingModel = structuredClone(model);
    if(workingModel.controls)
    {
        const controlIndex = workingModel.controls.findIndex((controlJSON: any) => controlJSON.meta.uuid === controlUUID);
        if(controlIndex >= 0 && workingModel.controls[controlIndex].displays)
        {
            workingModel.controls[controlIndex].displays = [...workingModel.controls[controlIndex].displays.filter(
                (entryUUID: string) => entryUUID !== displayUUID
            ), displayUUID]
        }
    }
    return workingModel;
}

/**
 * Pure/immutable: Updates the given model JSON, adding a new Control with the given I/O list and
 * Displays
 * 
 * @param model Model JSON to modify
 * @param inputOutputValues List of I/O Value UUIDs to register with this control
 * @param displays List of Display UUIDs to register with this control
 * @returns Updated model, with the result of the add applied
 */
export function addControlToModel(model: any, inputOutputValues: string[] = [], displays: string[] = [])
{
    let workingModel = structuredClone(model);
    workingModel.controls = [...(workingModel.controls ?? []), defaultControlJSON(inputOutputValues, displays)];
    return workingModel;
}

/**
 * Pure/immutable: Updates the given model JSON, adding a new Script Evaluatable Asset to the model
 * 
 * @param model Model JSON to modify
 * @returns Updated model, with the result of the add applied
 */
export function addScriptToModel(model: any)
{
    let workingModel = structuredClone(model);
    workingModel.evaluatableAssets = [...(workingModel.evaluatableAssets ?? []), defaultScriptJSON()];
    return workingModel;
}

/**
 * Pure/immutable: Updates the given model JSON, deleting the requested Evaluatable Asset from the
 * model (after confirming with user)
 * 
 * @param model Model JSON to modify
 * @param assetMeta Meta JSON data for the Evaluatable Asset to be deleted
 * @returns Updated model, with the result of the delete applied
 */
export function deleteEvaluatableAssetFromModel(model: any, assetMeta: any)
{
    let workingModel = structuredClone(model);
    if(workingModel.evaluatableAssets && confirm(`Deleting ${cleanComponentDisplay(assetMeta, "Asset", 5)}\nAre you sure?`))
    {
        workingModel.evaluatableAssets = workingModel.evaluatableAssets.filter((assetJSON: any) => assetJSON.meta.uuid !== assetMeta.uuid)
    }
    return workingModel;
}

/**
 * Pure/immutable: Updates the given model JSON, replacing the script on the specified Evaluatable
 * Asset with the new provided Base64-encoded script
 * 
 * @param model Model JSON to modify (contains the Eval Asset to update)
 * @param assetUUID UUID of the Evaluatable Asset whose script will be updated
 * @param base64Script Base64-encoded string of the new script to assign to the specified Eval Asset
 * @returns Updated model, with the result of the script update applied
 */
export function updateScript(model: any, assetUUID: string, base64Script: string)
{
    let workingModel = structuredClone(model);
    if(workingModel.evaluatableAssets)
    {
        let workingAsset = workingModel.evaluatableAssets.find((assetJSON: any) => assetJSON.meta.uuid === assetUUID);
        if(workingAsset && workingAsset.content && workingAsset.content.script)
        {
            workingAsset.content.script = base64Script;
        }
    }
    return workingModel;
}

/**
 * Pure/immutable: Updates the given model JSON, adding a new I/O value to the model
 * 
 * @param model Model JSON to modify
 * @returns Updated model, with the result of the add applied
 */
export function addIOToModel(model: any)
{
    let workingModel = structuredClone(model);
    workingModel.inputOutputValues = [...(workingModel.inputOutputValues ?? []), defaultInputOutputValueJSON()];
    return workingModel;
}

/**
 * Pure/immutable: Updates the given model JSON, scrubbing all references to the I/O UUIDs given in
 * ioSelectionBuffer from the model. Removes I/O references from Evaluatable Elements and Controls.
 * I/O values should be deleted from the I/O list separately.
 * 
 * @see deleteIOFromModel (Calls this function)
 * 
 * @param model Model JSON to modify
 * @param ioSelectionBuffer Buffer of I/O UUIDs to scrub from the model
 * @returns Updated model, with all references to the I/O values in the selection buffer removed
 */
function scrubIOReferencesFromModel(model: any, ioSelectionBuffer: string[])
{
    let workingModel = structuredClone(model);
    if(workingModel.runnableModels)
    {
        workingModel.runnableModels.forEach((runnableModelJSON: any) => {
            if(runnableModelJSON.elements)
            {
                runnableModelJSON.elements.forEach((evalElement: any) => {
                    evalElement.inputs = (evalElement.inputs ?? []).filter((inputUUID: string) => !ioSelectionBuffer.includes(inputUUID));
                    evalElement.outputs = (evalElement.outputs ?? []).filter((outputUUID: string) => !ioSelectionBuffer.includes(outputUUID));
                });
            }
        })
    }
    if(workingModel.controls)
    {
        workingModel.controls.forEach((controlJSON: any) => {
            controlJSON.inputOutputValues = (controlJSON.inputOutputValues ?? []).filter((ioUUID: string) => !ioSelectionBuffer.includes(ioUUID));
        })
    }
    return workingModel;
}

/**
 * Pure/immutable: Updates the given model JSON, deleting the I/O values specified in the buffer from the
 * model, including any references to those I/O value UUIDs in Evaluatable Elements and Controls.
 * 
 * @param model Model JSON to modify (contains the I/O values to be deleted)
 * @param ioSelectionBuffer Buffer of I/O value UUIDs to delete from the model
 * @returns Updated model, with the result of the deletion(s) applied
 */
export function deleteIOFromModel(model: any, ioSelectionBuffer: string[])
{
    let workingModel = structuredClone(model);
    const toDeleteCount = ioSelectionBuffer.length;
    if(confirm(`Deleting ${toDeleteCount} I/O value${toDeleteCount > 1 ? "s" : ""}.\nAll references in evaluatable elements and controls will also be deleted.\nAre you sure?`))
    {
        //Delete from main I/O list
        ioSelectionBuffer.forEach((ioUUID: string) => {
            workingModel.inputOutputValues = (workingModel.inputOutputValues ?? []).filter((ioJSON: any) => ioJSON.meta.uuid !== ioUUID);
        })
        //Delete all references
        workingModel = scrubIOReferencesFromModel(workingModel, ioSelectionBuffer);
    }
    return workingModel;
}

/**
 * Pure/immutable: Updates the given model JSON, changing the specified Evaluatable Element so that it
 * uses a new (specified) evaluatable asset. This un-sets the associated Function Name used by the Element.
 * 
 * @param model Model JSON to modify (contains the specified runnable model, element, and evaluatable asset)
 * @param runnableModelIndex Index of the runnable model containing the specified Evaluatable Element
 * @param evalElementUUID UUID of the evaluatable element to associate with the given Evaluatable Asset
 * @param evalAssetUUID UUID of the evaluatable asset to associate with the given Evaluatable Element
 * @returns Updated model, with the result of the eval element update applied
 */
export function updateEvalAssetUsedByRunnableElement(model: any, runnableModelIndex: number, evalElementUUID: string, evalAssetUUID: string)
{
    let workingModel = structuredClone(model);
    if(workingModel.runnableModels && workingModel.runnableModels[runnableModelIndex] && workingModel.runnableModels[runnableModelIndex].elements)
    {
        const elemToUpdate = workingModel.runnableModels[runnableModelIndex].elements.find((elementJSON: any) => elementJSON.meta?.uuid === evalElementUUID);
        if(elemToUpdate)
        {
            elemToUpdate.evaluatableAsset = evalAssetUUID;
            elemToUpdate.functionName = "";
        }
    }
    return workingModel;
}

/**
 * Pure/immutable: Updates the given model JSON, changing the specified Evaluatable Element so that it
 * uses a new (specified) function name. This name should be defined by the element's associated Evaluatable
 * Asset, though this function DOES NOT VALIDATE THIS.
 * 
 * @param model Model JSON to modify (contains the specified runnable model, and element)
 * @param runnableModelIndex Index of the runnable model containing the specified Evaluatable Element
 * @param evalElementUUID UUID of the evaluatable element to associate with a new Function Name
 * @param functionName Name of the function to associate with the given evaluatable element
 * @returns Updated model, with the result of the eval element update applied
 */
export function updateFunctionNameUsedByRunnableElement(model: any, runnableModelIndex: number, evalElementUUID: string, functionName: string)
{
    let workingModel = structuredClone(model);
    if(workingModel.runnableModels && workingModel.runnableModels[runnableModelIndex] && workingModel.runnableModels[runnableModelIndex].elements)
    {
        const elemToUpdate = workingModel.runnableModels[runnableModelIndex].elements.find((elementJSON: any) => elementJSON.meta?.uuid === evalElementUUID);
        if(elemToUpdate)
        {
            elemToUpdate.functionName = functionName;
        }
    }
    return workingModel;
}