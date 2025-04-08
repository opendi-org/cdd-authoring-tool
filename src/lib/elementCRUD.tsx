import { v4 as uuidv4 } from 'uuid';

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