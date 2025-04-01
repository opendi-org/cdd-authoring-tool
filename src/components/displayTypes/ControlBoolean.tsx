import React from "react";
import { CommonDisplayProps } from "../DisplayTypeRegistry"

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

export default ControlBoolean;