import { DecisionElement } from "../graphComponents/decisionElement";

/**
 * Simple class for keeping track of selected elements.
 * Currently mostly used in click event callbacks in index.js
 * @property {Number} bufferSize: Maximum number of elements in the selection queue
 * @property {Array<DecisionElement>} buffer: Queue of selected elements
 */
export class SelectionBuffer {

    static DefaultBufferSize = 1;
    static MaxBufferSize = 50;

    /**
     * Construct a selection buffer, for keeping track of selected elements.
     * @param {Number} bufferSize Maximum number of elements in the selection queue
     */
    constructor(bufferSize = this.DefaultBufferSize) {
        this.bufferSize = bufferSize;
        this.buffer = [];
    }

    /**
     * Update the selection buffer.
     * Pass an element to add it to the buffer, or pass null to clear the buffer.
     * Buffer maintains a queue of selected elements, capped at this.bufferSize.
     * Elements passed in that are already in the buffer get re-inserted at front of buffer.
     * @param {DecisionElement} elemToSelect The element to select. Pass null to clear all selections.
     */
    updateSelections(dependenciesMap, elemToSelect = null) {

        /**
         * lil helper function
         * Select or deselect dependencies associated with an element, as needed.
         * Defer to @see {CausalDependency.updateSelection} for (de)selection logic.
         * @param {DecisionElement} elem The selected or deselected element, whose dependencies need to be (de)selected.
         */
        const updateDepsForElement = (elem) => {
            elem.associatedDependencies.forEach((depUUID) => {
                //Get runtime representation for this dependency
                const dep = dependenciesMap[depUUID];
                dep.updateSelection();  //Run (de)selection logic
            });
        };


        //MAIN LOGIC START

        //Are we adding or clearing?
        if(elemToSelect !== null)           //Adding: Add to end of queue
        {
            this.buffer.push(elemToSelect);
        }
        else                                //Clearing: Deselect all and empty queue
        {
            this.buffer.forEach((elem) => {
                elem.deselect();
                updateDepsForElement(elem);
            });
            this.buffer = [];
        }

        //Adjust to buffer max. Shift to remove from front of queue, then deselect shifted.
        while(this.buffer.length > this.bufferSize)
        {
            const deselectedElement = this.buffer.shift();
            deselectedElement.deselect();
            updateDepsForElement(deselectedElement);
        }

        //Now that buffer is updated, select everything in it.
        //Usually this is just one element, unless we're multi-selecting.
        this.buffer.forEach((elem) => {
            elem.select();
            updateDepsForElement(elem);
        });
    }
}