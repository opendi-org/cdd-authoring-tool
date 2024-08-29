/**
 * Save the updated rectangle and link information from the current graph
 * to an updated json file. Prompts an immediate download of the JSON file.
 * 
 * @param {JSON} originalJSON The JSON file used to create the graph originally
 * @param {Map<string,joint.shapes.standard.Rectangle>} rects Map of updated runtime rects, by UUID
 * @param {Array<joint.shapes.standard.Link>} links The array of updated links to save
 * @param {Map<string,JSON>} elementsJSONMap Map of element UUID to original JSON for that element
 * @param {Map<string,JSON>} elementsJSONMap Map of dependency UUID to original JSON for that dependency
 * @param {string} fileName File name for output JSON file
 */
export function saveGraphJSON(originalJSON, rects, links, elementsJSONMap, dependenciesJSONMap, fileName = "cdd.json")
{
    console.log("SAVING...");
    
    //Generate updated JSON for rect elements
    const newElements = new Array();
    Object.keys(rects).forEach((uuid) => {
        let newElementJSON = elementsJSONMap[uuid];
        const rect = rects[uuid];
        if(newElementJSON == null)
        {
            console.log(uuid);
            newElementJSON = {
                "meta": {
                    "uuid": uuid,
                    "name": rect.get('name')
                },
                "diaType": "box",
                "content": {
                    "position": {},
                    "boundingBoxSize": {
                        "width": 400,   //Default width
                        "height": 500   //Default height (we don't use these)
                    }
                }
            };
        }
        else
        {
            newElementJSON.meta.name = rect.get('name');
        }
        //These property names are defined in addRectToGraph() in index.js
        const elementPosition = rect.get('position');
        newElementJSON.content.position.x = elementPosition.x;
        newElementJSON.content.position.y = elementPosition.y;
        newElementJSON.causalType = rect.get('elementType');

        newElements.push(newElementJSON);
    });

    //Generate updated JSON for dependencies
    const newDependencies = new Array();
    Object.keys(links).forEach((uuid) => {
        let newDependencyJSON = dependenciesJSONMap[uuid];
        const link = links[uuid];
        if(newDependencyJSON == null)
        {
            newDependencyJSON = {
                "meta": {
                    "uuid": uuid,
                    "name": link.get('name')
                },
                "content": {}
            };
        }
        //Currently no plans to allow named links
        //But if those get added in the future, this should look like the else for elements. See above.

        //These property names are defined in addLinkToGraph() in index.js
        newDependencyJSON.source = link.get('source_uuid');
        newDependencyJSON.target = link.get('target_uuid');

        newDependencies.push(newDependencyJSON);
    });

    const jsonOut = originalJSON; //Preserve any existing metadata
    jsonOut.diagrams[0].elements = newElements; //Overwrite element information
    jsonOut.diagrams[0].dependencies = newDependencies;

    console.log(JSON.stringify(jsonOut));

    console.log("Initiating download...");

    downloadTextFile(JSON.stringify(jsonOut), fileName);
}

/**
 * Prompt the browser to download a file with the given text content.
 * This is used to download updated JSON files, using a simple URI href.
 * This means the JSON data will download all on 1 line. Recommend using an auto-formatter to prettify the file.
 * 
 * @param {string} textContent Text content of the file to download. Here, this is expected to be a JSON string
 * @param {string} fileName Name of file to be downloaded. Here, this is expected to be a JSON file name
 */
export function downloadTextFile(textContent, fileName)
{
    var elem = document.createElement('a');
    elem.setAttribute("href", "data:application/octet-stream;charset=utf-8," + textContent); //HREF with raw URI of the file contents
    elem.setAttribute("download", fileName);
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
}