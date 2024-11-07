import Ajv from "ajv";
import { parsePath } from "immutable-json-patch"
import { ValidationSeverity } from "vanilla-jsoneditor";
import { v4 as uuidv4 } from 'uuid';
import { cloneDeep } from "lodash-es";

/**
 * Collection of validation results.
 * @class ValidationResults
 * @type {Object}
 * @property {boolean} canRender Whether validatedData is safe to render.
 * @property {List<string>} errors List of messages for all errors encountered during validation.
 * @property {JSON} validatedData Modified input graph data. If canRender is true, this data can be rendered. If false, this data is likely a copy of the original.
 */
function ValidationResults(canRender, errors, validatedData)
{
    return {
        canRender: canRender,
        errors: errors,
        validatedData: validatedData
    }
}

/**
 * Validates the graph data, beyond what is covered by the OpenDI JSON Schema.
 * 
 * a) Checks that the graph data contains a diagram.  
 * b) Checks that all elements have unique UUIDs. Assigns new UUIDs if necessary.  
 * c) Checks that all dependencies have unique UUIDs Assigns new UUIDs if necessary.  
 * d) Removes dependencies that have dangling references to nonexistent elements.  
 * @param {JSON} graphData Source JSON graph data. Must be validated against OpenDI schema at this point.
 * @returns {ValidationResults} The validation results for this graph.
 */
export function validateGraphData(graphData) {
    let errorList = [];
    let validatedData = cloneDeep(graphData);
    console.log(validatedData);
    
    //Check that a renderable diagram exists. Diagrams are optional.
    if(!validatedData || !validatedData.diagrams || validatedData.diagrams.length === 0)
    {
        errorList.push("No diagrams to render.");
        return new ValidationResults(false, errorList, validatedData);
    }
    //Elements are optional
    if(!validatedData.diagrams[0].elements || validatedData.diagrams[0].elements.length === 0)
    {
        errorList.push("No elements to render.");
        return new ValidationResults(false, errorList, validatedData);
    }

    //Validate graph elements: Check for duplicate UUIDs
    let graphElements = {}  //Map used for verifying uniqueness of UUIDs
    validatedData.diagrams[0].elements.forEach((elementData) => {
        //Check for duplicate uuid
        if(graphElements[elementData.meta.uuid])
        {
            //Replace this element's uuid.
            const newUUID = uuidv4();
            errorList.push("Found duplicate element UUID <" + elementData.meta.uuid + ">. UUID updated to <" + newUUID + ">.");
            elementData.meta.uuid = newUUID;
        }
        graphElements[elementData.meta.uuid] = elementData;
    })

    //Validate dependencies: Check for duplicate UUIDs and dangling references to nonexistent source/target elements/
    let validDeps = []; //This will hold only dependencies with verified unique UUIDs, with no dangling references.
    let graphDependencies = {}; //Map used for verifying uniqueness of UUIDs
    if(validatedData.diagrams[0].dependencies)  //Deps are optional
    {
        validatedData.diagrams[0].dependencies.forEach((dependencyData) => {

            //Check for duplicate uuid
            if(graphDependencies[dependencyData.meta.uuid])
            {
                //Replace this dependency's uuid.
                const newUUID = uuidv4();
                errorList.push("Found duplicate dependency UUID <" + elementData.meta.uuid + ">. UUID updated to <" + newUUID + ">.");
                dependencyData.meta.uuid = newUUID;
            }
            graphDependencies[dependencyData.meta.uuid] = dependencyData;
    
            //Remove dangling references
            const sourceValid = (graphElements[dependencyData.source] !== undefined);
            const targetValid = (graphElements[dependencyData.target] !== undefined);
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

    return new ValidationResults(true, errorList, validatedData);

}

/**
 * Generate an AJV JSON Schema validation function.  
 * Combines all schema definitions, defines string formats,
 * and compiles the validator to create the validation function.
 * 
 * @returns {function(json)} JSON Schema validation function. Pass JSON to validate, and get a map of validation errors.
 */
export function getValidator() {
    //Import schemas
    let causalDecisionModel = require("./schema/Causal-Decision-Model.json");
    let causalType = require("./schema/Causal-Type.json");
    let DIAddons = require("./schema/DI-Addons.json");
    let DIAsset = require("./schema/DI-Asset.json");
    let DIDiagram = require("./schema/DI-Diagram.json");
    let DIEvaluatable = require("./schema/DI-Evaluatable.json");
    let UUIDSchema = require("./schema/UUID.json");

    const ajv = new Ajv();
    // Make ajv understand our string format tags. See https://ajv.js.org/guide/formats.html
    ajv.addFormat("uuid", "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$");
    ajv.addFormat("date-time", true)
    // Add schemas used in $refs first
    ajv.addSchema(causalType);
    ajv.addSchema(DIAddons);
    ajv.addSchema(DIAsset);
    ajv.addSchema(DIDiagram);
    ajv.addSchema(DIEvaluatable);
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
    return function validate(json) {
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
function normalizeAjvError(json, ajvError) {
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
function improveAjvError(ajvError) {
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
        message = 'should NOT have additional property: ' + ajvError.params.additionalProperty
    }

    return message ? { ...ajvError, message } : ajvError
}
