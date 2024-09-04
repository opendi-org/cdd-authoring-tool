import * as joint from "@joint/core/dist/joint.js"

export class CausalDependency extends joint.shapes.standard.Link {
    constructor()
    {
        super();
        this.originalJSON = {};
    }

    /**
     * Add a link with the given JSON values to the given graph.
     * Link JSON must be OpenDI-compliant.
     * 
     * @param {JSON} linkJSON Original raw JSON data for this link
     * @param {joint.dia.Graph} graph Graph object to add this link to
     * @param {Array<joint.shapes.standard.Rectangle>} elementsInGraph Array of all decision elements in the graph
     * @returns {joint.shapes.standard.Link} Runtime representation of the link that was added
     */
    static addLinkToGraph(linkJSON, graph, elementsInGraph)
    {
        var linkToAdd = new CausalDependency;

        //Find source and target by the uuid given in JSON data
        const sourceElement = elementsInGraph["" + linkJSON.source];
        const targetElement = elementsInGraph["" + linkJSON.target];

        //Set link endpoints for JointJS
        linkToAdd.source(sourceElement);
        linkToAdd.target(targetElement);

        const myUUID = linkJSON.meta.uuid;
        linkToAdd.set('uuid', myUUID);
        linkToAdd.set('name', linkJSON.meta.name);
        linkToAdd.set('source_uuid', linkJSON.source);
        linkToAdd.set('target_uuid', linkJSON.target);

        //Set runtime properties
        linkToAdd.originalJSON = linkJSON;

        //(register self with source and target elements)
        sourceElement.associatedDependencies.push(myUUID);
        targetElement.associatedDependencies.push(myUUID);

        linkToAdd.addTo(graph);
        return linkToAdd; //For storing the runtime link object
    }
}