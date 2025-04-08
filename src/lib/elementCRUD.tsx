import { v4 as uuidv4 } from 'uuid';

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
 * Pure/immutable: Updates the given model JSON to include a new element.
 * If elements are selected in the selectionBuffer, this new element will be connected
 * to those selected elements, and placed near them. If not, this element will be placed
 * around a default location (100, 250).
 * Does not mutate model JSON. Instead, returns the updated JSON with the new element added.
 * @param model Model JSON to add the element to
 * @param selectionBuffer Array of UUIDs for selected diagram elements
 * @param setSelectionBuffer The React useState set function for selectionBuffer
 * @param diagramElementMap Map from element UUIDs to their JSON data
 * @param diagramIndex Index for which diagram we're using in the model JSON
 * @returns Updated model JSON, with the new element added
 */
export function addNewElement(model: any, selectionBuffer: Array<string>, setSelectionBuffer: Function, diagramElementMap: Map<string, any>, diagramIndex = 0)
{
    let workingModel = structuredClone(model);
    if(workingModel.diagrams[diagramIndex])
    {
        const defaultX = 100;
        const defaultY = 250;
        
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

        if(selectionBuffer.length > 0)
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

            const elementGap = defaultX + 300;
            newElementX = fuzzInt(rightmostX + elementGap);
            newElementY = fuzzInt(sumOfYValues / selectionBuffer.length); //~average Y value
        }

        const newElementUUID = uuidv4();
        const newElementJSON = {
            "meta": {
                "uuid": newElementUUID,
                "name": "New Element"
            },
            "causalType": "CUSTOM_(No causal type)",
            "position": {
                "x": newElementX,
                "y": newElementY,
            },
        };

        const elemsList = workingModel.diagrams[diagramIndex].elements ?? [];
        elemsList.push(newElementJSON);

        //Add dependencies for selected elements
        if(selectionBuffer.length > 0)
        {
            const depsList = workingModel.diagrams[diagramIndex].dependencies ?? [];
            selectionBuffer.forEach((selectedUUID: string) => {
                const newDependencyUUID = uuidv4();
                const newDependencyJSON = {
                    "meta": {
                        "uuid": newDependencyUUID,
                        "name": `${diagramElementMap.get(selectedUUID).meta.name ?? "Unnamed"} --> New Element`
                    },
                    "source": selectedUUID,
                    "target": newElementUUID,
                }
                depsList.push(newDependencyJSON);
            })
            workingModel.diagrams[diagramIndex].dependencies = depsList;
        }

        workingModel.diagrams[diagramIndex].elements = elemsList;
        setSelectionBuffer([newElementUUID]);
    }

    return workingModel;
}

/**
 * Pure/immutable: Updates the given model JSON to remove the selected elements.
 * All selected elements are removed, along with their associated dependencies.
 * Does not mutate model JSON. Instead, returns the updated JSON with the elements/dependencies deleted.
 * @param model Model JSON to delete the element from
 * @param selectionBuffer Array of UUIDs for selected diagram elements
 * @param setSelectionBuffer The React useState set function for selectionBuffer
 * @param elementAssociatedDependenciesMap Maps element UUIDs to the set of UUIDs for dependencies associated with them
 * @param diagramIndex Index for which diagram we're using in the model JSON
 * @returns Updated model JSON, with the selected elements and all associated dependencies removed
 */
export function deleteElement(model: any, selectionBuffer: Array<string>, setSelectionBuffer: Function, elementAssociatedDependenciesMap: Map<string, Set<string>>, diagramIndex = 0)
{
    let workingModel = structuredClone(model);
    if(selectionBuffer.length > 0 && workingModel.diagrams[diagramIndex])
    {
        let dependenciesToDelete: Set<string> = new Set();
        selectionBuffer.forEach((elemUUID: string) => {
            dependenciesToDelete = new Set([...dependenciesToDelete, ...(elementAssociatedDependenciesMap.get(elemUUID) ?? [])]);
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

            setSelectionBuffer([]);
        }
    }
    return workingModel;
}