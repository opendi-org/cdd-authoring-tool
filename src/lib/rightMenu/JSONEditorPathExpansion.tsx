import { AssociatedDependencyData } from "../Diagram/cddTypes";
import { findIndexOfDependency, findIndexOfElement } from "../Diagram/diagramCRUD";

/**
 * Returns a list of JSON paths related to the selected diagram elements.
 * These paths are intended to be expanded in the JSON editor. The last path in the list will be the scroll anchor.
 * Pass an empty selection buffer to revert JSON editor to default expanded state for the diagram view.
 * 
 * "Related" expanded paths will include paths to definitions for:
 * - The Diagram Elements themselves
 * - Dependencies that reference the selected Diagram Elements as source or target
 * @param selectionBuffer List of UUIDs for selected diagram elements
 * @param model CDM JSON
 * @param associatedDependenciesMap Map from diagram element UUIDs to list of dependencies associated with that element
 * @returns List of JSON paths to expand related to the selected diagram elements
 */
export function getExpandedPathsForSelectedDiagramElements(
    selectionBuffer: Array<string>,
    model: any,
    associatedDependenciesMap: Map<string, Set<AssociatedDependencyData>>,
    selectedDiagramIndex: number = 0
): Array<Array<string>> {

    if(selectionBuffer.length > 0)
    {
        let depsUUIDsToExpand = new Set<string>();

        let elemPathsToExpand = new Array<Array<string>>();
        let depsPathsToExpand = new Array<Array<string>>();

        //Find all dependencies associated with the selected elements
        //Construct JSON paths for the selected elements while we're at it
        selectionBuffer.forEach((elemUUID: string) => {
            //Path
            const elemIdx = findIndexOfElement(elemUUID, model, selectedDiagramIndex);
            if(elemIdx !== undefined)
            {
                elemPathsToExpand.push(["diagrams", String(selectedDiagramIndex), "elements", elemIdx.toString()]);
            }

            //Associated dependencies
            const associatedDepsData = associatedDependenciesMap.get(elemUUID);
            if(associatedDepsData)
            {
                const associatedDepsUUIDs = new Set<string>();
                associatedDepsData.forEach((depData: AssociatedDependencyData) => {
                    associatedDepsUUIDs.add(depData.uuid);
                })
                depsUUIDsToExpand = new Set<string>([...depsUUIDsToExpand, ...associatedDepsUUIDs]);
            }
        })

        //Construct JSON paths for dependencies associated with the selected elements
        depsUUIDsToExpand.forEach((depUUID: string) => {
            const depIdx = findIndexOfDependency(depUUID, model);
            if(depIdx !== undefined)
            {
                depsPathsToExpand.push(["diagrams", "0", "dependencies", depIdx.toString()]);
            }
        })
        return [
            ...depsPathsToExpand,
            ...elemPathsToExpand,
        ];
    }
    else //No selected elements, expand the default paths (for the diagram view)
    {
        let defaultPaths: Array<Array<string>> = []
        if(model.diagrams && model.diagrams[selectedDiagramIndex])
        {
            defaultPaths.push(["diagrams", String(selectedDiagramIndex)]);
        }
        if(model.meta)
        {
            defaultPaths.push(["meta"])
        }
        return(defaultPaths);
    }
}

/**
 * Returns a list of JSON paths related to the selected Input/Output values.
 * These paths are intended to be expanded in the JSON editor. The last path in the list will be the scroll anchor.
 * Pass an empty selection buffer to revert JSON editor to default expanded state for the runnable model editor view.
 * 
 * "Related" expanded paths will include paths to definitions for:
 * - The I/O values themselves
 * - Evaluatable Elements within the selected Runnable Models that reference the selected I/O values as Inputs or Outputs
 * - Controls that reference the selected I/O values
 * @param selectionBuffer List of UUIDs for selected Input/Output values
 * @param model CDM JSON
 * @param selectedRunnableModelIndices List of active runnable models, relevant for expanding eval elements that use the selected I/O values
 * @returns List of JSON paths to expand related to the selected I/O values
 */
