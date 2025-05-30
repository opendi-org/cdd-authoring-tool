/**
 * Create commonly-used data structures by preprocessing model JSON.
 * These will generally be memoized by various components.
 */

import { AssociatedDependencyData, DependencyRole } from "./cddTypes";

/**
 * Gets a diagram element map out of the full JSON for a causal decision model.
 * @param model Schema-compliant JSON for a causal decision model
 * @param selectedDiagramIndex The diagram to generate an element map for
 * @returns A map of diagram elements, mapping element UUID to element JSON data (as any)
 */
export function getDiagramElementMap(model: any, selectedDiagramIndex: number): Map<string, any> {
    const diaElems = new Map<string, any>();
    if(model.diagrams && model.diagrams[selectedDiagramIndex] && model.diagrams[selectedDiagramIndex].elements)
    {
        model.diagrams[selectedDiagramIndex].elements.forEach((elem: any) => {
            diaElems.set(elem.meta.uuid, elem);
        })
    }
    return diaElems;
}

/**
 * Gets a map from element UUID to a set of information about all dependencies associated with that
 * element. "Associated" means that the dia elem is either a "source" or "target" for the dependency.
 * AssociatedDependencyData contains dep UUID, the key element's role in the dep, and UUID of the
 * other element involved in the dependency, whether source or target.
 * @param model Schema-compliant JSON for a causal decision model
 * @param selectedDiagramIndex The diagram to generate an associated dependencies map for
 * @returns A map from diagram element UUID to info about all dependencies associated with that element
 */
export function getDiaElemAssociatedDepsMap(model: any, selectedDiagramIndex: number): Map<string, Set<AssociatedDependencyData>> {
    const elemAssociatedDeps = new Map<string, Set<AssociatedDependencyData>>();
    const addEntry = (elemUUID: string, depUUID: string, role: DependencyRole, otherElemUUID: string) => {
        let currentDeps = elemAssociatedDeps.get(elemUUID) ?? new Set<AssociatedDependencyData>();
        currentDeps.add({uuid: depUUID, role: role, otherElement: otherElemUUID});
        elemAssociatedDeps.set(elemUUID, currentDeps);
    }
    if(model.diagrams)
    {
        model.diagrams[selectedDiagramIndex]?.dependencies?.forEach((dep: any) => {
            addEntry(dep.source, dep.meta.uuid, DependencyRole.source, dep.target);
            addEntry(dep.target, dep.meta.uuid, DependencyRole.target, dep.source);
        })
    }

    return elemAssociatedDeps;
}

/**
 * Gets a map for IO Value data out of the full JSON for a causal decision model.
 * Unlike @see getIOMap this map contains only the current "data" field value (e.g. true, 3.5, "apple", etc.)
 * for an IO value.
 * @param model Schema-compliant JSON for a causal decision model
 * @returns A map of IO Values, mapping UUID to the data (the actual value) stored in that IO Value
 */
export function getIODataMap(model: any): Map<string, any> {
    const ioValues = new Map<string, any>();
    model.inputOutputValues?.forEach((ioVal: any) => {
        ioValues.set(ioVal.meta.uuid, ioVal.data);
    });
    return ioValues;
}

/**
 * Gets an IO Value map out of the full JSON for a causal decision model.
 * Unlike @see getIODataMap this map contains ALL the JSON data for an IO value,
 * rather than just the current "data" field value (e.g. true, 3.5, "apple", etc.)
 * @param model Schema-compliant JSON for a causal decision model
 * @returns A map of IO Values, mapping UUID to the JSON representation of the IO Value
 */
export function getIOMap(model: any): Map<string, any> {
    const ioMap = new Map<string, any>();
    model.inputOutputValues?.forEach((ioVal: any) => {
        ioMap.set(ioVal.meta.uuid, ioVal);
    });
    return ioMap;
}

/**
 * Gets the set of all active IO values, as UUIDs
 * @param model Schema-compliant JSON for a causal decision model
 * @param selectedRunnableModelIndices The list of selected runnable models, determines which IO values are active
 * @returns The set of active IO values, as UUIDs
 */
export function getActiveIOValues(model: any, selectedRunnableModelIndices: number[]): Set<string> {
    const activeIOs = new Set<string>();
    selectedRunnableModelIndices.forEach((idx: number) => {
        if(model.runnableModels[idx].elements) model.runnableModels[idx].elements.forEach((elem: any) => {
            if(elem.inputs) elem.inputs.forEach((input: string) => {
                activeIOs.add(input);
            });
            if(elem.outputs) elem.outputs.forEach((output: string) => {
                activeIOs.add(output);
            });
        })
    });
    return activeIOs;
}

/**
 * Gets a function map out of the full JSON for a causal decision model.
 * @param model Schema-compliant JSON for a causal decision model
 * @returns A map from function name to the actual evaluated code of the function -- "<Eval Asset UUID>_<Function Name>": function
 */
export function getFunctionMap(model: any): Map<string, any> {
    const funcMap = new Map();
    model.evaluatableAssets?.forEach((evalAsset: any) => {
        if(evalAsset.evalType == "Script" && evalAsset.content.language == "javascript")
        {
            const scriptString = atob(evalAsset.content.script);
            //scriptCode returns a function map with function names as keys and function code as values
            const scriptCode = eval(scriptString);
    
            const thisScriptFunctionMap = scriptCode.funcMap;
            Object.keys(thisScriptFunctionMap).forEach((funcName) => { 
                funcMap.set(`${evalAsset.meta.uuid}_${funcName}`, thisScriptFunctionMap[funcName]) //"<Eval Asset UUID>_<Function Name>": function
            })
        }
    });
    return funcMap;
}

/**
 * Gets a control map out of the full JSON for a causal decision model.
 * Maps UUID of a diagram element's Display to the associated I/O values for that Display.
 * I/O values are associated with Displays via model Controls. The controls map represents that relationship. 
 * @param model Schema-compliant JSON for a causal decision model
 * @returns A map from a diagram element Display's UUID to the list of associated I/O values (UUIDs)
 */
export function getControlsMap(model: any): Map<string, Array<string>> {
    const controls = new Map<string, Array<string>>();
    model.controls?.forEach((control: any) => {
        control.displays.forEach((displayUUID: any) => {
            if(!controls.has(displayUUID)) {
                controls.set(displayUUID, control.inputOutputValues);
            }
            else
            {
                console.error(
                    `Error: Multiple Control elements found for Diagram Element Display ${displayUUID}.`,
                    `Engine will only use the first control processed for this element. Ignoring control: `,
                    control,
                    ` - This element has these associated I/O values: `,
                    controls.get(displayUUID)
                )
            }
        });
    });
    return controls;
}