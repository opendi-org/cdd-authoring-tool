import { AssociatedDependencyData, DependencyRole } from './cddTypes';
import DisplayTypeRegistry from '../components/DisplayTypeRegistry';
import { defaultDiagramElementJSON } from '../components/DiagramElement';
import { defaultDependencyJSON } from './dependencyUtil';

/**
 * Get index of an element or dependency within its JSON array by its UUID.
 * 
 * @param {any} model JSON data for the model to search within
 * @param {string} uuid UUID of element or dependency to find
 * @param {boolean} idIsDependency Whether to look for this UUID in the list of elements or dependencies
 * @param {number} diagramIndex The index of the diagram to search within (in model.diagrams[])
 * @returns {number} The array index of the given element/dependency
 */
const findIdx = (model: any, uuid: string, idIsDependency = false, diagramIndex = 0) => {
    const elemsList = model.diagrams[diagramIndex]?.elements;
    const depsList = model.diagrams[diagramIndex]?.dependencies;
    const listToSearch = idIsDependency ? depsList : elemsList;

    // Find UUID in list, get the index.
    for(let i = 0; i < listToSearch.length; i++)
    {
        if(listToSearch[i].meta.uuid === uuid)
        {
            return i;
        }
    }
    return undefined;
}

/**
 * Get index of a diagram element within its JSON array, by its UUID.
 * 
 * @param uuid UUID of element to find
 * @param model JSON data for the model to search for the element within
 * @param diagramIndex THe index of the diagram to search for the element within (in model.diagrams[])
 * @returns The array index of the given element (or undefined if not found)
 */
export function findIndexOfElement(uuid: string, model: any, diagramIndex = 0)
{
    return findIdx(model, uuid, false, diagramIndex);
}

/**
 * Get index of a diagram dependency within its JSON array, by its UUID.
 * 
 * @param uuid UUID of dependency to find
 * @param model JSON data for the model to search for the dependency within
 * @param diagramIndex THe index of the diagram to search for the dependency within (in model.diagrams[])
 * @returns The array index of the given dependency (or undefined if not found)
 */
export function findIndexOfDependency(uuid: string, model: any, diagramIndex = 0)
{
    return findIdx(model, uuid, true, diagramIndex);
}

/**
 * Calculates initial placement for a new Diagram Element. Element is either placed near
 * a default location (with some randomness to avoid perfectly stacking elements if the user
 * places multiple at once), or is placed in a location relative to the list of selected
 * elements. Relative location is vertically centered among the selected elements, and
 * horizontally off the right side of the selected elements.
 * 
 * @param selectionBuffer Array of UUIDs for selected diagram elements
 * @param diagramElementMap Map from element UUIDs to their JSON data
 * @param isConnectedToSelection Flag for whether the new element should be connected to selected elements
 * @param defaultX If not connected to selection, the element will be placed near this default X position
 * @param defaultY If not connected to selection, the element will be placed near this default X position
 * @param gap If connected to selection, the element will be placed this distance from the rightmost X of the selected elements
 * @returns Position object for the new element, with X and Y values
 */
