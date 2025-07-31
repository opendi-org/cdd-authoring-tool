import * as d3 from "d3";
import { useEffect, useRef } from "react";

interface d3Interpolate {
  (t: number): string;
}

interface GaugeProps {
  title: string;
  radius?: number;
  min: number;
  max: number;
  currentValue: number;
  d3ColorScheme?: d3Interpolate;
  reverseColorScheme?: boolean;
  colorFillEnabled?: boolean;
  id?: string;
}

/**
 * Circular gauge showing the current value in relation to the max and min,
 * with title above.
 * 
 * @param {number} currentValue stateful value with the number to represent in the gauge
 * @param {string} title text under the currentValue
 * @param {number} min minimum number on the gauge
 * @param {number} max maximum number on the gauge
 * @param {number} radius OPTIONAL, radius of the gauge, default 500
 * @param {string} d3ColorScheme OPTIONAL, d3.Interpolate function to generate a color scheme, default d3.interpolateHslLong("red", "limegreen")
 * @param {boolean} reverseColorScheme OPTIONAL, whether or not to invert the direction the colorscheme flows in, default false
 */
function Gauge({
  currentValue,
  title,
  min,
  max,
  radius = 200,
  d3ColorScheme = d3.interpolateLab("white", "darkorange"),
  reverseColorScheme = false,
  colorFillEnabled = true,
  id,
}: GaugeProps) {
  const gaugeRef = useRef(null);
  const width = radius;
  const height = radius / 2.3;
  const innerRadius = Math.min(width, height) / 2.3;
  const outerRadius = Math.min(width, height);
  const startAngle = -Math.PI / 2;
  const endAngle = Math.PI / 2;
  const currentAngle =
    Math.min((currentValue - min) / (max - min), max) * Math.PI;
  const smallFont = `font: ${Math.max(radius / 12, 8)}px sans-serif;`;

  const clampedCurrentValue = Math.max(min, Math.min(currentValue, max));
  const normalizedCurrentValue = (clampedCurrentValue - min) / (max - min); //Range from 0 to 1

  //Set up color scale if enabled
  //This will make the foreground arc interpolate between two colors as the gauge "fills up"
  const numColorSteps = 100;
  const colorScale = d3
    .scaleOrdinal<string, string>()
    .domain(d3.range(numColorSteps).map((i) => i.toString()))
    .range(d3.quantize(d3ColorScheme, numColorSteps));
  const colorIndex = Math.floor(normalizedCurrentValue * (numColorSteps - 1));
  const adjustedColorIndex = reverseColorScheme
    ? numColorSteps - 1 - colorIndex
    : colorIndex;
  const fillColor = colorFillEnabled
    ? colorScale(adjustedColorIndex.toString())
    : colorScale((numColorSteps - 1).toString());

  useEffect(() => {
    const svg = d3
      .select(gaugeRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-(width * 1.1) / 2, -height, width * 1.2, height * 1.2])
      .attr(
        "style",
        `max-width: 100%; height: auto; font: ${Math.max(
          radius / 12,
          20
        )}px sans-serif;`
      );
    svg.selectAll("g").remove();
    const g = svg.append("g");
    // .attr("transform", "translate(" + width / 2 + "," + height + ")");
    
    const basicArc = d3
      .arc()
      .innerRadius(d => d.innerRadius)
      .outerRadius(d => d.outerRadius)
      .startAngle(d => d.startAngle)
      .endAngle(d => d.endAngle);

    //Background
    g.append("path").style("fill", "#888")
    .datum({
      innerRadius,
      outerRadius,
      startAngle,
      endAngle
    })
    .attr("d", basicArc);

    //Foreground
    g.append("path")
      .style(
        "fill", fillColor)
      .datum({
        innerRadius,
        outerRadius,
        startAngle: startAngle,
        endAngle: startAngle + currentAngle
      })
      .attr("d", basicArc);

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("y", -(radius / 25))
      .attr("fill", "white")
      .text(currentValue);

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("x", -(outerRadius + innerRadius) / 2)
      .attr("style", smallFont)
      .attr("y", Math.max(radius / 15, 8))
      .attr("fill", "white")
      .text(min);
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("x", (outerRadius + innerRadius) / 2)
      .attr("y", Math.max(radius / 15, 8))
      .attr("style", smallFont)
      .attr("fill", "white")
      .text(max);
  });

  return (
    <>
      {title}
      <br />
      <svg id={id} ref={gaugeRef} />
    </>
  );
}

export default Gauge;

// NOTE: This React control is based on work in the di-controls-react repository by Quantellia (forked by OpenDI).
// See repo here: https://github.com/opendi-org/di-react-controls
// 
// Used under the MIT License. See license here: https://github.com/opendi-org/di-react-controls?tab=MIT-1-ov-file

// This control uses D3.js. View the D3 repo here: https://github.com/d3/d3?tab=ISC-1-ov-file#readme
// Used under the ISC license given on the D3 repository, copied here:
// Copyright 2010-2023 Mike Bostock
// Permission to use, copy, modify, and/or distribute this software for any purpose
// with or without fee is hereby granted, provided that the above copyright notice
// and this permission notice appear in all copies.
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
// REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
// OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
// TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
// THIS SOFTWARE.
//
// View the original D3 license here: https://github.com/d3/d3/blob/main/LICENSE