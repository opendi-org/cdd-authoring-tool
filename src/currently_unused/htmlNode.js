import * as joint from "@joint/core/dist/joint.js"
import {Config} from "../config.js"

/**
 * Custom JointJS element, defining a Node with HTML elements.
 * The Node represents a Decision Element with a title and a dropdown indicating the type.
 * The title and background rectangle are normal SVG elements. The dropdown is an HTML <select> element
 * stored in an SVG <foreignObject> element.
 * @class
 * @constructor
 * @public
 */
export class HTMLNode extends joint.dia.Element {
    constructor()
    {
        super();

        //Main SVG markup defining the element's visual components
        this.markup = joint.util.svg([`
        <rect @selector="body"/>
        <g @selector="view_">
            <text @selector="view_label_title"/>
            <line @selector="view_divider"/>
            <text @selector="view_label_type"/>
        </g>
        <g @selector="edit_">
            <foreignObject @selector="edit_html">
                <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    class="outer"
                >
                    <div>
                        <textarea @selector="edit_textarea_title"></textarea>
                    </div>
                    <br/>
                    <div>
                        <select @selector="edit_select_type">
                            <option value="Lever" @selector="selectLever">Lever</option>
                            <option value="External" @selector="selectExternal">External</option>
                            <option value="Intermediate" @selector="selectIntermediate">Intermediate</option>
                            <option value="Outcome" @selector="selectOutcome">Outcome</option>
                        </select>
                    </div>
                </div>
            </foreignObject>
        </g>
        `]);
    }

    defaults() {
        return {
            ...super.defaults,
            type: 'HTMLNode',  //NOTE: Joint uses this to associate HTMLNode with HTMLNodeView
            attrs: {
                //Main <rect/> SVG component
                body: {
                    x: 0,
                    y: 0,
                    width: 'calc(w)',
                    height: 'calc(h)',
                    fill: "blue",
                    strokeWidth: 2,
                    stroke: "black"
                },
                view_: {
                    display: ""
                },
                edit_: {
                    display: "none"
                },
                //Title label, a <text/> SVG component
                view_label_title: {
                    x: 10,
                    y: 20,
                    textAnchor: "start",
                    textVerticalAnchor: "start",
                    fill: 'white'
                },
                view_label_type: {
                    x: 10,
                    y: 'calc(h - 20)',
                    textAnchor: "start",
                    textVerticalAnchor: "end",
                    fill: "white"
                },
                view_divider: {
                    x1: 0,
                    y1: 'calc(h - 40)',
                    x2: 'calc(w)',
                    y2: 'calc(h - 40)',
                    stroke: "black"
                },
                //The <foreignObject> SVG component containing the type dropdown
                edit_html: {
                    x: 5,
                    y: 5,
                    width: 110,
                    height: 110,
                    overflow: "visible"
                },
                edit_textarea_title: {
                    rows: 3,
                    cols: 13,
                    props: {
                        value: "EDIT TITLE"
                    }
                },
                //The actual type dropdown, a <select> HTML component
                edit_select_type: {
                    style: "width:110px"
                }
            }
        }
    }
    
    /**
     * Formats a single-line string, returning a multi-line string with breaks inserted between words
     * where the next word would've brought the line length beyond the maximum.
     * 
     * Handles words that are longer than the max line length, without overflow.
     * Preserves manual line breaks given in the input string as \n characters.
     * 
     * @param {string} stringToFormat Single-line string to break up into multiple lines
     * @param {number} maxLineLength (Default: 1/7 of rect width) Max line length before break
     * @returns {string} Multi-line string (\n inserted) with breaks where the line would've surpassed max length
     */
    static formatString(stringToFormat, maxLineLength)
    {
        //Round to int
        maxLineLength = Math.ceil(maxLineLength);
        //Split input into array of words
        const stringArray = stringToFormat.split(' ');

        //Process words
        var formattedString = "";
        var currentLineLength = 0;
        for(const word of stringArray)
        {
            if(currentLineLength + word.length < maxLineLength) //Whole word will fit on this line
            {
                formattedString += " " + word;                  //Side effect: always prepends " " to input string

                //Use this word to set the line length counter
                if(word.includes("\n")) //Words may be multi-line
                {
                    const wordLines = word.split('\n');
                    currentLineLength = wordLines[wordLines.length - 1].length;
                }
                else
                {
                    currentLineLength += word.length + 1; //Include the added space
                }
            }
            else
            {
                /*
                 * If the word is too long to fit on one line, this will break it into
                 * chunks of size <= maxLineLength.
                 * Regex matches between 1 and maxLineLength non-empty characters. Global match
                 * returns all consecutive chunks.
                 * 
                 * If the word fits in one line, this will capture the whole word.
                 */
                var regex = new RegExp('.{1,' + maxLineLength + '}', 'g');
                var wordChunks = word.match(regex);

                for(const chunk of wordChunks)
                {
                    //If we have multiple chunks, each will take up a whole line
                    formattedString += "\n" + chunk;
                }

                //The last chunk may be less than a full line length, so use it to set line length counter
                const lastChunk = wordChunks[wordChunks.length - 1];
                if(lastChunk.includes("\n")) //Chunks may be multi-line
                {
                    const chunkLines = lastChunk.split('\n');
                    currentLineLength = chunkLines[chunkLines.length - 1].length;
                }
                else
                {
                    currentLineLength = lastChunk.length;
                }
            }
        }

        return formattedString.substring(1); //Leave out the leading space
    }

