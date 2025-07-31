import Color from "color";
import * as d3 from "d3";
import { useEffect, useRef } from "react";

interface d3Interpolate {
  (t: number): string;
}

interface DialProps {
  title: string;
  radius?: number;
  values: any[];
  currentValue: any;
  setCurrentValue: (newValue: number | string) => void;
  d3ColorScheme?: d3Interpolate;
  reverseColorScheme?: boolean;
  stroke?: string;
  colorLuminosityThreshold?: number;
}

function Dial({
  currentValue,
  setCurrentValue,
  title,
  values,
  radius = 150,
  d3ColorScheme = d3.interpolateHslLong("darkblue", "skyblue"),
  reverseColorScheme = false,
  stroke = "white",
  colorLuminosityThreshold = 0.2,
}: DialProps) {
  const dialRef = useRef(null);

  // dimensional values
  const width = radius;
  const height = radius / 2;
  const innerRadius = Math.min(width, height) / 1.8;
  const outerRadius = Math.min(width, height);

  // start and end angles for the whole dial
  const startAngle = -Math.PI / 1.3;
  const endAngle = Math.PI / 1.3;
  const angleOffset = (1 / values.length) * (endAngle - startAngle);
  const currentAngle =
    startAngle +
    angleOffset * (values.indexOf(currentValue as never) + 1) -
    angleOffset / 2;

  // misc other variables
  const smallFont = `font: ${Math.max(radius / 15, 8)}px sans-serif;`;
  const color = d3
    .scaleOrdinal()
    .domain(values.map((d) => d.toString()))
    .range(d3.quantize((t) => d3ColorScheme(t), values.length));


  const clamp = (num: number, min: number, max: number) => {
    return Math.min(Math.max(num, min), max);
  }

  useEffect(() => {
    // create the svg with the necessary dimensions and styling
    const svg = d3
      .select(dialRef.current)
      .attr("width", width)
      .attr("height", height * 1.75)
      .attr("viewBox", [-(width * 1.1) / 2, -height / 1.6, width * 1.1, height])
      // text styling for fonts
      .attr(
        "style",
        `max-width: 100%; height: auto; font: ${Math.max(
          radius / 6,
          20
        )}px sans-serif;`
      );
    svg.selectAll("g").remove();
    const g = svg.append("g");
    
    const basicArc = d3
      .arc()
      .innerRadius(d => d.innerRadius)
      .outerRadius(d => d.outerRadius)
      .startAngle(d => d.startAngle)
      .endAngle(d => d.endAngle);

    // these populate the svg with the arcs that we generated
    g.append("path").style("fill", "#ddd")
    .datum({
        innerRadius,
        outerRadius,
        startAngle,
        endAngle
    })
    .attr("d", basicArc); // background arc filled grey

    let currentStartAngle = startAngle;
    values.forEach((value, index) => {
      const title = value.toString();
      const currentEndAngle = currentStartAngle + angleOffset;
      const foregroundArc = d3
        .arc()
        .innerRadius(Math.min(width, height) / 1.8)
        .outerRadius(Math.min(width, height))
        .startAngle(currentStartAngle)
        .endAngle(currentEndAngle);

      const sectionColor = color(
        (reverseColorScheme ? values.length - index : index + 1).toString()
      ) as string;

      g.append("path")
        .style("fill", sectionColor)
        .datum({
            innerRadius: Math.min(width, height) / 1.8,
            outerRadius: Math.min(width, height),
            startAngle: currentStartAngle,
            endAngle: currentEndAngle
        })
        .attr("d", basicArc);
      g.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", (d) => `translate(${foregroundArc.centroid(d as d3.DefaultArcObject)})`)
        .call(
          (text) =>
            text
              .append("tspan")
              .attr("y", "+0.4em")
              .attr("font-weight", "bold")
              .attr("style", smallFont)
              .attr("fill", () =>
                Color(sectionColor).luminosity() < colorLuminosityThreshold
                  ? "white"
                  : "black"
              )
              .text(title) // set the actual text to the name in the data from our data object
        );
      currentStartAngle += angleOffset;
    });

    // delete any previously rendered handles
    svg.selectAll("circle").remove();

    // render the current handle
    svg
      .append("circle")
      .attr("cy", -innerRadius * Math.cos(currentAngle))
      .attr("cx", innerRadius * Math.sin(currentAngle))
      .attr("r", radius / 20)
      .attr(
        "fill",
        color(
          (reverseColorScheme
            ? values.length - values.indexOf(currentValue as never)
            : values.indexOf(currentValue as never)
          ).toString()
        ) as string
      )
      .attr("stroke", stroke)
      .call(
        (
          circle // onDrag function
        ) =>
          circle.call(
            // @ts-expect-error jank typing built into d3
            d3.drag().on("drag", (e) => {
              const mouseAngle = Math.atan(e.x / e.y); // calculate the angle of the mouse's position

              // this block just converts our mouseAngle into a useable value from 0 to 2Pi since the default atan() acts on Pi / 2 instead
              let mouseAngle360 =
                mouseAngle > 0 ? Math.PI - mouseAngle : Math.abs(mouseAngle);
              mouseAngle360 =
                e.x < 0 ? -Math.PI + mouseAngle360 : mouseAngle360;
              setCurrentValue(
                values[
                  clamp(
                    Math.floor(mouseAngle360 / angleOffset) +
                      Math.ceil(values.length / 2),
                    0,
                    values.length - 1
                  )
                ]
              );
            })
          )
      );

    //Current value
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("y", "+0.2em")
      .attr("fill", "white")
      .text(currentValue);
  }, [
    angleOffset,
    color,
    currentAngle,
    currentValue,
    endAngle,
    height,
    innerRadius,
    outerRadius,
    radius,
    reverseColorScheme,
    setCurrentValue,
    smallFont,
    startAngle,
    stroke,
    title,
    values,
    width,
  ]);

  return <svg ref={dialRef} />;
}

export default Dial;

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