export function getExpandedPathsForSelectedIOValues(
    selectionBuffer: Array<string>,
    model: any,
    selectedRunnableModelIndices: number[],
): Array<Array<string>> {
    if(selectionBuffer.length > 0 && model.inputOutputValues)
    {
        let ioPathsToExpand = new Array<Array<string>>();
        let controlsPathsToExpand = new Array<Array<string>>();
        let evalElemsPathsToExpand = new Array<Array<string>>();
        
        selectionBuffer.forEach((ioUUID: string) => {
            const idx = [...model.inputOutputValues].findIndex((ioJSON: any) => ioJSON.meta?.uuid === ioUUID);
            if(idx !== -1)
            {
                ioPathsToExpand.push(["inputOutputValues", String(idx)])
            }
        })

        //Find controls with selected IOs
        if(model.controls)
        {
            let controlIdx = 0;
            model.controls.forEach((controlJSON: any) => {
                if(controlJSON.inputOutputValues)
                {
                    if(controlJSON.inputOutputValues.some((ioUUID: string) => selectionBuffer.includes(ioUUID)))
                    {
                        controlsPathsToExpand.push(["controls", String(controlIdx)])
                    }
                }
                controlIdx++;
            })
        }

        //Find eval elements with selected IOs
        selectedRunnableModelIndices.forEach((runnableIdx: number) => {
            if(model.runnableModels && model.runnableModels[runnableIdx])
            {
                const thisRunnableModel = model.runnableModels[runnableIdx];

                let elemIdx = 0;
                thisRunnableModel.elements.forEach((elemJSON: any) => {
                    let addThisElementToPaths = false;
                    if(elemJSON.inputs)
                    {
                        if(elemJSON.inputs.some((inputUUID: string) => selectionBuffer.includes(inputUUID)))
                        {
                            addThisElementToPaths = true;
                        }
                    }
                    if(!addThisElementToPaths && elemJSON.outputs)
                    {
                        if(elemJSON.outputs.some((outputUUID: string) => selectionBuffer.includes(outputUUID)))
                        {
                            addThisElementToPaths = true;
                        }
                    }

                    if(addThisElementToPaths)
                    {
                        evalElemsPathsToExpand.push(["runnableModels", String(runnableIdx), "elements", String(elemIdx)])
                    }
                    elemIdx++;
                })
            }
        })

        return [
            ...controlsPathsToExpand,
            ...evalElemsPathsToExpand,
            ...ioPathsToExpand,
        ]
    }

    //No selected I/Os, expand default paths (for the runnable view)
    let defaultPaths: Array<Array<string>> = [];
    if(model.runnableModels)
    {
        selectedRunnableModelIndices.forEach((runnableIdx: number) => {
            if(model.runnableModels[runnableIdx])
            {
                defaultPaths.push(["runnableModels", String(runnableIdx)])
            }
        })
    }
    if(model.meta)
    {
        defaultPaths.push(["meta"])
    }
    return defaultPaths;
}

/**
 * Generate the JSON path for expanding the requested Control in the JSON editor.
 * Path is formatted as a list of strings, as VanillaJSONEditor expects.
 * 
 * The returned path is intended to be added to the master list of paths to expand.
 * 
 * @param controlUUID UUID of the control to generate a JSON path for
 * @param model CDM JSON
 * @returns JSON path for expanding this Control in the JSON editor view
 */
export function getExpandedPathForControl(controlUUID: string, model: any): string[]
{
    if(model.controls)
    {
        const controlIndex = [...model.controls].findIndex((controlJSON: any) => controlJSON.meta?.uuid === controlUUID)
        if(controlIndex !== -1)
        {
            return ["controls", String(controlIndex)]
        }
    }
    return [];
}

/**
 * Generate the JSON path for expanding the requested Evaluatable Element in the JSON editor.
 * Path is formatted as a list of strings, as VanillaJSONEditor expects.
 * 
 * The returned path is intended to be added to the master list of paths to expand.
 * 
 * @param evalUUID UUID of the Evaluatable Element to generate a JSON path for
 * @param model CDM JSON
 * @returns JSON path for expanding this Evaluatable Element in the JSON editor view
 */
export function getExpandedPathForEvaluatableElement(evalUUID: string, model: any): string[]
{
    console.log("Looking for ", evalUUID);
    if(model.runnableModels)
    {
        for(let runnableModelIdx = 0; runnableModelIdx < model.runnableModels.length; runnableModelIdx++)
        {
            const runnableModel = model.runnableModels[runnableModelIdx];
            if(runnableModel.elements)
            {
                console.log("Checking elems ", runnableModel.elements);
                const elemIdx = [...runnableModel.elements].findIndex((elemJSON: any) => elemJSON.meta?.uuid === evalUUID)
                if(elemIdx !== -1)
                {
                    return ["runnableModels", String(runnableModelIdx), "elements", String(elemIdx)];
                }
            }
        }
    }
    return []
}

/**
 * Generate the JSON path for expanding the requested Runnable Model in the JSON editor.
 * Path is formatted as a list of strings, as VanillaJSONEditor expects.
 * 
 * The returned path is intended to be added to the master list of paths to expand.
 * 
 * @param runnableModelUUID UUID of the Runnable Model to generate a JSON path for
 * @param model CDM JSON
 * @returns JSON path for expanding this Runnable Model in the JSON editor view
 */
export function getExpandedPathForRunnableModel(runnableModelUUID: string, model: any): string[]
{
    if(model.runnableModels)
    {
        const modelIdx = [...model.runnableModels].findIndex((runnableModelJSON: any) => runnableModelJSON.meta?.uuid === runnableModelUUID)
        if(modelIdx !== -1)
        {
            return ["runnableModels", String(modelIdx)];
        }
    }
    return [];
}

/**
 * Generate the JSON path for expanding the requested Evaluatable Asset in the JSON editor.
 * Path is formatted as a list of strings, as VanillaJSONEditor expects.
 * 
 * The returned path is intended to be added to the master list of paths to expand.
 * 
 * @param evalUUID UUID of the Evaluatable Asset to generate a JSON path for
 * @param model CDM JSON
 * @returns JSON path for expanding this Evaluatable Asset in the JSON editor view
 */
export function getExpandedPathForEvaluatableAsset(evalUUID: string, model: any): string[]
{
    if(model.evaluatableAssets)
    {
        const evalIdx = [...model.evaluatableAssets].findIndex((evalJSON: any) => evalJSON.meta?.uuid === evalUUID);
        if(evalIdx !== -1)
        {
            return ["evaluatableAssets", String(evalIdx)];
        }
    }
    return [];
}