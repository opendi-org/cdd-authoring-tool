import * as joint from "@joint/core/dist/joint.js"

/**
 * Defines Element Area objects. Used to categorize graph elements
 * based on what area of the graph they're in
 * @class
 * @constructor
 * @public
 */
export class DecisionElementArea {

    /** The left bound of the area, defined as a percent of the canvas width
     * @type {Number} */
    left;
    /** The right bound of the area, defined as a percent of the canvas width
     * @type {Number} */
    right;
    /** The top bound of the area, defined as a percent of the canvas height
     * @type {Number} */
    top;
    /** The bottom bound of the area, defined as a percent of the canvas height
     * @type {Number} */
    bottom;
    /** Represents the color for this area's visual representation
     * @type {string} */
    color;
    /** Represents the type of Decision Element this area contains
     * @type {string} */
    elementType;


    /**
     * @param {Number} left The left bound of the area, defined as a percent of the canvas width
     * @param {Number} right The right bound of the area, defined as a percent of the canvas width
     * @param {Number} top The top bound of the area, defined as a percent of the canvas height
     * @param {Number} bottom The bottom bound of the area, defined as a percent of the canvas height
     * @param {string} color Represents the color for this area's visual representation
     * @param {string} elementType Represents the type of Decision Element this area contains
     */
    constructor(left, right, top, bottom, color, elementType)
    {
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
        this.color = color;
        this.elementType = elementType;
    }

    /**
     * Add the area defined by this class to the graph
     * @param {joint.dia.Graph} graph Graph that will contain the area
     * @param {Number} graphWidth Width of the graph that will contain the area
     * @param {Number} graphHeight Height of the graph that will contain the area
     * @returns {joint.shapes.standard.Rectange} Runtime representation of this area's Rectangle object
     */
    addAreaToGraph(graph, graphWidth, graphHeight)
    {
        //Translate bounds into absolute coords
        const absLeft = this.left * graphWidth;
        const absRight = this.right * graphWidth;
        const absTop = this.top * graphHeight;
        const absBottom = this.bottom * graphHeight;

        //Make a Rectangle for this area
        var rectToAdd = new joint.shapes.standard.Rectangle();
        rectToAdd.position(absLeft, absTop);
        rectToAdd.resize(absRight - absLeft, absBottom - absTop);

        //Define color and cursor behavior
        rectToAdd.attr({
            body: {
                fill: this.color,
                cursor: "default" //Don't show the "draggable" cursor for these rects
            }
        })

        /*
         * -- SET MODEL FIELDS--
         * 
         * See JointJS docs: https://resources.jointjs.com/docs/jointjs/v4.0/joint.html#mvc.Model.prototype.set
         * 
         * Area rectangle models will have the following fields:
         * nonInteractive (bool) - Used to set the 'interactive' flag for cells in the Paper containing the graph. See paper definition in index.js.
         * elementType (string) - Used to store the type of Decision Element contained in this area
         * isElementArea (bool) - Used in categorizeRect() to signal that a node is overlapping with an area
         */
        rectToAdd.set('nonInteractive', true); //Don't allow these rects to be dragged
        rectToAdd.set('elementType', this.elementType);
        rectToAdd.set('isElementArea', true);

        //Add to graph
        rectToAdd.addTo(graph);
        rectToAdd.toBack();         //Send to background, under all other elements
        
        return rectToAdd; //For storing runtime representation of this area's Rectangle object
    }

    /**
     * Categorizes rect, based on the DI Element areas in the graph.
     * 
     * Checks whether rect overlaps with any DI Element Area.
     * If so, returns the element type for that area.
     * If not, returns "Intermediate" by default.
     * @param {joint.shapes.standard.Rectangle} rect The Rectangle to categorize
     * @param {joint.dia.Graph} graph The Graph that contains rect
     * @returns {string} (Default: "Intermediate") The element type for rect, based on its position within the graph areas
     */
    static categorizeRect(rect, graph)
    {
        //Look for any elements that are overlapping rect
        //This will also find rect itself, but this is fine
        const elementsUnderReact = graph.findModelsInArea(rect.getBBox());
        for (const element of elementsUnderReact) {
            //Look for model field 'isElementArea'.
            //Element areas have this field set to "true". See constructor.
            if(element.get('isElementArea'))
            {
                //Element areas have an 'elementType' field. See constructor.
                return element.get('elementType');
            }
        }

        //No element area found, default to Intermediate.
        return "Intermediate";
    }
}