function calculateNewElementPosition(selectionBuffer: Array<string>, diagramElementMap: Map<string, any>, isConnectedToSelection: boolean, defaultX = 100, defaultY = 250, gap = 400): {x: number, y: number}
{
    /**
     * Slightly randomizes an int. Returns a number near intToFuzz, in a range
     * of width fuzzAmount, centered at intToFuzz.
     * For slightly randomizing the placement of the new element, so that unconnected
     * elements placed one after the other won't hide each other.
     * @param intToFuzz Base number. Resulting number will average around this value.
     * @param fuzzAmount The width of the fuzz range.
     * @returns Fuzzed int in the range (intToFuzz - (fuzzAmount / 2)) to (intToFuzz + (fuzzAmount / 2))
     */
    const fuzzInt = (intToFuzz = 0, fuzzAmount = 25) => {
        const max = intToFuzz + (fuzzAmount / 2);
        const min = intToFuzz - (fuzzAmount / 2)

        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    let newElementX = fuzzInt(defaultX);
    let newElementY = fuzzInt(defaultY);

    if(isConnectedToSelection && selectionBuffer.length > 0)
    {
        //We're creating a connected element.
        //Place it to the right of the selected elements,
        //roughly in the middle vertically
        let rightmostX = defaultX;
        let sumOfYValues = 0;
        selectionBuffer.forEach((selectedUUID) => {
            const selectedJSONData = diagramElementMap.get(selectedUUID);
            rightmostX = Math.max(rightmostX, selectedJSONData.position.x ?? 0);
            sumOfYValues += selectedJSONData.position.y ?? 0;
        });

        newElementX = rightmostX + gap;
        newElementY = sumOfYValues / selectionBuffer.length; //average Y value
    }

    return {x: newElementX, y: newElementY};
}

/**
 * Pure/immutable: Updates the given model JSON to include a new element.
 * Also updates the given selection buffer, with the new element selected.
 * 
 * If elements are selected in the selectionBuffer, this new element will be connected
 * to those selected elements, and placed near them. If not, this element will be placed
 * around a default location (100, 250).
 * Does not mutate model JSON. Instead, returns the updated JSON with the new element added.
 * @param model Model JSON to add the element to
 * @param selectionBuffer Array of UUIDs for selected diagram elements
 * @param diagramElementMap Map from element UUIDs to their JSON data
 * @param connectNewElement Flag for whether the new element should be connected to selected elements
 * @param diagramIndex Index for which diagram we're using in the model JSON
 * @returns [updated model JSON, updated selection buffer], updated as a result of the add action
 */
export function addNewElement(model: any, selectionBuffer: Array<string>, diagramElementMap: Map<string, any>, connectNewElement = false, diagramIndex = 0)
{
    let workingModel = structuredClone(model);
    let newSelectionBuffer = structuredClone(selectionBuffer);
    if(workingModel.diagrams[diagramIndex] !== undefined)
    {
        const newElementJSON = defaultDiagramElementJSON(
            calculateNewElementPosition(selectionBuffer, diagramElementMap, connectNewElement)
        );

        const elemsList = workingModel.diagrams[diagramIndex].elements ?? [];
        elemsList.push(newElementJSON);

        //Add dependencies for selected elements
        if(connectNewElement && selectionBuffer.length > 0)
        {
            const depsList = workingModel.diagrams[diagramIndex].dependencies ?? [];
            selectionBuffer.forEach((selectedUUID: string) => {
                const sourceUUID = selectedUUID;
                const targetUUID = newElementJSON.meta.uuid;
                const sourceName = diagramElementMap.get(selectedUUID).meta.name ?? "Unnamed";
                const targetName = newElementJSON.meta.name;
                depsList.push(defaultDependencyJSON(sourceUUID, targetUUID, sourceName, targetName))
            })
            workingModel.diagrams[diagramIndex].dependencies = depsList;
        }

        workingModel.diagrams[diagramIndex].elements = elemsList;
        newSelectionBuffer = [newElementJSON.meta.uuid];
    }

    return [workingModel, newSelectionBuffer]
}

/**
 * Pure/immutable: Updates the given model JSON to remove the selected elements.
 * All selected elements are removed, along with their associated dependencies.
 * Does not mutate model JSON. Instead, returns the updated JSON with the elements/dependencies deleted.
 * @param model Model JSON to delete the element from
 * @param selectionBuffer Array of UUIDs for selected diagram elements
 * @param elementAssociatedDependenciesMap Maps element UUIDs to a set of information about all dependencies associated with that element
 * @param diagramIndex Index for which diagram we're using in the model JSON
 * @returns Updated model JSON, with the selected elements and all associated dependencies removed
 */
export function deleteElement(model: any, selectionBuffer: Array<string>, elementAssociatedDependenciesMap: Map<string, Set<AssociatedDependencyData>>, diagramIndex = 0)
{
    let workingModel = structuredClone(model);
    if(selectionBuffer.length > 0 && workingModel.diagrams[diagramIndex] !== undefined)
    {
        let dependenciesToDelete: Set<string> = new Set();
        selectionBuffer.forEach((elemUUID: string) => {
            const associatedDepsUUIDs = new Set<string>();
            elementAssociatedDependenciesMap.get(elemUUID)?.forEach((depData: AssociatedDependencyData) => {associatedDepsUUIDs.add(depData.uuid)});
            dependenciesToDelete = new Set([...dependenciesToDelete, ...associatedDepsUUIDs]);
        })

        const numElemsToDelete = selectionBuffer.length;
        const numDepsToDelete = dependenciesToDelete.size;

        if(confirm(`Deleting ${numElemsToDelete} element${numElemsToDelete != 1 ? "s" : ""} and ${numDepsToDelete} associated dependenc${numDepsToDelete != 1 ? "ies" : "y"}. Are you sure?`
        ))
        {
            let elementsToDelete = new Set(selectionBuffer);
            let newElementsListJSON = workingModel.diagrams[diagramIndex].elements.filter((elementJSON: any) => {
                return !elementsToDelete.has(elementJSON.meta.uuid);
            })
            let newDependenciesListJSON = workingModel.diagrams[diagramIndex].dependencies.filter((dependencyJSON: any) => {
                return !dependenciesToDelete.has(dependencyJSON.meta.uuid);
            })

            workingModel.diagrams[diagramIndex].elements = newElementsListJSON;
            workingModel.diagrams[diagramIndex].dependencies = newDependenciesListJSON;
        }
    }
    return workingModel;
}

/**
 * Pure/immutable: Updates the given model JSON to toggle dependencies between the selected elements.
 * 
 * Has two possible behaviors:
 * 1) "Chain" behavior (groupBehavior = false) for connecting dependencies along a chain  
 * For selection buffer [1, 2, 3, 4], dependencies connect/disconnect (1 -> 2), (2 -> 3), (3 -> 4)
 * 
 * 2) "Group" behavior (groupBehavior = true) for connecting a group of elements to a single target  
 * For selection buffer [1, 2, 3, 4], dependencies connect/disconnect (1 -> 4), (2 -> 4), (3 -> 4)
 * 
 * For partially-filled chains or groups, both behaviors will prefer to fill in gaps, and will only
 * remove dependencies when the selection already COMPLETELY satisfies the chain or group.
 * 
 * @param model Model JSON to add/remove dependencies from
 * @param selectionBuffer Array of UUIDs for selected diagram elements
 * @param diagramElementMap Map from element UUIDs to their JSON data
 * @param elementAssociatedDependenciesMap Maps element UUIDs to a set of information about all dependencies associated with that element
 * @param groupBehavior Flag for whether dependencies are toggled in a "chain" or a "group" behavior
 * @param diagramIndex Index for which diagram we're using in the model JSON
 * @returns Updated model JSON, with the toggled dependencies added or removed as relevant
 */
export function toggleDependency(model: any, selectionBuffer: Array<string>, diagramElementMap: Map<string, any>, elementAssociatedDependenciesMap: Map<string, Set<AssociatedDependencyData>>, groupBehavior = false, diagramIndex = 0)
{
    let workingModel = structuredClone(model);
    if(selectionBuffer.length > 1 && workingModel.diagrams[diagramIndex] !== undefined)
    {
        /**
         * Checks to see if a dependency exists between the given source and target diagram elements.
         * If found, returns UUID for the dependency. Otherwise, returns null.
         * @param sourceElementUUID Source element to check
         * @param targetElementUUID Target element to check
         * @returns UUID of found existing dependency. null if no dependency found.
         */
        const getDependency = (sourceElementUUID: string, targetElementUUID: string) => {
            let result = null;
            elementAssociatedDependenciesMap.get(sourceElementUUID)?.forEach((depData: AssociatedDependencyData) => {
                if(depData.role == DependencyRole.source && depData.otherElement == targetElementUUID)
                {
                    result = depData.uuid;
                }
            })
            return result;
        }

        /*
         * Maintain two lists of dependencies. Traversing the selection, assume we will be
         * removing all dependencies UNTIL we reach a missing dependency in the chain/group.
         * If we find missing deps, clear the depsToRemove set and only fill the hole(s)
         */
        let depsToAdd = new Set<any>();
        let depsToRemove = new Set<string>();
        for(let bufferIdx = 0; bufferIdx + 1 < selectionBuffer.length; bufferIdx++)
        {
            const thisSource = selectionBuffer[bufferIdx];
            
            //"Chain" behavior: Target is the next index along the chain
            let thisTarget = selectionBuffer[bufferIdx + 1];
            //"Group" behavior: Target is always the last index in the selection
            if(groupBehavior) thisTarget = selectionBuffer[selectionBuffer.length - 1];

            const existingDepUUID = getDependency(thisSource, thisTarget); //Null if no dependency found btw. source and target
            if(existingDepUUID !== null)
            {
                //Dependency found. If we're not already patching holes, we'll remove this.
                if(depsToAdd.size == 0)
                {
                    depsToRemove.add(existingDepUUID);
                }
            }
            else
            {
                //Dependency missing!
                //Generate new dependency and clear the depsToRemove set, since we won't be using it.
                const sourceName = diagramElementMap.get(thisSource).meta.name ?? "Unnamed";
                const targetName = diagramElementMap.get(thisTarget).meta.name ?? "Unnamed";
                depsToAdd.add(defaultDependencyJSON(thisSource, thisTarget, sourceName, targetName));

                if(depsToRemove.size > 0)
                {
                    depsToRemove.clear();
                }
            }
        }
        
        //Remove any dependencies slated for removal (does nothing if depsToRemove is cleared)
        let newDeps = workingModel.diagrams[diagramIndex].dependencies
        .filter((depData: any) => {
            return !depsToRemove.has(depData.meta.uuid)
        });

        //Add any new dependencies (does nothing if we didn't have any to add)
        depsToAdd.forEach((depToAdd: any) => newDeps.push(depToAdd))

        //Overwrite deps in the working model
        workingModel.diagrams[diagramIndex].dependencies = newDeps;

    }
    return workingModel;
}

/**
 * Pure/immutable: Updates the given model JSON to add a new instance of the requested
 * Display type to the selected Diagram Element.
 * @param model Model JSON to add display to
 * @param selectionBuffer Array of UUIDs for selected diagram elements
 * @param displayType String determining type of Display to add. @see {DisplayTypeRegistry}
 * @param diagramIndex Index for which diagram we're using in the model JSON
 * @returns Updated model JSON, with the Display added to the selected diagram element
 */
export function addDisplayToElement(model: any, selectionBuffer: Array<string>, displayType: string, diagramIndex = 0)
{
    let workingModel = structuredClone(model);
    if(selectionBuffer.length == 1 && workingModel.diagrams[diagramIndex] !== undefined)
    {
        const newDisplayJSON = DisplayTypeRegistry[displayType].defaultJSON();

        if(!newDisplayJSON) return workingModel;

        const elemToModify = workingModel.diagrams[diagramIndex].elements.find(
            (elemJSON: any) => elemJSON.meta.uuid === selectionBuffer[0]
        );

        if(elemToModify !== undefined)
        {
            if(!elemToModify.displays) elemToModify.displays = [];

            elemToModify.displays.push(newDisplayJSON);
        }
    }
    return workingModel;
}