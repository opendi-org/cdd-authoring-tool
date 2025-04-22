import React from "react";
import { CommonDisplayProps } from "../DisplayTypeRegistry";
import { v4 as uuidv4 } from "uuid";

/**
 * Renders a Controllable Boolean Display. These attach
 * to DisplaysSection components in a DiagramElement component,
 * in a CausalDecisionDiagram.
 * A Boolean Display looks like a checkbox, with a label.
 */
const ControlBoolean: React.FC<CommonDisplayProps> = ({
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

    // This display labels itself with its name
    const label = displayJSON.meta.name ?? "";

    const boolValue = (
        computedIOValues.get(String(displayIOValuesList[0])) ??
        !!(displayJSON.content.controlParameters?.value)
    );

    return (
        <div>
            {label && <div>{label}</div>}
            <input
                type="checkbox"
                checked={boolValue}
                onChange={(event) => setSingleValue(event.target.checked)}
            />
        </div>
    );
};

/**
 * Generate schema-compliant JSON for a new Controllable Boolean Display
 * @returns JSON for a new Controllable Boolean Display, formatted for schema compliance
 */
export const defaultControlBooleanJSON = (): any => ({
    meta: {
        uuid: uuidv4(),
        name: "New Boolean"
    },
    displayType: "controlBoolean",
    content: {
        controlParameters: {
            value: false,
            isInteractive: false
        }
    }
})

export default ControlBoolean;