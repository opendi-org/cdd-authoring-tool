import * as joint from "@joint/core/dist/joint.js";
import {v4 as uuidv4} from 'uuid';
import * as fileIO from "./fileIO.js";

/**
 * Defines function button object. Used for clickable buttons that
 * run a function. Button is rendered as a Joint Rectangle.
 * @class
 * @constructor
 * @public
 */
export class FunctionButton {

    /** The visual component of the button
     * @type {joint.shapes.standard.Rectangle} */
    JointRect;
    /** The function called when this button is clicked
     * @type {function} */
    callback;
    /** Array of arguments to pass to callback
     * @type {Array<any>} */
    args;
    /** UUID generated with uuid node package. For finding model in
     * click event.
     * @type {string} */
    uuid;

    /**
     * Create a function button, with a callback executed on click. Args will
     * be passed in order.
     * @param {Number} x X position of the button
     * @param {Number} y Y position of the button
     * @param {Number} width Button width
     * @param {Number} height Button height
     * @param {string} labelText Button label
     * @param {function} callback Function to run on button click
     * @param {Array<any>} args Array of arguments passed into callback function
     */
    constructor(x, y, width, height, labelText, callback, args)
    {
        this.JointRect = new joint.shapes.standard.Rectangle();
        this.JointRect.position(x, y);
        this.JointRect.resize(width, height);

        this.callback = callback;
        this.args = args;
        
        this.uuid = uuidv4();

        //Light grey button, black text
        this.JointRect.attr({
            body: {
                fill: "#EEEEEE",
                cursor: "pointer",
                strokeWidth: 1
            },
            label: {
                cursor: "pointer",
                fill: "black"
            }
        })

        this.JointRect.attr('label/text', labelText);

        this.JointRect.set('nonInteractive', true);     //Don't allow buttons to be dragged
        this.JointRect.set('isFunctionButton', true);   //Flag for click event handling
        this.JointRect.set('uuid', this.uuid);          //Identify button during click event
    }
}

/**
 * Define button specifics and save functionality here to keep
 * index.js a little neater.
 * @class
 * @constructor
 * @public
 */
export class SaveButton extends FunctionButton {
    /**
     * @param {Array<any>} args Needs: Original JSON, current rects map, current links array
     * @see fileIO.saveGraphJSON
     */
    constructor(args) {
        super(0, 0, 80, 20, "Download", null, args);
        this.callback = this.saveCallback;
    }

    saveCallback(originalJSON, runtimeGraphData)
    {
        fileIO.downloadTextFile( JSON.stringify( fileIO.saveGraphJSON(originalJSON, runtimeGraphData.graphElements, runtimeGraphData.graphLinks) ) );
    }
}