import { v4 as uuidv4 } from 'uuid';

export function addNewElement(model: any, selectionBuffer: Array<string>, setSelectionBuffer: Function, diagramElementMap: Map<string, any>, diagramIndex = 0)
{
    let workingModel = structuredClone(model);
    if(workingModel.diagrams[diagramIndex])
    {
        const defaultX = 100;
        const defaultY = 250;
        
        const fuzzInt = (intToFuzz = 0, fuzzAmount = 25) => {
            const max = intToFuzz + (fuzzAmount / 2);
            const min = intToFuzz - (fuzzAmount / 2)

            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        const newElementX = fuzzInt(defaultX);
        const newElementY = fuzzInt(defaultY);

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
                        "name": `New Element --> ${diagramElementMap.get(selectedUUID).name ?? "Unnamed"}`
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