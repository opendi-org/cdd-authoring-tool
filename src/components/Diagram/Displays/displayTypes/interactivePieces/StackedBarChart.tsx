import * as d3 from "d3";
import { useEffect, useMemo, useRef } from "react";

interface StackedBarChartProps {
  width: number;
  height: number;
  data: {
    title: string;
    xAxisLabels: string[];
    series: { title: string; values: number[]; color?: string }[];
  };
  minY?: number;
  maxY?: number;
  stepHeight?: number;
}

function StackedBarChart({
  width,
  height,
  data,
  minY = 0,
  maxY = 200,
  stepHeight = 1,
}: StackedBarChartProps) {
  const axesRef = useRef(null);

  // bounds = area inside the graph axis = calculated by substracting the margins
  const margin = {top: 30, right: 30, bottom: 50, left: 50};
  const boundsWidth = width - margin.left - margin.right;
  const boundsHeight = height - margin.top - margin.bottom;

  const xAxisLabels = data.xAxisLabels;
  const dataSubgroupTitles = data.series.map((component) => component.title);

  const organizedData = xAxisLabels.map((label, index) => {
    const stackArray = data.series.map((component) => [component.title, component.values[index]]);
    const stack = Object.fromEntries(stackArray);

    return {
      title: label,
      ...stack,
    };
  });

  // Data Wrangling: stack the data
  const stackSeries = d3.stack().keys(dataSubgroupTitles).order(d3.stackOrderNone);
  const series = stackSeries(organizedData);

  const safeMaxY = Math.max(stepHeight, stepHeight * Math.ceil((maxY || 1) / stepHeight));
  const safeMinY = Math.min(minY, safeMaxY - stepHeight)
  // Y axis
  const yScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([safeMinY, safeMaxY])
      .range([boundsHeight, 0]);
  }, [boundsHeight, minY, maxY, stepHeight]);

  // X axis
  const xScale = useMemo(() => {
    return d3
      .scaleBand<string>()
      .domain(xAxisLabels)
      .range([0, boundsWidth])
      .padding(0.05);
  }, [boundsWidth, xAxisLabels]);

  // Color Scale
  const colorScale = d3
    .scaleOrdinal<string>()
    .domain(xAxisLabels)
    .range(["#e0ac2b", "#e85252", "#6689c6", "#9a6fb0", "#a53253"]);

  // Render the X and Y axis using d3.js, not react
  useEffect(() => {
    const svgElement = d3.select(axesRef.current);
    svgElement.selectAll("*").remove();
    const xAxisGenerator = d3.axisBottom(xScale);
    svgElement
      .append("g")
      .attr("transform", "translate(0," + boundsHeight + ")")
      .call(xAxisGenerator);

    const yAxisGenerator = d3.axisLeft(yScale);
    svgElement.append("g").call(yAxisGenerator);
  }, [xScale, yScale, boundsHeight]);

  const rectangles = series.map((subgroup, i) => {
    return (
      <g key={i}>
        {subgroup.map((barSegment, j) => {
          const barSegmentHeight = Math.max(0, yScale(barSegment[0]) - yScale(barSegment[1]))
          return (
            <rect
              key={j}
              x={xScale(String(barSegment.data.title))}
              y={yScale(barSegment[1])}
              height={barSegmentHeight}
              width={xScale.bandwidth()}
              fill={data.series[i].color || colorScale(subgroup.key)}
              opacity={0.9}
            ></rect>
          );
        })}
      </g>
    );
  });

  return (
    <>
      <svg width={width} height={height}>
        <g
          width={boundsWidth}
          height={boundsHeight}
          transform={`translate(${margin.left},${margin.top})`}
        >
          {rectangles}
        </g>
        <g
          width={boundsWidth}
          height={boundsHeight}
          ref={axesRef}
          transform={`translate(${margin.left},${margin.top})`}
        />
      </svg>
    </>
  );
}

export default StackedBarChart;

// NOTE: This React control is based on work in the di-controls-react repository by Quantellia (forked by OpenDI).
// See repo here: https://github.com/opendi-org/di-react-controls
// 
// Used under the MIT License. See license here: https://github.com/opendi-org/di-react-controls?tab=MIT-1-ov-file