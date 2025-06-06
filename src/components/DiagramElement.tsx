import React, { useMemo } from "react";
import DisplayTypeRegistry from "./DisplayTypeRegistry";
import DisplaysSection from "./DisplaysSection";
import Draggable from "react-draggable";
import { causalTypeColors } from "../lib/cddTypes";
import {v4 as uuidv4} from "uuid"
import { cleanComponentName } from "../lib/cleanupNames";

type DiagramElementProps = {
    elementData: any;
    computedIOValues: Map<string, any>;
    IOValues: Map<string, any>;
    setIOValues: React.Dispatch<React.SetStateAction<Map<string, any>>>;
    controlsMap: Map<string, string[]>;
    updateXarrow: () => void;
    onPositionChange: Function;
    selectionBuffer: string[];
    updateElementSelection: Function;
  };

/**
 * Renders an element of a Causal Decision Diagram.
 * These are draggable boxes with a few sections.
 * Top section displays the element name and Causal Type.
 * Below this are up to two sections of Displays (see DisplaySection.tsx)
 * First, non-interactive Displays are listed together.
 * Next, interactive Displays are listed together (sometimes collapsed by default).
 */
const DiagramElement: React.FC<DiagramElementProps> = ({
    elementData,
    computedIOValues,
    IOValues,
    setIOValues,
    controlsMap,
    updateXarrow,
    onPositionChange,
    selectionBuffer,
    updateElementSelection,
  }) => {

    //Tracks whether this element is in the selection buffer or not
    const isSelected = useMemo(() => {
      return selectionBuffer.includes(elementData.meta.uuid);
    }, [selectionBuffer]);

    //Passes a request to toggle my selection state up to the diagram's selection buffer
    const toggleMySelection = () => {
      updateElementSelection(elementData.meta.uuid, !isSelected);
    }

    //For consistent dynamic styling
    const selectedElementClass = "selected-diagram-element";

    // Header shows basic element info like Name and Causal Type.
    // Header is considered optional. If no causal type is provided, assume
    // this element is just a Display holder (for annotations and the like).
    let headerContent = <div></div>;
    if(elementData.causalType !== null)
    {
      headerContent = <div>
        <div style={{wordWrap: "break-word", width: "95%"}}>
          <label>{cleanComponentName(elementData.meta.name, "Element")}</label>
          <div style={{height:"5px"}}></div>
        </div>
      </div>
    }

    // Construct the causal type label.
    // This goes in the black draggable handle at the top of each element.
    // If causal type begins with "CUSTOM_", only render the portion after that prefix.
    // If causal type is null, this label will be null.
    const customPrefix = "CUSTOM_"
    let processedCausalTypeName = String(elementData.causalType).startsWith(customPrefix) ?
      String(elementData.causalType).slice(customPrefix.length) :
      String(elementData.causalType);
    let causalTypeLabel = (elementData.causalType &&
      <div className={"diagram-element-type-label"}>
        {processedCausalTypeName}
      </div>
    )

    // Construct Display sections
    let nonInteractiveDisplays = new Array<JSX.Element>();
    let displayContents = new Array<JSX.Element>();
    elementData.displays?.forEach((elemDisplay: any) => {
      let DisplayComponentType = DisplayTypeRegistry[elemDisplay.displayType ?? "unknown"];
      let styleClassName = elemDisplay.displayType ?? "unknown";
      if (!DisplayComponentType)
        {
          DisplayComponentType = DisplayTypeRegistry.unknown;
          styleClassName = "unknown";
        }

      const DisplayComponent = DisplayComponentType.component;
      const displayJSX = DisplayComponent && (
        <div className={`elem-display disp-${styleClassName}`}>
          <DisplayComponent
            key={elemDisplay.meta.uuid}
            displayJSON={elemDisplay}
            computedIOValues={computedIOValues}
            IOValues={IOValues}
            setIOValues={setIOValues}
            controlsMap={controlsMap}
          />
        </div>
      )

      if(elemDisplay.content.controlParameters?.isInteractive)
      {
        displayContents.push(displayJSX);
      }
      else
      {
        nonInteractiveDisplays.push(displayJSX);
      }
    });

    //Compose inner content from the two above components.
    //Inner content holds the header content and Display sections in a blue box
    let innerContent = (
      <div
        className={`diagram-element ${isSelected ? selectedElementClass : ""}`}
        style={{
          backgroundColor: causalTypeColors[elementData.causalType] ?? causalTypeColors.Unknown,
        }}
      >
        <div style={{margin:"0px", padding:"0px"}}>
          <div style={{
            padding:"5px",
          }}>
            {headerContent}
          </div>
          <DisplaysSection displays={nonInteractiveDisplays} expandByDefault={true}/>
          <DisplaysSection displays={displayContents} expandByDefault={["Lever", "External"].includes(elementData.causalType) && displayContents.length < 3}/>
        </div>
      </div>
    );
    
    //Construct draggable outer shell and put inner content inside
    return (
      <Draggable
        handle=".diagram-element-drag-handle"
        position={elementData.position}
        onDrag={updateXarrow}
        onStop={(_, data) => {
          onPositionChange?.(elementData.meta.uuid, {x: data.x, y: data.y})
        }}
        key={"draggable-" + elementData.meta.uuid}
      >
        {/*Draggable supports only one child element. Wrap children one div.*/}
        {/*This div holds the element UUID for Xarrows mapping.*/}
        <div
          id={elementData.meta.uuid}
          style= {{
            position: "absolute",
            margin:"0px",
            padding:"0px"
          }}
        >
          {/*Upper black handle for dragging the draggable element.*/}
          <div className={`diagram-element-top-bar ${isSelected ? selectedElementClass : ""}`}>
            <div 
              className={`diagram-element-drag-handle ${isSelected ? selectedElementClass : ""}`}
            >
              {causalTypeLabel}
            </div>
            <div className={"diagram-element-selector-checkbox"}>
                {(selectionBuffer.indexOf(elementData.meta.uuid) != -1) ? selectionBuffer.indexOf(elementData.meta.uuid) + 1 : null}
                <input type="checkbox" className="hoverable" onChange={toggleMySelection} checked={isSelected}></input>
            </div>
          </div>
          <div>
            {innerContent}
          </div>
        </div>
      </Draggable>
    )
  };

  /**
   * Generate schema-compliant JSON for a new diagram element
   * @param position Position of the new element
   * @returns JSON for a new diagram element, formatted for schema compliance
   */
  export function defaultDiagramElementJSON(
    position={ x: 100, y: 250 }
  ): any {
    return {
      meta: {
        uuid: uuidv4(),
        name: "New Element"
      },
      causalType: "CUSTOM_(No causal type)",
      position,
    };
  }

  export default DiagramElement;