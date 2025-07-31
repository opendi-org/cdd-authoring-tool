import React from "react";
import { CommonDisplayProps } from "../DisplayTypeRegistry";
import { v4 as uuidv4 } from "uuid";
import StackedBarChart from "./interactivePieces/StackedBarChart";
import "./DisplayBarChart.css"


const DisplayBarChart: React.FC<CommonDisplayProps> = ({
    displayJSON,
    computedIOValues,
    IOValues,
    setIOValues: _unusedSetIO,
    controlsMap
}) => {

    // Consult the Controls map to see if there are I/O values associated with this Display
    const displayIOValuesList = controlsMap.get(displayJSON.meta.uuid) ?? [""];

    //We're expecting either a list of series values (2D array of numbers),
    //OR a single value, which we'll drop in as the content.data object

    let data = displayJSON.content.data;
    const firstIO = computedIOValues.get(displayIOValuesList[0]) ?? IOValues.get(displayIOValuesList[0]) ?? [];
    if(displayIOValuesList.length == 1 && !Array.isArray(firstIO))
    {
        //We only got one non-array IO value. Assume it's a well-formed content.data object
        data = computedIOValues.get(String(displayIOValuesList[0])) ?? 
        IOValues.get(String(displayIOValuesList[0])) ??
        displayJSON.content.data;
    }
    else
    {
        //We got multiple IO values. Assume they're lists of numbers for content.data.series[]
        //Auto-name the series since those names don't get displayed anyhow
        let seriesCount = 0
        data.series = [];
        data.series = displayIOValuesList.map((ioValUUID: string) => {
            let out = {
                title: `Series ${seriesCount}`,
                values: (
                    computedIOValues.get(ioValUUID) ??
                    IOValues.get(ioValUUID) ??
                    []
                )
            }
            seriesCount++;
            return out;
        })
    }



    const width = Math.min(70 + Math.max((data.xAxisLabels ?? []).length, 1) * 60, 300);
    return (
        <div>
            {displayJSON.meta.name}
            <br />
            <StackedBarChart
                width={width}
                height={200}
                data={data}
                minY={displayJSON.content.minY}
                maxY={displayJSON.content.maxY}
                stepHeight={displayJSON.content.stepHeight ?? 1}
            />
        </div>
    )
};

export const defaultDisplayBarChartJSON = (): any => ({
    meta: {
        uuid: uuidv4(),
        name: "New Bar Chart"
    },
    displayType: "stackedBarChart",
    content: {
        data: {
            xAxisLabels: ["Category 1", "Category 2"],
            series: [
                {
                    title: "Series 1",
                    values: [3, 5],
                    color: "#f26f05"
                },
                {
                    title: "Series 2",
                    values: [2, 2],
                    color: "#edd241"
                }
            ]
        },
        minY: 0,
        maxY: 10,
        stepHeight: 5
    }
})

export default DisplayBarChart;