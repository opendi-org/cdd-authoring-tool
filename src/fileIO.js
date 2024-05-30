/**
 * Save the updated rectangle and link information from the current graph
 * to an updated json file. Prompts an immediate download of the JSON file.
 * 
 * @param {JSON} originalJSON The JSON file used to create the graph originally
 * @param {Array<joint.shapes.standard.Rectangle>} rects The array of updated rects to save
 * @param {Array<joint.shapes.standard.Link>} links The array of updated links to save
 * @param {string} fileName File name for output JSON file
 */
export function saveGraphJSON(originalJSON, rects, links, fileName = "cdd.json")
{
    console.log("SAVING...");
    
    const newElements = new Array();
    originalJSON.elements.forEach((node) => {
        const rectFromGraph = rects[node.uuid];
        if(rectFromGraph !== null)
        {
            const nodePosition = rectFromGraph.get('position');
            node.diagram.position.x = nodePosition.x;
            node.diagram.position.y = nodePosition.y;
            node.type = rectFromGraph.get('elementType');
        }
        newElements.push(node);
    });

    const jsonOut = originalJSON; //Preserve any existing metadata
    jsonOut.elements = newElements; //Overwrite element information
    jsonOut.dependencies = originalJSON.dependencies; //Later this will be set to something similar to newElements

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