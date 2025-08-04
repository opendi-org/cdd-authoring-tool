/**
 * Defines default JSON for creating new instances of various structures
 * used throughout a decision model.
 * 
 * NOTE: Some structures have their default JSON defined elsewhere:
 * - Diagram Displays are attached to their display type def in src/components/Diagram/Displays/displayTypes/*
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate schema-compliant JSON for a new dependency
 * @param sourceUUID UUID for this dependency's source Diagram Element
 * @param targetUUID UUID for this dependency's target Diagram Element
 * @param sourceName The name of this dependency's source Diagram Element
 * @param targetName The name of this dependency's target Diagram Element
 * @returns JSON for a new dependency, formatted for schema compliance
 */
export function defaultDependencyJSON(
    sourceUUID: string,
    targetUUID: string,
    sourceName: string = "Unnamed",
    targetName: string = "Unnamed"
): any {
    return {
        meta: {
            uuid: uuidv4(),
            name: `${sourceName} --> ${targetName}`,
        },
        source: sourceUUID,
        target: targetUUID,
    };
}

/**
 * Generate schema-compliant JSON for a new diagram element
 * @param position Position of the new element
 * @returns JSON for a new diagram element, formatted for schema compliance
 */
export function defaultDiagramElementJSON(
    position={ x: 100, y: 250 }
): any {
    return {
        meta: {
            uuid: uuidv4(),
            name: "New Diagram Element"
        },
        causalType: "CUSTOM_(No causal type)",
        position,
    };
}

/**
 * Generate schema-compliant JSON for a new evaluatable element
 * @param evaluatableAsset UUID of the evaluatable asset containing the function used by this element
 * @param functionName Name of the function that this element will pass inputs into and receive outputs from
 * @param inputs Input/Output values to be passed into functionName as inputs
 * @param outputs Input/Output values to overwrite using outputs from functionName
 * @returns JSON for a new evaluatable element, formatted for schema compliance
 */
export function defaultEvaluatableElementJSON(
    evaluatableAsset=uuidv4(),
    functionName="(None)",
    inputs:string[]=[],
    outputs:string[]=[]
): any {
    return {
        meta: {
            uuid: uuidv4(),
            name: "New Evaluatable Element"
        },
        evaluatableAsset,
        functionName,
        inputs,
        outputs
    }
}

/**
 * Generate schema-compliant JSON for a new control
 * @param inputOutputValues List of input/output values that will be used by the displays
 * @param displays List of displays that will use the input/output values
 * @returns JSON for a new control, formatted for schema compliance
 */
export function defaultControlJSON(
    inputOutputValues:string[]=[],
    displays:string[]=[]
): any {
    return {
        meta: {
            uuid: uuidv4(),
            name: "New Control"
        },
        inputOutputValues,
        displays
    }
}

/**
 * Generate schema-compliant JSON for a new evaluatable asset of type Script
 * @returns JSON for a new evaluatable asset, prepopulated as a script with the default JavaScript content
 */
