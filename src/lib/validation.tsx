import Ajv from "ajv";
import type { ErrorObject } from "ajv";
import { parsePath } from "immutable-json-patch"
import { ValidationError, ValidationSeverity } from "vanilla-jsoneditor";
import { v4 as uuidv4 } from 'uuid';

//Import schemas
import causalDecisionModel from "../model_json/schemas/Causal-Decision-Model.json";
import causalType from "../model_json/schemas/Causal-Type.json";
import DIAddons from "../model_json/schemas/DI-Addons.json";
import DIAsset from "../model_json/schemas/DI-Asset.json";
import DIControl from "../model_json/schemas/DI-Control.json";
import DIDiagramDisplay from "../model_json/schemas/DI-Diagram-Display.json";
import DIDiagramElement from "../model_json/schemas/DI-Diagram-Element.json";
import DIDiagram from "../model_json/schemas/DI-Diagram.json";
import DIEvaluatableAsset from "../model_json/schemas/DI-Evaluatable-Assets.json";
import DIEvaluatableElement from "../model_json/schemas/DI-Evaluatable-Element.json";
import DIIOValue from "../model_json/schemas/DI-IO-Value.json";
import DIRunnableModel from "../model_json/schemas/DI-Runnable-Model.json";
import UUIDSchema from "../model_json/schemas/UUID.json";


/**
 * Collection of validation results.
 * 
 * @property {boolean} canRender Whether validatedData is safe to render.
 * @property {string[]} errors List of messages for all errors encountered during validation.
 * @property {any} validatedData Modified input graph data. If canRender is true, this data can be rendered. If false, this data is likely a copy of the original.
 */
type CDDValidationResults = {
    canRender: boolean;
    errors: string[];
    validatedData: any;
}

/**
 * Validates the graph data, beyond what is covered by the OpenDI JSON Schema.
 * 
 * a) Checks that the graph data contains a diagram.  
 * b) Checks that all elements have unique UUIDs. Assigns new UUIDs if necessary.  
 * c) Checks that all dependencies have unique UUIDs Assigns new UUIDs if necessary.  
 * d) Removes dependencies that have dangling references to nonexistent elements.  
 * @param {any} graphData Source JSON graph data. Must be validated against OpenDI schema at this point.
 * @returns {CDDValidationResults} The validation results for this graph.
 */
export function validateGraphData(graphData: any): CDDValidationResults {
    let errorList: string[] = [];
    let validatedData = structuredClone(graphData);
    
    //Check that a renderable diagram exists. Diagrams are optional.
    if(!validatedData || !validatedData.diagrams || validatedData.diagrams.length === 0)
    {
        errorList.push("No diagrams to render.");
        return {canRender: false, errors: errorList, validatedData: validatedData};
    }
    //Elements are optional
    if(!validatedData.diagrams[0].elements || validatedData.diagrams[0].elements.length === 0)
    {
        errorList.push("No elements to render.");
        return {canRender: false, errors: errorList, validatedData: validatedData};
    }

    //Validate graph elements: Check for duplicate UUIDs
    let graphElements = new Map<string, any>();  //Map used for verifying uniqueness of UUIDs
    validatedData.diagrams[0].elements.forEach((elementData: any) => {
        //Check for duplicate uuid
        if(graphElements.get(elementData?.meta?.uuid))
        {
            //Replace this element's uuid.
            const newUUID = uuidv4();
            errorList.push("Found duplicate element UUID <" + elementData.meta.uuid + ">. UUID updated to <" + newUUID + ">.");
            elementData.meta.uuid = newUUID;
        }
        graphElements.set(elementData.meta.uuid, elementData);
    })

    //Validate dependencies: Check for duplicate UUIDs and dangling references to nonexistent source/target elements/
    let validDeps: any[] = []; //This will hold only dependencies with verified unique UUIDs, with no dangling references.
    let graphDependencies = new Map<string, any>(); //Map used for verifying uniqueness of UUIDs
    if(validatedData.diagrams[0].dependencies)  //Deps are optional
    {
        validatedData.diagrams[0].dependencies.forEach((dependencyData: any) => {

            //Check for duplicate uuid
            if(graphDependencies.get(dependencyData?.meta?.uuid))
            {
                //Replace this dependency's uuid.
                const newUUID = uuidv4();
                errorList.push("Found duplicate dependency UUID <" + dependencyData.meta.uuid + ">. UUID updated to <" + newUUID + ">.");
                dependencyData.meta.uuid = newUUID;
            }
            graphDependencies.set(dependencyData.meta.uuid, dependencyData);
    
            //Remove dangling references
            const sourceValid = (graphElements.get(dependencyData.source) !== undefined);
            const targetValid = (graphElements.get(dependencyData.target) !== undefined);
            if(!(sourceValid && targetValid))
            {
                errorList.push("Removed dangling dependency. UUID <" + dependencyData.meta.uuid + ">. Name <"
                    + dependencyData.meta.name + ">. Source <" + dependencyData.source + ">. Target <"
                    + dependencyData.target + ">.");
            }
            else
            {
                validDeps.push(dependencyData);
            }
        });
    }
    validatedData.diagrams[0].dependencies = validDeps;

    return {canRender: true, errors: errorList, validatedData: validatedData};

}

type AjvValidationError = {
    path: string[];
    message: string;
    severity: ValidationSeverity;
}

