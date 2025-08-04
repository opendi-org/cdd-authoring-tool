/**
 * Holds info about the results of a specific element's evaluation.
 * @member succeeded Flag for whether the element is considered "successfully evaluated" or not
 * @member newWorkingIOMap Updated version of the model's map of computed I/O values, after evaluating the element
 * @member populatedIOValues List of I/O value UUIDs that were populated by this element's evaluation output. This will now be considered "known" I/O values
 */
type EvaluationResults = {
    succeeded: boolean,
    newWorkingIOMap: Map<string, any>,
    populatedIOValues: Set<string>
}

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
 * @param activeRunnableModels List of indices for the runnable models to evaluate, in the model's runnableModels list
 * @param debugLogs Flag for whether to log lots of debug stuff to console
 * @returns A fresh copy of ioMap, with I/O values updated based on the results of one step of the decision simulation
 */
export async function evaluateModel(model: any, funcMap: Map<string, Function>, evalAssetMap: Map<string, any>, ioMap: Map<string, any>, activeRunnableModels = [0], debugLogs = true): Promise<Map<string, any>> {
    if(debugLogs) console.log("Eval start.");

    //Handle case where there's nothing to evaluate (Return a copy of IO Map unedited)
    if(!model.runnableModels) return new Map(ioMap);


    // --Model pre-processing--
    // All active runnable models will put their elements into the same pool,
    // to be processed in whatever arbitrary order they appear in here.
    let evals = new Map(); //Key: "Evaluatable Element UUID" -- Value: Evaluatable Element
    let unevaluated = new Array<string>(); //Lists UUIDs for Eval Elements that haven't been evaluated yet
    let outputValues = new Set<string>(); //Lists UUIDs for IO Vals that are referenced in Eval Elements as Outputs
    
    //Populate the above empties
    activeRunnableModels.forEach((runnableIdx: number) => {
        //Add this model's elements to the global pool / lists
        model.runnableModels[runnableIdx]?.elements.forEach((elem: any) => {
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
    })

    //The set of I/O Values that have known values for this evaluation run.
    //To start, assume that every I/O value that is never referenced as an Output has a known value.
    //These will be our initial inputs.
    let knownIOValues = new Set<string>(Array.from(ioMap.keys()).filter((IOValUUID: string) => !outputValues.has(IOValUUID)))

    //Avoid immutable changes to the original I/O map to preserve initial simulation state.
    let workingIOMap = new Map(ioMap);

    //Evaluation will continue until we either run out of unevaluated elements
    //OR we fail to remove any elements from the unevaluated list in an iteration
    let evalInProgress = unevaluated.length > 0;
    let prevUnevalLength = -1;


    // Main Eval loop

    while(evalInProgress)
    {
        if(debugLogs) console.log("Step started. To eval: ", unevaluated);

        //Try to evaluate unevaluated elements. If successful, remove them from unevaluated list.
        let toRemoveFromUnevaluated = new Set<string>();
        for (const uuid of unevaluated) {
            const evalElem = evals.get(uuid);
            const evalInputs = evalElem.inputs.map((uuid: string) => workingIOMap.get(uuid));
            const evalAsset = evalAssetMap.get(evalElem.evaluatableAsset ?? "");

            //This element can be evaluated if we have a known value for all of its requested inputs
            const isReadyToEval = evalElem.inputs.every((inputUUID: string) => knownIOValues.has(inputUUID));
            if(isReadyToEval)
            {
                if(debugLogs) console.log("Evaluating ", uuid, " - Populated IO Values: ", knownIOValues);

                //EVALUATE THE ELEMENT
                let evalResults: EvaluationResults;
                switch(evalAsset.evalType) {
                    case "Script":
                        evalResults = evaluateScriptElement(evalElem, evalInputs, funcMap, workingIOMap);
                        break;
                    case "APICall":
                        evalResults = await evaluateAPICallElement(evalElem, evalInputs, evalAsset, workingIOMap);
                        break;
                    default:
                        evalResults = {succeeded: false, newWorkingIOMap: workingIOMap, populatedIOValues: new Set()};
                }
                
                //UPDATE STATE BASED ON RESULTS
                workingIOMap = evalResults.newWorkingIOMap;
                knownIOValues = new Set([...knownIOValues, ...evalResults.populatedIOValues]);
                if (evalResults.succeeded)
                {
                    toRemoveFromUnevaluated.add(uuid);
                }
            }
        }

        unevaluated = unevaluated.filter((unevalUUID: string) => !toRemoveFromUnevaluated.has(unevalUUID)); //Remove the elements that we evaluated this iteration

        if(debugLogs) console.log("Step complete. Evaluated: ", toRemoveFromUnevaluated);

        //Determine whether we need another eval iteration
        evalInProgress = unevaluated.length > 0;
        if(unevaluated.length == prevUnevalLength) {
            console.error("List of unevaluated elements has not changed between evaluation iterations. Terminating evaluation.");
            evalInProgress = false;
    }
    prevUnevalLength = unevaluated.length;
    }
    if(debugLogs) console.log("Eval Complete! IO Values: ", workingIOMap);

    return workingIOMap;
    
}

/**
 * Evaluate an Evaluatable Element that references an Evaluatable Asset with evalType=APICall. Performs the requested API call, at the endpoint created
 * by combining the EvalAsset's base URI with an optional extension given as an I/O value. Uses another optional I/O value for the request payload.
 * Reports success/failure and the list of I/O values populated as outputs by the referenced API call.
 * Also returns the updated working I/O value map for this evaluation run.
 * @param evalElem Schema-compliant JSON for the evaluatable element to evaluate. This element references an Evaluatable Asset with evalType=APICall
 * @param evalInputs Array of raw I/O values intended to configure the API request URI and body.
 * Input [0] (optional) should be a well-formatted JSON request body.
 * Input [1] (optional) should be an extension for the base URI stored in the Evaluatable Asset. e.g. "/posts/0"
 * @param evalAsset Schema-compliant JSON for the evaluatable asset used by this element. Used to set up the fetch call for this API request
 * @param workingIOMap Map from I/O UUID (String) to raw I/O value. Working I/O map keeps updated values populated by the ongoing evaluation round. This function will update it with new output values from the API call
 * @returns @see EvaluationResults . Eval resuts with info about success status, the updated map of working I/O values, and a (0-1 length) list of I/O values that were populated as outputs by this API call
 */
async function evaluateAPICallElement(evalElem: any, evalInputs: any, evalAsset: any, workingIOMap: Map<string, any>): Promise<EvaluationResults>
{
    let succeeded = false;
    const ioMap = new Map(workingIOMap);
    const populatedIOValues = new Set<string>();


    // -- Construct URI and request body --

    // EVAL INPUT ORDER:
    // [0]: Body JSON
    // [1]: URI extension (string)
    const uriExtension: string = evalInputs[1] ?? evalAsset.content?.defaultURIExtension ?? "";
    const uri: string = (evalAsset.content?.endpointURI ?? "") + uriExtension;
    const restMethod: string = evalAsset.content?.restMethod ?? "GET";
    const bodyJSON = JSON.stringify(evalInputs[0] ?? evalAsset.content?.defaultPayload ?? {});

    const request = (restMethod == "GET"
        ? {
            method: restMethod
        }
        : {
            method: restMethod,
            headers: {
                'Content-Type': 'application/json'
            },
            body: bodyJSON
        });


    // -- Actually make the request --

    try {
        const response = await fetch(uri, request);
        if(!response.ok)
        {
            throw new Error(`HTTP error, status: ${response.status}`);
        }

        const json = await response.json();
        if(evalElem.outputs.length > 0)
        {
            ioMap.set(evalElem.outputs[0], json),       //Update working I/O map with new output values
            populatedIOValues.add(evalElem.outputs[0]); //Tell the evaluation function to add these to the list of "known" values
        }

        //Right now there's no validation step to confirm that an element evaluated successfully.
        //It's just assumed successful after we get an OK response with no errors thrown.
        succeeded = true;
    } catch (error)
    {
        let message = `Error evaluating element ${evalElem.uuid ?? "unknown"}:\n`;
        message += `Error performing API call to ${uri} with method ${restMethod}. Payload:\n${bodyJSON}`;
        console.error(message, error);
    }

    return {succeeded, newWorkingIOMap: ioMap, populatedIOValues};
}

/**
 * Evaluate an Evaluatable Element that references an Evaluatable Asset with evalType=Script. Runs the referenced script function, passing in evalInputs
 * and populating output in a copy of the workingIOMap. Reports success/failure and the list of I/O values populated as outputs by the referenced script.
 * Also returns the updated working I/O value map for this evaluation run.
 * @param evalElem Schema-compliant JSON for the evaluatable element to evaluate. This element references an Evaluatable Asset with evalType=Script
 * @param evalInputs Array of raw I/O values intended to be used as inputs for this evaluatable element. These will be passed to the script in the order given in this list
 * @param funcMap Maps function names (String) to the function implementations themselves (Function). To avoid collisions, function names prepend their eval asset UUID and an underscore
 * @param workingIOMap Map from I/O UUID (String) to raw I/O value. Working I/O map keeps updated values populated by the ongoing evaluation round. This function will update it with new output values from the script
 * @returns @see EvaluationResults . Eval results with info about success status, the updated map of working I/O values, and a list of I/O values that were populated as outputs by this script
 */
function evaluateScriptElement(evalElem: any, evalInputs: any, funcMap: Map<string, Function>, workingIOMap: Map<string, any>): EvaluationResults
{
    let succeeded = false;
    const ioMap = new Map(workingIOMap);
    const populatedIOValues = new Set<string>();
    try
    {
        //Get the function from our function map and run it to get our new outputs
        const evalFunction = funcMap.get(`${evalElem.evaluatableAsset}_${evalElem.functionName}`) ?? (() => {return []})
        const evaluatedOutputs = evalFunction(evalInputs)

        //Function outputs are assumed to be given in the same order as they're listed in the eval element
        for(let i = 0; i < evalElem.outputs.length && i < evaluatedOutputs.length; i++) {
            ioMap.set(evalElem.outputs[i], evaluatedOutputs[i]);    //Update working I/O map with new output values
            populatedIOValues.add(evalElem.outputs[i]);             //Tell the evaluation function to add these to the list of "known" values
        }

        //Right now there's no validation step to confirm that an element evaluated successfully.
        //It's just assumed successful after we load and run the function with no errors thrown.
        succeeded = true;

    } catch (error)
    {
        let message = `Error evaluating element ${evalElem.uuid ?? "unknown"}:\n`;
        message += `Error executing function ${evalElem.functionName} from Evaluatable Asset ${evalElem.evaluatableAsset}:\n`;
        console.error(message, error);
    }

    return {succeeded, newWorkingIOMap: ioMap, populatedIOValues}
}