export function defaultScriptJSON(): any
{
    //I'd rather import this from model_json/script_template.js
    //But it seems like a non-trivial task.
    //Consider it something to look into later.
    const baseScript = "KGZ1bmN0aW9uICgpIHsKCiAgICAvL0lNUExFTUVOVCBZT1VSIEZVTkNUSU9OIEFTIEEgQ09OU1QgSEVSRToKICAgIGNvbnN0IG15U2NyaXB0RnVuY3Rpb24gPSBmdW5jdGlvbiAoaW5wdXRzKSB7CiAgICAgICAgcmV0dXJuIFtudWxsXTsKICAgIH0KCiAgICAvL01BUCBZT1VSIEZVTkNUSU9OIFRPIEEgU1RSSU5HIE5BTUUgSEVSRToKICAgIHJldHVybiB7IGZ1bmNNYXA6IHsibXlTY3JpcHRGdW5jdGlvbiI6IG15U2NyaXB0RnVuY3Rpb259IH07Cgp9KSgpOwoKCi8vIFRvIGltcG9ydCBhIHNjcmlwdCwgaXQgbXVzdCB1c2UgYSBzaW1pbGFyIHN0cnVjdHVyZSB0byB0aGUgZXhhbXBsZSBjb2RlIGFib3ZlLiBJdCBzaG91bGQgdGFrZSB0aGUgZm9ybSBvZgovLyBhbiBpbW1lZGlhdGVseSBpbnZva2VkIGZ1bmN0aW9uIGV4cHJlc3Npb246IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvR2xvc3NhcnkvSUlGRSB3aGVyZSB0aGUKLy8gZnVuY3Rpb24gcmV0dXJucyBhIGZ1bmN0aW9uIG1hcCBjYWxsZWQgZnVuY01hcC4KLy8gCi8vIGZ1bmNNYXAgc2hvdWxkIGhhdmUgc3RyaW5nIGtleXMgYW5kIGZ1bmN0aW9uIHZhbHVlcy4gU3RyaW5nIGtleXMgd2lsbCBiZSB1c2VkIGJ5IEV2YWx1YXRhYmxlIEVsZW1lbnRzCi8vIHRvIHBhc3MgaW5wdXRzIHRvIGFuZCByZWNlaXZlIG91dHB1dHMgZnJvbSB0aGUgZnVuY3Rpb25zLgovLyAKLy8gRWFjaCBzY3JpcHQgbWF5IGRlZmluZSBhcmJpdHJhcmlseSBtYW55IGZ1bmN0aW9ucywgc28gbG9uZyBhcyB0aGV5J3JlIGFsbCBleHBvc2VkIHZpYSBmdW5jTWFwLgovLyAKLy8gRnVuY3Rpb24gaW5wdXRzIHdpbGwgdGFrZSB0aGUgZm9ybSBvZiBhIHNpbmdsZSBhcnJheSBvZiA8YW55PiB2YWx1ZXMuCi8vIEZ1bmN0aW9ucyBzaG91bGQgbGlrZXdpc2UgcmV0dXJuIGFuIGFycmF5IG9mIDxhbnk+IHZhbHVlcy4KLy8gTWVhbmluZyBmb3IgYXJndW1lbnRzIGFuZCByZXR1cm4gdmFsdWVzIGlzIGRldGVybWluZWQgYnkgdGhlaXIgb3JkZXIgaW4gdGhlIGFycmF5Lg==";
    return {
        meta: {
            uuid: uuidv4(),
            name: "New Script"
        },
        evalType: "Script",
        content: {
            language: "javascript",
            script: baseScript
        }
    }
}

/**
 * Generate schema-compliant JSON for a new evaluatable asset of type APICall
 * @returns JSON for a new evaluatable asset, prepopulated with a basic API call
 */
export function defaultAPICallJSON(): any
{
    return {
        meta: {
            uuid: uuidv4(),
            name: "New API Call"
        },
        evalType: "APICall",
        content: {
            endpointURI: "https://jsonplaceholder.typicode.com/posts",
            restMethod: "GET",
            defaultPayload: {},
            defaultURIExtension: ""
        }
    }
}

/**
 * Generate schema-compliant JSON for a new Input/Output value
 * @returns JSON for a new Input/Output value, formatted for schema compliance
 */
export function defaultInputOutputValueJSON(): any
{
    return {
        meta: {
            uuid: uuidv4(),
            name: "New I/O Value"
        },
        data: null
    }
}

/**
 * Generate schema-compliant JSON for an undefined Input/Output value that
 * was not found in a model's list. This JSON has a descriptive name that
 * explains why it exists.
 * 
 * @param uuid UUID to use for the undefined I/O value
 * @returns Schema-compliant I/O JSON with a descriptive name
 */
export function undefinedIOJSON (uuid: string): any
{
    return {
        meta: {
            uuid,
            name: "UNDEFINED: This I/O value not found in model's I/O list"
        },
        data: null
    }
}