/**
 * Generate a well-formatted string reporting the validation results given as an Array.
 * 
 * @param {AjvValidationError[]} validationResults List of validation results to generate a report string for.
 * @returns {string} A string with a formatted report of the validation issues.
 */
export function generateReportStringFromValidationResults(validationResults: AjvValidationError[])
{
    if(validationResults.length > 0)
    {
        let reportString = "Model not schema compliant. Plese resolve these issues:";
        validationResults.forEach((result) => {
            reportString += "\n\n" + result.severity + " at   ";

            let resultPath = "";
            result.path.forEach((pathComponent) => {
                if(!isNaN(parseInt(pathComponent)))
                {
                    resultPath += "[" + parseInt(pathComponent).toString() + "]";
                }
                else
                {
                    resultPath += "." + pathComponent;
                }
            })

            if(resultPath[0] == ".")
            {
                resultPath = resultPath.substring(1);
            }

            reportString += resultPath + ":   " + result.message;
        })

        return reportString;
    }

    return "";
}

/**
 * Generate an AJV JSON Schema validation function.  
 * Combines all schema definitions, defines string formats,
 * and compiles the validator to create the validation function.
 * 
 * AJV errors take the form of an array of objects with these main properties:
 * "message" - String with the error or warning message.
 * "severity" - String with the severity. Generally warning or error. Not sure what else is possible.
 * "path" - Array of strings representing the nested path to where the error is.
 * 
 * @returns {function(json)} JSON Schema validation function. Pass JSON to validate, and get a map of validation errors.
 */
export function getValidator(): (json: any) => ValidationError[] {
    

    const ajv = new Ajv();
    // Make ajv understand our string format tags. See https://ajv.js.org/guide/formats.html
    ajv.addFormat("uuid", "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$");
    ajv.addFormat("date-time", true);
    // Add schemas used in $refs first
    ajv.addSchema(causalType);
    ajv.addSchema(DIAddons);
    ajv.addSchema(DIAsset);
    ajv.addSchema(DIControl);
    ajv.addSchema(DIDiagramDisplay);
    ajv.addSchema(DIDiagramElement);
    ajv.addSchema(DIDiagram);
    ajv.addSchema(DIEvaluatableAsset);
    ajv.addSchema(DIEvaluatableElement);
    ajv.addSchema(DIIOValue);
    ajv.addSchema(DIRunnableModel);
    ajv.addSchema(UUIDSchema);
    // Compile the main schema, now that all references are filled in
    // This will return our validation function, used in our returned function
    const validateAjv = ajv.compile(causalDecisionModel);

    if (validateAjv.errors)
    {
        throw validateAjv.errors[0];
    }


    /*
     * We need to imitate the returned function from svelte-jsoneditor's createAjvValidator function.
     * See similar validate(json) code, here https://github.com/josdejong/svelte-jsoneditor/blob/d6c0dc57307c424385eee551c80cf70634020ffa/src/lib/plugins/validator/createAjvValidator.ts#L48
     */
    return function validate(json: any) {
        validateAjv(json);
        const ajvErrors = validateAjv.errors || []

        return ajvErrors.map(improveAjvError).map((error) => normalizeAjvError(json, error));
    }
}

///
//      --- TAKEN FROM SVELTE-JSONEDITOR ---
//
// The below functions are copied from svelte-jsoneditor.
// We need these to make getValidator's returned function work in the way that svelte-jsoneditor expects,
// when passed into the editor as a prop.
// 
// Used here under the ISC License, with its copyright notice and permission notice included as required:
//     Copyright (c) 2020-2024 by Jos de Jong.
//     Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted,
//     provided that the above copyright notice and this permission notice appear in all copies.
// See original license online: https://github.com/josdejong/svelte-jsoneditor?tab=License-1-ov-file#readme
///

// Source: https://github.com/josdejong/svelte-jsoneditor/blob/d6c0dc57307c424385eee551c80cf70634020ffa/src/lib/plugins/validator/createAjvValidator.ts#L75
function normalizeAjvError(json: any, ajvError: ErrorObject): ValidationError {
    return {
        path: parsePath(json, ajvError.instancePath),
        message: ajvError.message || 'Unknown error',
        severity: ValidationSeverity.warning
    }
}

// Source: https://github.com/josdejong/svelte-jsoneditor/blob/d6c0dc57307c424385eee551c80cf70634020ffa/src/lib/plugins/validator/createAjvValidator.ts#L87
/**
 * Improve the error message of a JSON schema error,
 * for example list the available values of an enum.
 */
function improveAjvError(ajvError: ErrorObject) {
    let message = undefined

    if (ajvError.keyword === 'enum' && Array.isArray(ajvError.schema)) {
        let enums = ajvError.schema
        if (enums) {
        enums = enums.map((value) => JSON.stringify(value))

        if (enums.length > 5) {
            const more = ['(' + (enums.length - 5) + ' more...)']
            enums = enums.slice(0, 5)
            enums.push(more)
        }
        message = 'should be equal to one of: ' + enums.join(', ')
        }
    }

    if (ajvError.keyword === 'additionalProperties') {
        message = 'should NOT have additional property: ' + (ajvError.params as any).additionalProperty;
    }

    return message ? { ...ajvError, message } : ajvError
}
