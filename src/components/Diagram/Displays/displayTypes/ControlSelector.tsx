import React from "react";
import { CommonDisplayProps } from "../DisplayTypeRegistry";
import { v4 as uuidv4 } from "uuid";
import Dial from "./interactivePieces/Dial";
import "./ControlSelector.css"

import { interpolateHslLong } from "d3";

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

    // Sets a single value in the IO Values map.
    // Assumes the value UUID is at displayIOValuesList[0]
    const setSingleValue = (newValue: any) => {
        setIOValues((prevIOValues) => {
            const newIOVals = new Map(prevIOValues);
            newIOVals.set(displayIOValuesList[0] ?? displayJSON.meta.uuid, newValue);
            return newIOVals;
        });
    }

    // Selector is "disabled" if it's non-interactive
    const isInteractive = displayJSON.content.controlParameters?.isInteractive ?? false;
    
    // This display labels itself with its name
    const label = displayJSON.meta.name ?? "";

    // Consult the Controls map to see if there are I/O values associated with this Display
    const displayIOValuesList = controlsMap.get(displayJSON.meta.uuid) ?? [null];

    //0th index is for associating an I/O value with the selected value
    let selectedValue = (
        computedIOValues.get(String(displayIOValuesList[0])) ??
        displayJSON.content.controlParameters?.selectedValue ??
        0
    );

    //1st index is optional, provided if the list of options should come from an I/O value. It'll be an array.
    const optionValues = (
        computedIOValues.get(String(displayIOValuesList[1])) ??
        displayJSON.content.controlParameters?.options ??
        [0]
    );

    if(Array.isArray(optionValues) && !optionValues.includes(selectedValue) && optionValues.length > 0)
    {
        setSingleValue(optionValues[0]);
    }

    const selectedIdx = Math.max(0, optionValues.indexOf(selectedValue));

    let optionIdx = 0;
    const optionsList = optionValues.map((optionValue: any) => {
        const thisIdx = optionIdx;
        optionIdx++;
        return (
            <option value={thisIdx} key={`selector-${displayJSON.meta.uuid}-option-${thisIdx}`}>{String(optionValue)}</option>
        )
    });

    const isDial = displayJSON.addons?.ADDON_OpenDIAuthoringTool?.data?.style?.isDial ?? false;
    const dialColor = displayJSON.addons?.ADDON_OpenDIAuthoringTool?.data?.style?.dialColorGradient ?? {start: "darkgoldenrod", end: "moccasin"};

    return (
        <div>
            {label && <div>{label}</div>}
            {
                (!isDial ?
                    (<div>
                        <select name="Control: Selector" value={selectedIdx} onChange={(event) => {setSingleValue(optionValues[Number(event.target.value)])}} disabled={!isInteractive}>
                            {optionsList}
                        </select>
                    </div>) :
                    (<div>
                        <Dial
                            currentValue={selectedValue}
                            setCurrentValue={isInteractive ? ((newVal) => {setSingleValue(newVal)}) : (() => {})}
                            title={"TEST"}
                            values={optionValues}
                            d3ColorScheme={interpolateHslLong(dialColor.start, dialColor.end)}
                        />
                    </div>)
                )
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
            options: [1, 2, 3, 4, 5],
            selectedValue: 3,
            isInteractive: true,
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
                    isDial: false,
                    dialColorGradient: {
                        start: "darkgoldenrod",
                        end: "moccasin"
                    }
                }
            }
        }
    }
})

export default ControlSelector;