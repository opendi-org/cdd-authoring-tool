import { v4 as uuidv4 } from 'uuid';

function addNewElement(model: any, setSelectionBuffer: Function, diagramIndex = 0)
{
    let workingModel = structuredClone(model);
    if(workingModel.diagrams[diagramIndex])
    {
        const defaultX = 100;
        const defaultY = 100;
        
        const fuzzInt = (intToFuzz = 0, fuzzAmount = 10) => {
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
            "causalType": "CUSTOM_No-Causal-Type",
            "position": {
                "x": newElementX,
                "y": newElementY,
            },
        };

        const elemsList = workingModel.diagrams[diagramIndex].elements ?? [];
        elemsList.push(newElementJSON);

        workingModel.diagrams[diagramIndex].elements = elemsList;
        setSelectionBuffer([newElementUUID]);
    }

    return workingModel;
}