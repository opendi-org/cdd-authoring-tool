import { cloneDeep } from "lodash-es";

/**
 * Create updated JSON representation of the CDD in the current graph.
 * JSON should comply with OpenDI schema.
 * This can be downloaded with @see downloadTextFile
 * 
 * @param {JSON} originalJSON The JSON file used to create the graph originally
 * @param {Map<string,joint.shapes.standard.Rectangle>} rects Map of updated runtime rects, by UUID
 * @param {Array<joint.shapes.standard.Link>} links The array of updated links to save
 * 
 * @returns {JSON} Updated JSON representation of the CDD in the current graph.
 */
export function saveGraphJSON(originalJSON, rects, links)
{
    console.log("SAVING...");

    //Generate updated JSON for rect elements
    const newElements = new Array();
    Object.keys(rects).forEach((uuid) => {
        
        const rect = rects[uuid];
        //These property names are defined in addRectToGraph() in index.js
        const elementPosition = rect.get('position');
        const elementType = rect.get('elementType');
        const elementName = rect.get('name');

        let newElementJSON = {};
        if(rect.originalJSON == null)
        {
            console.log(uuid);
            newElementJSON = {
                "meta": {
                    "uuid": uuid,
                    "name": elementName
                },
                "diaType": "box",
                "content": {
                    "position": {
                        "x": elementPosition.x,
                        "y": elementPosition.y
                    },
                    "boundingBoxSize": {
                        "width": 400,   //Default width
                        "height": 500   //Default height (we don't use these)
                    }
                }
            };
        }
        else
        {
            newElementJSON = cloneDeep(rect.originalJSON);
            newElementJSON.meta.name = elementName;
            newElementJSON.content.position.x = elementPosition.x;
            newElementJSON.content.position.y = elementPosition.y;
            newElementJSON.causalType = elementType;
        }

        newElements.push(newElementJSON);
    });

    //Generate updated JSON for dependencies
    const newDependencies = new Array();
    Object.keys(links).forEach((uuid) => {
        const link = links[uuid];
        let newDependencyJSON = {
            "meta": {
                "uuid": uuid,
                "name": link.get('name')
            },
            "source": null,
            "target": null
        };
        //Currently no plans to allow named links
        //But if those get added in the future, this should look like the else for elements. See above.

        //These property names are defined in addLinkToGraph() in index.js
        newDependencyJSON.source = link.get('source_uuid');
        newDependencyJSON.target = link.get('target_uuid');

        newDependencies.push(newDependencyJSON);
    });

    const jsonOut = cloneDeep(originalJSON);
    jsonOut.diagrams[0].elements = newElements;
    jsonOut.diagrams[0].dependencies = newDependencies;

    return jsonOut;
}

/**
 * Prompt the browser to download a file with the given text content.
 * This is used to download updated JSON files, using a simple URI href.
 * This means the JSON data will download all on 1 line. Recommend using an auto-formatter to prettify the file.
 * 
 * @param {string} textContent Text content of the file to download. Here, this is expected to be a JSON string
 * @param {string} fileName (Default: "cdd.json") Name of file to be downloaded. Here, this is expected to be a JSON file name.
 */
export function downloadTextFile(textContent, fileName = "cdd.json")
{
    var elem = document.createElement('a');
    elem.setAttribute("href", "data:application/octet-stream;charset=utf-8," + textContent); //HREF with raw URI of the file contents
    elem.setAttribute("download", fileName);
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
}