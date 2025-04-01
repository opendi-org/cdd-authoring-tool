/**
 * Evaluates a runnable model within the given model.
 * Performs one step of simulation for the decision. Feeds I/O Values from ioMap into their associated
 * functions in funcMap, and stores outputs in a fresh copy of ioMap, returned at the end of the sim step.
 * 
 * This function is pure and self-contained. None of the inputs are mutated.
 * 
 * @param model Full model JSON. MUST adhere to OpenDI JSON Schema
 * @param funcMap For accessing script functions from model JSON. Maps name of function to the function itself
 * @param ioMap For accessing I/O values from model JSON. Maps I/O Value UUID to the data for that value
 * @param runnableModelNumber The index for the runnable model to evaluate, in the model's runnableModels list
 * @returns A fresh copy of ioMap, with I/O values updated based on the results of one step of the decision simulation
 */
export function evaluateModel(model: any, funcMap: Map<string, Function>, ioMap: Map<string, any>, runnableModelNumber = 0): Map<string, any> {
    console.log("Eval start.");

    //Handle case where there's nothing to evaluate (Return a copy of IO Map unedited)
    if(!model.runnableModels) return new Map(ioMap);


    // Model pre-processing
    
    let evals = new Map(); //Key: "Evaluatable Element UUID" -- Value: Evaluatable Element
    let unevaluated = new Array<string>(); //Lists UUIDs for Eval Elements that haven't been evaluated yet
    let outputValues = new Set<string>(); //Lists UUIDs for IO Vals that are referenced in Eval Elements as Outputs
    

    //Populate the above empties
    model.runnableModels[runnableModelNumber]?.elements.forEach((elem: any) => {
        evals.set(elem.meta.uuid, elem);
        unevaluated.push(elem.meta.uuid); //All elements start as unevaluated
        elem.outputs.forEach((IOValUUID: string) => {
            //Since execution order is not guaranteed, an IO value used as an output for more than one
            //eval element has a non-deterministic value when used as an input elsewhere
            if(outputValues.has(IOValUUID))
            {
                console.error(`Error: Possible non-deterministic behavior from output ${IOValUUID} (Used as output multiple times. Execution order is not guaranteed.)`);
            }
            else
            {
                outputValues.add(IOValUUID)
            }
        });
    });

    //The set of I/O Values that have known values for this evaluation run.
    //To start, assume that every I/O value that is never referenced as an Output has a known value.
    //These will be our initial inputs.
    let knownIOValues = new Set<string>(Array.from(ioMap.keys()).filter((IOValUUID: string) => !outputValues.has(IOValUUID)))

    //Avoid immutable changes to the original I/O map to preserve initial simulation state.
    const workingIOMap = new Map(ioMap);

    //Evaluation will continue until we either run out of unevaluated elements
    //OR we fail to remove any elements from the unevaluated list in an iteration
    let evalInProgress = unevaluated.length > 0;
    let prevUnevalLength = -1;


    // Main Eval loop

    while(evalInProgress)
    {
    console.log("Step started. To eval: ", unevaluated);

    //Try to evaluate unevaluated elements. If successful, remove them from unevaluated list.
    let toRemoveFromUnevaluated = new Set<string>();
    unevaluated.forEach((uuid: string) => {
        const evalElem = evals.get(uuid);
        const evalInputs = evalElem.inputs.map((uuid: string) => workingIOMap.get(uuid));

        //This element can be evaluated if we have a known value for all of its requested inputs
        const isReadyToEval = evalElem.inputs.every((inputUUID: string) => knownIOValues.has(inputUUID));
        if(isReadyToEval)
        {
        console.log("Evaluating ", uuid, " - Populated IO Values: ", knownIOValues);

        //Get the function from our function map and run it to get our new outputs
        const evalFunction = funcMap.get(`${evalElem.evaluatableAsset}_${evalElem.functionName}`) ?? (() => {return []})
        const evaluatedOutputs = evalFunction(evalInputs)
    
        //Function outputs are assumed to be given in the same order as they're listed in the eval element
        for(let i = 0; i < evalElem.outputs.length && i < evaluatedOutputs.length; i++) {
            workingIOMap.set(evalElem.outputs[i], evaluatedOutputs[i]);
            knownIOValues.add(evalElem.outputs[i]);
        }

        //Right now there's no validation step to confirm that an element evaluated successfully.
        //It's just assumed successful after we load and run the function.
        toRemoveFromUnevaluated.add(uuid);
        }
    })

    unevaluated = unevaluated.filter((unevalUUID: string) => !toRemoveFromUnevaluated.has(unevalUUID)); //Remove the elements that we evaluated this iteration

    console.log("Step complete. Evaluated: ", toRemoveFromUnevaluated);

    //Determine whether we need another eval iteration
    evalInProgress = unevaluated.length > 0;
    if(unevaluated.length == prevUnevalLength) {
        console.error("List of unevaluated elements has not changed between evaluation iterations. Terminating evaluation.");
        evalInProgress = false;
    }
    prevUnevalLength = unevaluated.length;
    }
    console.log("Eval Complete! IO Values: ", workingIOMap);

    return workingIOMap;
    
}