import React, { useState, useMemo, useEffect } from "react";
import Xarrow, { useXarrow, Xwrapper } from "react-xarrows";
import DiagramElement from "./DiagramElement";
import { evaluateModel } from "../../lib/Diagram/evaluateModel"
import { getIODataMap, getFunctionMap, getControlsMap, getDiagramElementMap, getDiaElemAssociatedDepsMap } from "../../lib/modelPreprocessing";
import { causalTypeColors } from "../../lib/Diagram/cddTypes";
import { getExpandedPathsForSelectedDiagramElements } from "../../lib/rightMenu/JSONEditorPathExpansion";
import ElementCRUDPanel from "../ElementCRUDPanel";
import ModelMetaInfoPanel from "./ModelMetaInfoPanel";

type CausalDecisionDiagramProps = {
    model: any;
    setModelJSON: Function;
    setExpandedPaths: Function;
    selectedDiagramIndex?: number;
    selectedRunnableModelIndices?: Array<number>;
}

/**
 * Renders an interactive simulation of a Causal Decision Diagram, constructing
 * it dynamically out of the given model JSON, using other components like DiagramElement.
 * Also allows editing via the ElementCrud panel. Will dynamically re-render the CDD whenever
 * the source JSON changes.
 */
const CausalDecisionDiagram: React.FC<CausalDecisionDiagramProps> = ({
    model,
    setModelJSON,
    setExpandedPaths,
    selectedDiagramIndex = 0,
    selectedRunnableModelIndices = [0],
}) => {

    //Re-draws dependency arrows between elements
    const updateXarrow = useXarrow();
    //Updates original JSON to change the position of a diagram element.
    //Called on drag end for the element's draggable wrapper.
    const handlePositionChange = (uuid: string, newPosition: any) => {
        setModelJSON((prevModel: any) => {
            const newModel = structuredClone(prevModel);
            const diagramElement = newModel.diagrams[selectedDiagramIndex].elements.find((e: any) => e.meta.uuid === uuid);
            if(diagramElement) {
                diagramElement.position = newPosition;
            }
            return newModel;
        })
    }

    //Evaluatable Assets: Import functions from their Base64-encoded string values
    const functionMap = useMemo(() => getFunctionMap(model), [model]);

    //InitialIOValues is IMMUTABLE.
    //Used to check whether incoming model JSON has an edited IO values list.
    //We can't let React check this itself because it just checks refs. This is a value comparison.
    const [initialIOValues, setInitialIOValues] = useState(() => getIODataMap(model));
    useEffect(() => {
        const incomingIOMap = getIODataMap(model);

        const didIOValuesChange = () => {
            if (incomingIOMap.size !== initialIOValues.size) return true;
            for (const [key, value] of incomingIOMap) {
                if (initialIOValues.get(key) !== value) return true;
            }
            return false;
        };

        if(didIOValuesChange())
        {
            setInitialIOValues(incomingIOMap);
            setIOValues(incomingIOMap);
        }
        else
        {
            //IO Values did not change. DO NOT update our local copies.
        }
    }, [model])

    //Store mutable copy of initial I/O values here. When these are updated,
    //evaluate the model and store the computed I/O values in computedIOValues
    const [IOValues, setIOValues] = useState(initialIOValues);

    //Update arrows when we get a new model JSON, in case positions were updated
    useEffect(() => {
        updateXarrow();
    }, [model])

    //Holds the results of evaluation runs.
    //Whenever I/O values or the underlying model (etc) change, re-evaluate the model.
    //Displays will prefer to use THIS I/O map when setting their current values.
    const computedIOValues = useMemo(() => {
        let computedValues: Map<string, any> = new Map<string, any>();
        computedValues = evaluateModel(model, functionMap, IOValues, selectedRunnableModelIndices);
        return computedValues;
    }, [model, functionMap, IOValues, selectedRunnableModelIndices]);

    //Maps diagram element UUIDs to their list of associated I/O values. Associated via their control.
    const controlsMap = useMemo(() => getControlsMap(model), [model]);

    //Maps diagram element UUIDs to their JSON information
    const diagramElementMap = useMemo(() => getDiagramElementMap(model, selectedDiagramIndex), [model, selectedDiagramIndex])

    //Maps element UUIDs to a set of information about all dependencies associated with that element.
    const elementAssociatedDependenciesMap = useMemo(() => getDiaElemAssociatedDepsMap(model, selectedDiagramIndex), [model, selectedDiagramIndex])

    //Holds a simple list of the UUIDs of selected elements, in the order they were selected.
    const [selectionBuffer, setSelectionBuffer] = useState(() => {let arr: string[] = []; return arr;});
    //This function simplifies, removing the need to supply the correct buffer
    const updateBuffer = (selectionUUID: string) => {
        setSelectionBuffer((prev: Array<string>) => 
            prev.includes(selectionUUID)
                ? prev.filter(idToCheck => idToCheck !== selectionUUID)
                : [...prev, selectionUUID]
        );
    }

    //Mirror graphical element selections in the JSON editor
    useEffect(() => {
        setExpandedPaths(
            getExpandedPathsForSelectedDiagramElements(selectionBuffer, model, elementAssociatedDependenciesMap, selectedDiagramIndex)
        );
    }, [selectionBuffer])

    //Filter now-nonexistant elements from the selection buffer
    //For when model changes come directly from JSON
    useEffect(() => {
        setSelectionBuffer((prev: Array<string>) => {
            const newBuffer = structuredClone(prev).filter(
                (selectedUUID: string) => {
                    return diagramElementMap.has(selectedUUID);
                }
            )
            return newBuffer;
        })
    }, [diagramElementMap])

    /**
     * Get style information for dependency arrows,
     * based on the dependency JSON and its place in the
     * selectionBuffer.
     * 
     * When only one element is selected, all dependencies
     * connected to the selected element are highlighted
     * and enlarged.
     * 
     * When multiple elements are selected, depenencies
     * that are connected to a selected element at BOTH
     * source and target are highlighted and enlarged.
     * Elements connected only at one end (source OR target)
     * are semi-highlighted, but normal sized.
     * 
     * Returns a simple object with properties:
     * - color: Holds a color hex code as a string
     * - size: Holds a stroke width as a number
     */
    const getDependencyStyle = (dep: any): any => {
        const sizeSelected = 3;
        const sizeDefault = 2;
        //Default color is based on causal type
        const colorDefault = causalTypeColors[diagramElementMap.get(dep.source).causalType] ?? causalTypeColors.Unknown;

        //Both source AND target are in the selection buffer
        const bothSelected = selectionBuffer.includes(dep.source) && selectionBuffer.includes(dep.target);
        //Either source OR target are in the selection buffer
        const eitherSelected = selectionBuffer.includes(dep.source) || selectionBuffer.includes(dep.target);

        if(selectionBuffer.length > 1)
        {
            return ({
                "color": (
                    bothSelected ? causalTypeColors.Highlighted
                    : eitherSelected ? causalTypeColors.SemiHighlighted
                    : colorDefault
                ),
                "size": bothSelected ? sizeSelected : sizeDefault,
            })
        }
        return ({
            "color": eitherSelected ? causalTypeColors.Highlighted : colorDefault,
            "size": eitherSelected ? sizeSelected : sizeDefault,
        });
    }

    //Generate HTML for dependency arrows
    const dependencyArrows = useMemo(() => {
        return (
            model.diagrams &&
            model.diagrams[selectedDiagramIndex] && 
            model.diagrams[selectedDiagramIndex].dependencies &&
            model.diagrams[selectedDiagramIndex].dependencies.map((dep: any) =>
                <Xarrow
                key={dep.meta.uuid}
                start={dep.source}
                end={dep.target}
                strokeWidth={getDependencyStyle(dep).size}
                curveness={0.4}
                color={getDependencyStyle(dep).color}
                />
        ))
    }, [model, selectionBuffer, selectedDiagramIndex]);

    //Generate HTML for diagram elements
    //Diagram elements wrap inner content in a consistent draggable outer shell
    const diagramElements = 
        model.diagrams &&
        model.diagrams[selectedDiagramIndex] && 
        model.diagrams[selectedDiagramIndex].elements && 
        model.diagrams[selectedDiagramIndex].elements.map((elem: any) => {
            return <DiagramElement
            key={elem.meta.uuid}
            elementData={elem}
            computedIOValues={computedIOValues}
            IOValues={IOValues}
            setIOValues={setIOValues}
            controlsMap={controlsMap}
            updateXarrow={updateXarrow}
            onPositionChange={handlePositionChange}
            selectionBuffer={selectionBuffer}
            updateElementSelection={updateBuffer}
            />
        });


    return (
        <div className="diagram-contents">
            {/*Transparent Div. Covers the whole diagram display Div. Catches click events UNIQUE to the graph background */}
            {/*Click events from diagram elements won't bubble up to this div, because it's a leaf in the DOM tree.*/}
            <div style={{width: "100%", height: "100%" }} onClick={() => (setSelectionBuffer([]))}></div>
            {/*Wrapper for Xarrows*/}
            <Xwrapper>
                {/*Absolute positioning forces diagram to be drawn over the above click-catching Div.*/}
                <div style={{position: "absolute", left: "0px", top: "0px"}}>
                    {/* Draw arrows BELOW element boxes */}
                    {dependencyArrows}
                    {diagramElements}
                </div>
            </Xwrapper>
            {/*Info box in the top-left for model name, etc.*/}
            <ModelMetaInfoPanel model={model} diagramIndex={selectedDiagramIndex}/>
            <ElementCRUDPanel
                setModelJSON={setModelJSON}
                selectedDiagramIndex={selectedDiagramIndex}
                selectionBuffer={selectionBuffer}
                setSelectionBuffer={setSelectionBuffer}
                diagramElementsMap={diagramElementMap}
                elementAssociatedDependenciesMap={elementAssociatedDependenciesMap}
            />
        </div>
        
        
    );

}

export default CausalDecisionDiagram;