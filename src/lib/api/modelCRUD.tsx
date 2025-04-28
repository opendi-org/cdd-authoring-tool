import { DateTime } from "luxon";
import EmptyModel from "../../model_json/empty_cdd.json" assert { type: "json" };
import { v4 as uuidv4 } from "uuid";
import { saveAs } from "file-saver";
import { cleanComponentDisplay } from "../cleanupNames";

/**
 * Generate the current time as a schema-compliant timestamp string.
 * @returns A schema-compliant stringified timestamp for the current DateTime
 */
export function getCurrentTimeAsTimestamp(): string {
    return DateTime.now().toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");
}

/**
 * Generates an OS-friendly, safe file name, given an initial unsafe filename
 * and a file ending. Replaces any unsafe characters with "_"
 * @param unsafeName Initial unsafe filename, WITHOUT the file ending
 * @param ending File ending to append to the final filename
 * @param unsafeCharacters Regular expression that matches any unsafe characters to be replaced in the filename
 * @returns Safe, complete file name with the given ending. All unsafe characters replaced with "_"
 */
export function getSafeFileName(unsafeName: string, ending = ".json", unsafeCharacters = /[^A-Za-z0-9-_]/g): string {
    let workingFileName = unsafeName;
    //If it already has the file ending, remove that
    if(unsafeName.endsWith(ending))
        workingFileName = unsafeName.slice(0, 0 - ending.length);
    if(unsafeName === "")
        workingFileName = "_";

    let workingEnding = ending;
    if(ending === "")
        workingEnding = ".json";
    if(!ending.startsWith('.'))
        workingEnding = `.${ending}`;

    //Replace all unsafe characters with "_"
    return `${workingFileName.replace(unsafeCharacters, '_')}${workingEnding}`
}

/**
 * Prompt the browser to download a file with the given JSON content.
 * This is used to download updated models, using a simple URI href.
 * This means the JSON data will download all on 1 line. Recommend 
 * using an auto-formatter to prettify the file.
 * 
 * @param {string} modelJSON JSON content of the file to download.
 * @param {string} fileName Name of file to be downloaded. If empty, generates based on model metadata.
 */
export function downloadModel(modelJSON: any, fileName = "")
{
    const modelFileName = getSafeFileName(fileName || cleanComponentDisplay(modelJSON.meta, "Model"));

    //Use file-saver to save a blob version of this file
    const jsonString = JSON.stringify(modelJSON, null, 4);
    const jsonBLOB = new Blob([jsonString], { type: "application/json;charset=utf-8" });
    saveAs(jsonBLOB, modelFileName);
}

/**
 * Generate JSON for a new decision model,
 * with an empty diagram
 */
export function getNewModel()
{
    let newModel = structuredClone(EmptyModel);
    newModel.meta.uuid = uuidv4();
    newModel.meta.createdDate = getCurrentTimeAsTimestamp();
    newModel.diagrams[0].meta.uuid = uuidv4();
    newModel.diagrams[0].meta.createdDate = getCurrentTimeAsTimestamp();
    newModel.runnableModels[0].meta.uuid = uuidv4();
    newModel.runnableModels[0].meta.createdDate = getCurrentTimeAsTimestamp();

    return newModel;
}

/**
 * Add a new empty diagram to the given model
 * 
 * (Pure/immutable: Does not update modelJSON directly, but returns
 * an updated version of modelJSON with the action applied)
 * @param modelJSON JSON content of model to add a new diagram to
 * @returns Updated model JSON with new empty diagram added
 */
export function addDiagramToModel(modelJSON: any)
{
    const updatedModel = structuredClone(modelJSON);
    const newDiagram = structuredClone(EmptyModel.diagrams[0]);
    newDiagram.meta.uuid = uuidv4();
    newDiagram.meta.createdDate = getCurrentTimeAsTimestamp();

    const newDiagramsList = [...(updatedModel.diagrams ?? []), newDiagram];
    updatedModel.diagrams = newDiagramsList;
    return updatedModel;
}

/**
 * Removes the requested diagram from the model
 * 
 * (Pure/immutable: Does not update modelJSON directly, but returns
 * an updated version of modelJSON with the action applied)
 * @param modelJSON JSON content of model to delete a diagram from
 * @param diagramIndex Index of the diagram to delete from the model
 * @returns Updated model JSON with the requested diagram removed
 */
export function deleteDiagramFromModel(modelJSON: any, diagramIndex: number)
{
    const updatedModel = structuredClone(modelJSON);
    if(!updatedModel.diagrams || !updatedModel.diagrams[diagramIndex])
    {
        const msg = `Diagram index ${diagramIndex} not found in model.`
        console.error(msg)
        alert(msg)
        return updatedModel;
    }

    updatedModel.diagrams.splice(diagramIndex, 1);
    return updatedModel;
}

/**
 * Makes a copy of the requested diagram within the model.
 * Regenerates the UUID of the copied diagram, but leaves all other
 * UUIDs untouched, so that they can mirror Control values if desired.
 * 
 * (Pure/immutable: Does not update modelJSON directly, but returns
 * an updated version of modelJSON with the action applied)
 * @param modelJSON JSON content of model to copy a diagram within
 * @param diagramIndex Index of the diagram to make a copy of
 * @returns Updated model JSON with the requested diagram copied
 */
export function copyDiagramInModel(modelJSON: any, diagramIndex: number)
{
    const updatedModel = structuredClone(modelJSON);
    if(!modelJSON.diagrams || !modelJSON.diagrams[diagramIndex])
    {
        const msg = `Diagram index ${diagramIndex} not found in model.`
        console.error(msg)
        alert(msg)
        return updatedModel;
    }

    let copiedDiagram = structuredClone(updatedModel.diagrams[diagramIndex]);
    copiedDiagram.meta.uuid = uuidv4();
    updatedModel.diagrams = [...updatedModel.diagrams, copiedDiagram]
    return updatedModel;
}

/**
 * Add a new empty runnable model to the given model
 * 
 * (Pure/immutable: Does not update modelJSON directly, but returns
 * an updated version of modelJSON with the action applied)
 * @param modelJSON JSON content of model to add a new runnable model to
 * @returns Updated model JSON with new empty runnable model added
 */
export function addRunnableModelToModel(modelJSON: any)
{
    const updatedModel = structuredClone(modelJSON);
    const newRunnable = structuredClone(EmptyModel.runnableModels[0]);
    newRunnable.meta.uuid = uuidv4();
    newRunnable.meta.createdDate = getCurrentTimeAsTimestamp();

    const newRunnablesList = [...(updatedModel.runnableModels ?? []), newRunnable];
    updatedModel.runnableModels = newRunnablesList;
    return updatedModel;
}

/**
 * Removes the requested runnable model from the model
 * 
 * (Pure/immutable: Does not update modelJSON directly, but returns
 * an updated version of modelJSON with the action applied)
 * @param modelJSON JSON content of model to delete runnableModel from
 * @param runnableModelIndex Index of the runnable mdoel to delete from the model
 * @returns Updated model JSON with the requested runnable model removed
 */
export function deleteRunnableModelFromModel(modelJSON: any, runnableModelIndex: number)
{
    const updatedModel = structuredClone(modelJSON);
    if(!updatedModel.runnableModels || !updatedModel.runnableModels[runnableModelIndex])
    {
        const msg = `Runnable model index ${runnableModelIndex} not found in model.`
        console.error(msg);
        alert(msg);
        return updatedModel;
    }

    updatedModel.runnableModels.splice(runnableModelIndex, 1);
    return updatedModel;
}