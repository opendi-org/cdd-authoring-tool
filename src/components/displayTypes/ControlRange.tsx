import React from "react";
import Slider from "./interactivePieces/Slider";
import { CommonDisplayProps } from "../DisplayTypeRegistry"

const ControlRange: React.FC<CommonDisplayProps> = ({
    displayJSON,
    computedIOValues,
    IOValues,
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

    return (
        <div>
            <Slider
                title={displayJSON.meta.name ?? ""}
                min={displayJSON.content.controlParameters?.min ?? 0}
                max={displayJSON.content.controlParameters?.max ?? 0}
                step={displayJSON.content.controlParameters?.step ?? 1}
                currentValue={
                    computedIOValues.get(String(displayIOValuesList[0])) ??
                    IOValues.get(displayJSON.meta.uuid) ??
                    displayJSON.content.controlParameters?.value ??
                    -1
                }
                setCurrentValue={isInteractive ? setSingleValue : () => {} }
            />
        </div>
    );
};

export default ControlRange;