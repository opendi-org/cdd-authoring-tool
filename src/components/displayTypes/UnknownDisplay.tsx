import { CommonDisplayProps } from "../DisplayTypeRegistry";
import React from "react";
import { v4 as uuidv4 } from "uuid";

/**
 * Default rendering behavior for any Display type
 * that is unknown or unsupported by this tool.
 * 
 * Tries to render the name and the display type, if found.
 */
const UnknownDisplay: React.FC<CommonDisplayProps> = ({
    displayJSON,
    computedIOValues: _unusedComputed,
    IOValues: _unusedIO,
    setIOValues: _unusedSetIO,
    controlsMap: _unusedControlsMap
}) => {

    const displayHasName = displayJSON && displayJSON.meta && displayJSON.meta.name;
    const displayHasType = displayJSON && displayJSON.displayType;
    const label = (displayHasType ? `Unsupported display of type ${displayJSON.displayType}`
                    : `Unknown display`)
                    + `${displayHasName ? `: ${displayJSON.meta.name}` : ""}`;
    return (
        <div>
            {label}
        </div>
    )
}

/**
 * Generate a schema-compliant JSON for a new Unknown Display
 * @returns JSON for a new Unknown display, using the "Point" type as a placeholder for schema compliance
 */
export const defaultUnkownDisplayJSON = (): any => ({
    meta: {
        uuid: uuidv4(),
        name: "Unknown display"
    },
    displayType: "point",
    content: {}
})

export default UnknownDisplay;