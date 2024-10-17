import * as joint from "@joint/core/dist/joint.js"

export class CausalDependency extends joint.shapes.standard.Link {
    constructor()
    {
        super();
        this.originalJSON = {};

        this.defaultAttr = {
            line: {
                stroke: '#000000',
                strokeWidth: 2
            }
        };

        this.selectedAttr = {
            line: {
                stroke: '#DDDDDD',
                strokeWidth: 4
            }
        }

        this.runtimeSource = null;
        this.runtimeTarget = null;
    }

    select()
    {
        this.attr(this.selectedAttr);
        this.toFront();
    }

    deselect()
    {
        this.attr(this.defaultAttr);
    }

    updateSelection()
    {
        const shouldBeSelected = this.runtimeSource.isSelected || this.runtimeTarget.isSelected;
        
        shouldBeSelected ? this.select() : this.deselect();
    }

    /**
     * Add a link with the given JSON values to the given graph.
     * Link JSON must be OpenDI-compliant.
     * 
     * @param {JSON} linkJSON Original raw JSON data for this link
     * @param {joint.dia.Graph} graph Graph object to add this link to
     * @param {Map<string,joint.shapes.standard.Rectangle>} elementsInGraph Map of all decision elements in the graph
     * @returns {joint.shapes.standard.Link} Runtime representation of the link that was added
     */
    static addLinkToGraph(linkJSON, graph, elementsInGraph)
    {
        var linkToAdd = new CausalDependency;

        //Find source and target by the uuid given in JSON data
        linkToAdd.runtimeSource = elementsInGraph["" + linkJSON.source];
        linkToAdd.runtimeTarget = elementsInGraph["" + linkJSON.target];

        //Set link endpoints for JointJS
        linkToAdd.source(linkToAdd.runtimeSource);
        linkToAdd.target(linkToAdd.runtimeTarget);

        const myUUID = linkJSON.meta.uuid;
        linkToAdd.set('uuid', myUUID);
        linkToAdd.set('name', linkJSON.meta.name);
        linkToAdd.set('source_uuid', linkJSON.source);
        linkToAdd.set('target_uuid', linkJSON.target);

        //Set visual properties
        linkToAdd.attr(linkToAdd.defaultAttr);

        //Set runtime properties
        linkToAdd.originalJSON = linkJSON;

        //(register self with source and target elements)
        linkToAdd.runtimeSource.associatedDependencies.push(myUUID);
        linkToAdd.runtimeTarget.associatedDependencies.push(myUUID);

        linkToAdd.addTo(graph);
        return linkToAdd; //For storing the runtime link object
    }
}