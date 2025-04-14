import { DateTime } from "luxon";

/**
 * Generate the current time as a schema-compliant timestamp string.
 * @returns A schema-compliant stringified timestamp for the current DateTime
 */
export function getCurrentTimeAsTimestamp(): string {
    return DateTime.now().toFormat("yyyy-MM-dd'T'HH:mm:ssZZ");
}

/**
 * Generates a semi-unique (uses partiual UUID) display name for a model,
 * using model metadata (name and UUID). Intended for use in dropdown menus
 * or to generate a file name for a model. Just run through getSafeFileName
 * first.
 * @param modelJSON JSON content to generate the display name from
 * @returns Display name for the given model, made from model name + UUID
 */
export function getDisplayNameForModel(modelJSON: any): string {
    const workingModel = {
        meta: {
            uuid: modelJSON.meta?.uuid ?? "---",
            name: modelJSON.meta?.name ?? "Unnamed Model",
        }
    };
    const uuidFragment = workingModel.meta.uuid.slice(0, 5);
    return `${workingModel.meta.name ?? "Unnamed Model"} ${uuidFragment}`;
}

/**
 * Generates an OS-friendly, safe file name, given an initial unsafe filename
 * and a file ending. Replaces any unsafe characters with "_"
 * @param unsafeName Initial unsafe filename, WITHOUT the file ending
 * @param ending File ending to append to the final filename
 * @param unsafeCharacters Regular expression that matches any unsafe characters to be replaced in the filename
 * @returns Safe, complete file name with the given ending. All unsafe characters replaced with "_"
 */
export function getSafeFileName(unsafeName: string, ending = ".json", unsafeCharacters = /[^A-Za-z0-9-_]/g): string {
    let workingFileName = unsafeName;
    //If it already has the file ending, remove that
    if(unsafeName.endsWith(ending))
        workingFileName = unsafeName.slice(0, 0 - ending.length);
    if(unsafeName === "")
        workingFileName = "_";

    let workingEnding = ending;
    if(ending === "")
        workingEnding = ".json";
    if(!ending.startsWith('.'))
        workingEnding = `.${ending}`;

    //Replace all unsafe characters with "_"
    return `${workingFileName.replace(unsafeCharacters, '_')}${workingEnding}`
}

/**
 * Prompt the browser to download a file with the given JSON content.
 * This is used to download updated models, using a simple URI href.
 * This means the JSON data will download all on 1 line. Recommend 
 * using an auto-formatter to prettify the file.
 * 
 * @param {string} modelJSON JSON content of the file to download.
 * @param {string} fileName Name of file to be downloaded. If empty, generates based on model metadata.
 */
export function downloadModel(modelJSON: any, fileName = "")
{
    const modelFileName = getSafeFileName(fileName || getDisplayNameForModel(modelJSON));

    //Make an anchor element with a URI for download containing the
    //raw JSON data, where data is included in the URI as a UTF8 string..
    //Then click the anchor element. "Download" achieved!
    var elem = document.createElement('a');
    elem.setAttribute("href", "data:application/octet-stream;charset=utf-8," + JSON.stringify(modelJSON)); //HREF with raw URI of the file contents
    elem.setAttribute("download", modelFileName);
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
}