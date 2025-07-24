import React from "react";
import { CommonDisplayProps } from "../DisplayTypeRegistry";
import { v4 as uuidv4 } from "uuid";

/**
 * Renders a Controllable Selector Display. These attach
 * to DisplaysSection components in a DiagramElement component,
 * in a CausalDecisionDiagram.
 * A Selector Display looks like a <select> HTML tag in both its
 * interactive and non-interactive variants.
 */
const ControlSelector: React.FC<CommonDisplayProps> = ({
    displayJSON,
    computedIOValues,
    IOValues: _unused,
    setIOValues,
    controlsMap
}) => {

    // Consult the Controls map to see if there are I/O values associated with this Display
    const displayIOValuesList = controlsMap.get(displayJSON.meta.uuid) ?? [null];
    
    // Sets a single value in the IO Values map.
    // Assumes the value UUID is at displayIOValuesList[0]
    const setSingleValue = (newValue: any) => {
        setIOValues((prevIOValues) => {
            const newIOVals = new Map(prevIOValues);
            newIOVals.set(displayIOValuesList[0] ?? displayJSON.meta.uuid, newValue);
            return newIOVals;
        })
    }

    // Selector is "disabled" if it's non-interactive
    const isInteractive = displayJSON.content.controlParameters?.isInteractive ?? false;
    
    // This display labels itself with its name
    const label = displayJSON.meta.name ?? "";

    let selectedValue = (
        computedIOValues.get(String(displayIOValuesList[0])) ??
        displayJSON.content.controlParameters?.selectedValue ??
        0
    );

    const optionValues = (
        computedIOValues.get(String(displayIOValuesList[1])) ??
        displayJSON.content.controlParameters?.options ??
        [0]
    );

    let optionIdx = 0;
    const optionsList = optionValues.map((optionValue: any) => {
        const thisIdx = optionIdx;
        optionIdx++;
        return (
            <option value={optionValue} key={`selector-${displayJSON.meta.uuid}-option-${thisIdx}`}>{String(optionValue)}</option>
        )
    })

    return (
        <div>
            {label && <div>{label}</div>}
            {
                <div>
                    <select name="Control: Selector" value={selectedValue} onChange={(event) => {setSingleValue(event.target.value)}} disabled={!isInteractive}>
                        {optionsList}
                    </select>
                </div>
            }
        </div>
    );
};

/**
 * Generate schema-compliant JSON for a new Controllable Text Display
 * @returns JSON for a new Controllable Text Display, formatted for schema compliance
 */
export const defaultControlSelectorJSON = (): any => ({
    meta: {
        uuid: uuidv4(),
        name: "New Selector"
    },
    displayType: "controlSelector",
    content: {
        controlParameters: {
            options: [0],
            selectedValue: 0,
            isInteractive: true,
        }
    }
})

export default ControlSelector;