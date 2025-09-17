import React from "react";
import { CommonDisplayProps } from "../DisplayTypeRegistry";
import { v4 as uuidv4 } from "uuid";

/**
 * Renders a Controllable Text Display. These attach
 * to DisplaysSection components in a DiagramElement component,
 * in a CausalDecisionDiagram.
 * A Text Display looks like a textbox for input, or a simple text
 * label with a grey background for output. There is also a label
 * for the display name.
 */
const ControlText: React.FC<CommonDisplayProps> = ({
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

    // This display is constructed differently if it's non-interactive
    const isInteractive = displayJSON.content.controlParameters?.isInteractive ?? false;
    
    // This display labels itself with its name
    const label = displayJSON.meta.name ?? "";

    const textValue = String(
        computedIOValues.get(String(displayIOValuesList[0])) ??
        displayJSON.content.controlParameters?.value ??
        ""
    );

    return (
        <div>
            {label && <div>{label}</div>}
            {isInteractive ? (
                <input
                    type="text"
                    value={textValue}
                    onChange={(event) => setSingleValue(event.target.value)}
                />
            ) : (
                <div style={{wordWrap: "break-word", width: "300px"}}>
                    <label style={{backgroundColor:"#323232", paddingInline:"3px"}}>{textValue}</label>
                </div>
            )}
        </div>
    );
};

/**
 * Generate schema-compliant JSON for a new Controllable Text Display
 * @returns JSON for a new Controllable Text Display, formatted for schema compliance
 */
export const defaultControlTextJSON = (): any => ({
    meta: {
        uuid: uuidv4(),
        name: "New Text"
    },
    displayType: "controlText",
    content: {
        controlParameters: {
            value: " ",
            isInteractive: false
        }
    }
})

export default ControlText;