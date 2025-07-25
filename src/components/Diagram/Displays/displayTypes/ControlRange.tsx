import React from "react";
import Slider from "./interactivePieces/Slider";
import { CommonDisplayProps } from "../DisplayTypeRegistry"
import { v4 as uuidv4 } from "uuid";
import Gauge from "./interactivePieces/Gauge";

import { interpolateHslLong } from "d3";

/**
 * Renders a Controllable Numeric Range Display. These attach
 * to DisplaysSection components in a DiagramElement component,
 * in a CausalDecisionDiagram.
 * A Numeric Range Display looks like a slider, with a label.
 */
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
    const isGauge = displayJSON.addons?.ADDON_OpenDIAuthoringTool?.data?.style?.isGauge ?? false;
    const gaugeColor = displayJSON.addons?.ADDON_OpenDIAuthoringTool?.data?.style?.gaugeColorGradient ?? {start: "darkgoldenrod", end: "moccasin"};

    return (
        <div>
            {(isInteractive || !isGauge
                ? <Slider
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
                : <Gauge
                    currentValue={
                        computedIOValues.get(String(displayIOValuesList[0])) ??
                        IOValues.get(displayJSON.meta.uuid) ??
                        displayJSON.content.controlParameters?.value ??
                        -1
                    }
                    title={displayJSON.meta.name ?? ""}
                    min={displayJSON.content.controlParameters?.min ?? 0}
                    max={displayJSON.content.controlParameters?.max ?? 0}
                    d3ColorScheme={interpolateHslLong(gaugeColor.start, gaugeColor.end)}
                />
            )}
        </div>
    );
};

/**
 * Generate schema-compliant JSON for a new Controllable Numeric Range Display
 * @returns JSON for a new Controllable Numeric Range Display, formatted for schema compliance
 */
export const defaultControlRangeJSON = (): any => ({
    meta: {
        uuid: uuidv4(),
        name: "New Range"
    },
    displayType: "controlRange",
    content: {
        controlParameters: {
            min: 0,
            max: 100,
            step: 1,
            value: 50,
            isInteractive: false
        }
    },
    addons: {
        ADDON_OpenDIAuthoringTool: {
            addonMeta: {
                uuid: "ec427cfd-5f80-4262-afe7-d58e6c4ba566",
                name: "OpenDI Authoring Tool"
            },
            owner: {
                uuid: "f79ae5c2-6ca9-48a2-87fa-4615da6b0f08",
                name: "Placeholder Owner Info"
            },
            data: {
                style: {
                    isGauge: false,
                    gaugeColorGradient: {
                        start: "darkgoldenrod",
                        end: "moccasin"
                    }
                }
            }
        }
    }
});

export default ControlRange;