import { AssociatedDependencyData } from "./cddTypes";
import { findIndexOfDependency, findIndexOfElement } from "./diagramCRUD";

/**
 * Returns a list of JSON paths related to the selected diagram elements.
 * These paths will be expanded in the JSON editor. The last path in the list will be the scroll anchor.
 * Pass an empty selection buffer to revert JSON editor to default expanded state.
 * @param selectionBuffer List of UUIDs for selected diagram elements
 * @param model CDM JSON
 * @param associatedDependenciesMap Map from diagram element UUIDs to list of dependencies associated with that element
 * @returns List of JSON paths to expand related to the selected diagram elements
 */
export function getExpandedPathsForSelectedElements(
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
    else //No selected elements, expand the default paths
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