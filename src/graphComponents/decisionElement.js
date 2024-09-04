import * as joint from "@joint/core/dist/joint.js"
import {Config} from "../config.js"

export class DecisionElement extends joint.dia.Element {
    constructor()
    {
        super();

        //Main SVG markup defining the element's visual components
        this.markup = joint.util.svg([`
            <rect @selector="body"/>
            <g @selector="content">
                <text @selector="content_label_title"/>
                <line @selector="content_divider"/>
                <text @selector="content_label_type"/>
            </g>
        `]);
        
        this.selectedAttr = {
            body: {
                strokeWidth: 3,
                fill: '#89d3f5'
            },
            content_label_title: {
                fill: 'black'
            },
            content_label_type: {
                fill: 'black'
            }
        };
        this.defaultAttr = {
            body: {
                strokeWidth: 2,
                fill: '#001fd1'
            },
            content_label_title: {
                fill: 'white'
            },
            content_label_type: {
                fill: 'white'
            }
        };

        //This field used by CausalDependency for its updateSelection() logic
        this.isSelected = false;

        this.originalJSON = {};
        
        //UUIDs
        this.associatedDependencies = [];
    }

    defaults() {
        return {
            ...super.defaults,
            type: 'DecisionElement',    //NOTE: Joint will use this to associate a DecisionElementView, if needed
            attrs: {
                //Main <rect/> SVG component
                body: {
                    x: 0,
                    y: 0,
                    width: 'calc(w)',
                    height: 'calc(h)',
                    fill: '#001fd1',
                    strokeWidth: 2,
                    stroke: 'black'
                },
                //Title label, a <text/> SVG component
                content_label_title: {
                    x: 10,
                    y: 20,
                    textAnchor: 'start',
                    textVerticalAnchor: 'start',
                    fill: 'white'
                },
                content_label_type: {
                    x: 10,
                    y: 'calc(h-20)',
                    textAnchor: 'start',
                    textVerticalAnchor: 'end',
                    fill: 'white'
                },
                content_divider: {
                    x1: 0,
                    y1: 'calc(h-40)',
                    x2: 'calc(w)',
                    y2: 'calc(h-40)',
                    stroke: 'black'
                }
            }
        }
    }

    select()
    {
        this.attr(this.selectedAttr);
        this.isSelected = true;
        this.toFront();
    }

    deselect()
    {
        this.attr(this.defaultAttr);
        this.isSelected = false;
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
        resize.width = Math.max(resize.width, minimum.width);
        resize.height = Math.max(resize.height, minimum.height);

        elementToResize.resize(resize.width, resize.height);
    }

    /**
     * Add an element with the given JSON values to the given graph.
     * Element JSON must be OpenDI-compliant.
     * 
     * @param {JSON} elementJSON Original raw JSON data for this element
     * @param {joint.dia.Graph} graph Graph object to add this element to
     * @param {Number} elementMaxWidth (Optional) Maximum width of this element
     * @returns {DecisionElement} Runtime representation of the element that was added
     */
    static addElementToGraph(elementJSON, graph, paper, elementMaxWidth = Config.maxElementWidth, charWidth = 7)
    {
        const diagramJSON = elementJSON.content;
        const elementType = elementJSON.causalType;
        const elementTitle = elementJSON.meta.name;
    
        //Add a new element to the graph
        const elementToAdd = new DecisionElement();
        elementToAdd.addTo(graph);

        //Set runtime properties
        elementToAdd.originalJSON = elementJSON;
    
        // -- SET VISUAL ATTRIBUTES --
    
        //Position
        elementToAdd.position(diagramJSON.position.x, diagramJSON.position.y);
    
        //Title, type
        elementToAdd.attr({
            content_label_title: {
                text: DecisionElement.formatString(elementTitle, elementMaxWidth / charWidth)
            },
            content_label_type: {
                text: elementType
            }
        });
    
        //Size
        DecisionElement.resizeElementBasedOnText(elementToAdd, paper, "content");
    
        //Type (Set dropdown <select> menu to pre-select the right type)
        const typeAttrString = 'select' + elementType + "/props/selected";
        elementToAdd.attr(typeAttrString, true);
    
        /*
         * -- SET MODEL FIELDS --
         * 
         * See JointJS docs: https://resources.jointjs.com/docs/jointjs/v4.0/joint.html#mvc.Model.prototype.set
         * 
         * Element rectangle models will have the following fields:
         * uuid (string) - This element's UID. Used for storage/lookup in runtime rect dict
         * name (string) - This element's human-readable name. Used for display on the diagram.
         * elementType (string) - Used to store the type of Decision Element contained in this area
         */
        elementToAdd.set('uuid', elementJSON.meta.uuid);
        elementToAdd.set('elementType', elementType);
        elementToAdd.set('name', elementTitle);
    
        return elementToAdd; //For storing the runtime rect object
    }

};