    /**
     * Resizes an HTML element based on the size of the provided textbox.
     * Textbox is searched using joint.dia.ElementView.findNode(textSelector).
     * 
     * Resizes the element to the dimensions of the textbox's bounding box, plus the provided pads.
     * 
     * @param {joint.dia.Element} elementToResize Joint element that needs resized
     * @param {joint.dia.Paper} paper Joint Paper object containing the element
     * @param {string} textSelector Selector tag (@selector="tag") used to find the textbox that will determine the size of the element
     * @param {Object} pad Amount of padding to provide around the textbox
     * @param {Number} pad.width Horizontal padding around the textbox
     * @param {Number} pad.height Vertical padding around the textbox
     * @param {Object} minimum Minimum dimensions of the element
     * @param {Number} minimum.width Minimum width of the element
     * @param {Number} minimum.height Minimum height of the element
     */
    static resizeElementBasedOnText(elementToResize, paper, textSelector, pad = {width: 20, height: 20}, minimum = {width: Config.minElementWidth, height: Config.minElementHeight})
    {

        // Get textbox bounding box dimensions
        var elementView = paper.findViewByModel(elementToResize);
        const textBBox = elementView.findNode(textSelector).getBBox();

        // Calculate new dimensions
        var resize = {width: textBBox.width + pad.width, height: textBBox.height + pad.height};

        //Adhere to provided minima
        if(resize.width < minimum.width)
        {
            resize.width = minimum.width;
        }
        if(resize.height < minimum.height)
        {
            resize.height = minimum.height;
        }


        elementToResize.resize(resize.width, resize.height);
    }

};

/**
 * ElementView for the HTML Node. Intercepts HTML events for the
 * HTML components provided in the foreignObject of the Node's SVG markdown.
 */
const HTMLNodeView = joint.dia.ElementView.extend({
    /**
     * Event to intercept: change
     * Selector tag for relevant component: "select"
     * Name of function to call on event intercept: "onSelect"
     * 
     * Selector tag is set in the HTML Node's SVG markdown.
     */
    events: {
        'change select': 'onSelect'
    },

    /**
     * Runs when Joint intercepts the "change" event on this node's
     * "select" component.
     * 
     * Reads the changed value, sets this element's associated model value, "elementType".
     * @param {} evt Event object. Contains info about the <select> change event.
     */
    onSelect: function(evt) {
        evt.preventDefault();
        this.model.set('elementType', evt.target.value);
    }
});

const HTMLNodeEditTool = joint.elementTools.Button.extend({
    name: 'edit-button',
    options: {
        markup: [
            {
                tagName: 'circle',
                selector: 'button',
                attributes: {
                    'r': 7,
                    'fill': '#5d6e5c',
                    'cursor': 'pointer'
                }
            },
            {
                tagName: 'path',
                selector: 'icon',
                attributes: {
                    'd': 'm -3.9170051,1.8469034 2.0267429,2.0267429 6.935967,-6.9359671 -2.026745,-2.0267429 z M -3.0742353,3.0800088 -4.1121729,2.0420712 -4.4457356,4.488959 -2.08543,4.0688141 Z',
                    'fill': '#FFFFFF',
                    'stroke': '#FFFFFF',
                    'stroke-width': 0,
                    'pointer-events': 'none'
                }
            }
        ],
        x: '100%',
        y: '100%',
        offset: {
            x: 0,
            y: 0
        },
        rotate: true,
        action: function(evt) {
            const modeModelTag = 'viewMode';
            var isView = this.model.get(modeModelTag) == 'view';

            console.log(isView);

            //Toggle view value
            if(isView)
            {
                this.model.set(modeModelTag, 'edit')
            }
            else
            {
                this.model.set(modeModelTag, 'view');
            }

            //Toggle display groups
            const viewAttribute = 'view_';
            const editAttribute = 'edit_';
            const viewAttributePath = viewAttribute + '/display';
            const editAttributePath = editAttribute + '/display';

            if(!isView)
            {
                this.model.attr(viewAttributePath, "");
                this.model.attr(editAttributePath, "none");

                HTMLNode.resizeElementBasedOnText(this.model, this.paper, viewAttribute);
            }
            else
            {
                this.model.attr(viewAttributePath, "none");
                this.model.attr(editAttributePath, "");

                HTMLNode.resizeElementBasedOnText(this.model, this.paper, editAttribute);
            }
        }
    }
});

export { HTMLNodeView, HTMLNodeEditTool };

