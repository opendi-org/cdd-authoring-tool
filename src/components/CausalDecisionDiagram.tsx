import React, { useState, useMemo, useEffect } from "react";
import Xarrow, { useXarrow, Xwrapper } from "react-xarrows";
import DiagramElement from "./DiagramElement";
import { evaluateModel } from "../lib/evaluateModel"
import { getIOMapFromModelJSON } from "../lib/getIOMapFromModelJSON";
import { causalTypeColors } from "../lib/causalTypeColors";
import { updateElementSelection } from "../lib/updateElementSelection";
import { useCollapse } from "react-collapsed";
import { getExpandedPathsForSelectedElements } from "../lib/getExpandedPathsForSelectedElements";
import ElementCRUDPanel from "./ElementCRUDPanel";

type CausalDecisionDiagramProps = {
    model: any;
    setModelJSON: Function;
    setExpandedPaths: Function;
}

/**
 * Role of an element within a dependency.
 * It's either listed as the source or the target
 * of the dependency.
 */
export enum DependencyRole {
    source = "source",
    target = "target",
}

/**
 * For elementAssociatedDependenciesMap.
 * uuid: UUID of the dependency associated with an element in the map.
 * role: Role of the element within the dependency it's associated with.
 * otherElement: UUID of the other element involved in the dependency.
 */
export type AssociatedDependencyData = {
    uuid: string;
    role: DependencyRole;
    otherElement: string;
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
}) => {

    //Re-draws dependency arrows between elements
    const updateXarrow = useXarrow();
    //Updates original JSON to change the position of a diagram element.
    //Called on drag end for the element's draggable wrapper.
    const handlePositionChange = (uuid: string, newPosition: any) => {
        setModelJSON((prevModel: any) => {
            const newModel = structuredClone(prevModel);
            const diagramElement = newModel.diagrams[0].elements.find((e: any) => e.meta.uuid === uuid);
            if(diagramElement) {
                diagramElement.position = newPosition;
            }
            return newModel;
        })
    }

    //Evaluatable Assets: Import functions from their Base64-encoded string values
    const functionMap = useMemo(() => { //"<ScriptUUID>_<FunctionName>": function
        const funcMap = new Map();
        model.evaluatableAssets?.forEach((evalAsset: any) => {
            if(evalAsset.evalType == "Script" && evalAsset.content.language == "javascript")
            {
                const scriptString = atob(evalAsset.content.script);
                //scriptCode returns a function map with function names as keys and function code as values
                const scriptCode = eval(scriptString);
        
                const thisScriptFunctionMap = scriptCode.funcMap;
                Object.keys(thisScriptFunctionMap).forEach((funcName) => {
                    funcMap.set(`${evalAsset.meta.uuid}_${funcName}`, thisScriptFunctionMap[funcName])
                })
            }
        });
        return funcMap;
    }, [model]);

    //InitialIOValues is IMMUTABLE.
    //Used to check whether incoming model JSON has an edited IO values list.
    //We can't let React check this itself because it just checks refs. This is a value comparison.
    const [initialIOValues, setInitialIOValues] = useState(() => getIOMapFromModelJSON(model));
    useEffect(() => {
        const incomingIOMap = getIOMapFromModelJSON(model);

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
        return evaluateModel(model, functionMap, IOValues);
    }, [model, functionMap, IOValues]);

    //Maps diagram element UUIDs to their list of associated I/O values. Associated via their control.
    const controlsMap = useMemo(() => {
        const controls = new Map<string, Array<string>>();
        model.controls?.forEach((control: any) => {
            control.displays.forEach((displayUUID: any) => {
                if(!controls.has(displayUUID)) {
                    controls.set(displayUUID, control.inputOutputValues);
                }
                else
                {
                    console.error(
                        `Error: Multiple Control elements found for Diagram Element ${displayUUID}.`,
                        `Engine will only use the first control processed for this element. Ignoring control: `,
                        control,
                        ` - This element has these associated I/O values: `,
                        controls.get(displayUUID)
                    )
                }
            });
        });
        return controls;
    }, [model]);

    //Maps diagram element UUIDs to their JSON information
    const diagramElementMap = useMemo(() => {
        const diaElems = new Map<string, any>();
        model.diagrams[0].elements.forEach((elem: any) => {
            diaElems.set(elem.meta.uuid, elem);
        })
        return diaElems;
    }, [model])

    //Maps element UUIDs to a set of information about all dependencies associated with that element.
    //"Associated" means that the dia elem is either a "source" or "target" for the dependency.
    //AssociatedDependencyData contains dep UUID, the key element's role in the dep, and UUID of
    //the other element involved in the dependency, whether source or target
    const elementAssociatedDependenciesMap = useMemo(() => {
        const elemAssociatedDeps = new Map<string, Set<AssociatedDependencyData>>();
        const addEntry = (elemUUID: string, depUUID: string, role: DependencyRole, otherElemUUID: string) => {
            let currentDeps = elemAssociatedDeps.get(elemUUID) ?? new Set<AssociatedDependencyData>();
            currentDeps.add({uuid: depUUID, role: role, otherElement: otherElemUUID});
            elemAssociatedDeps.set(elemUUID, currentDeps);
        }
        model.diagrams[0]?.dependencies.forEach((dep: any) => {
            addEntry(dep.source, dep.meta.uuid, DependencyRole.source, dep.target);
            addEntry(dep.target, dep.meta.uuid, DependencyRole.target, dep.source);
        })

        return elemAssociatedDeps;
    }, [model])

    //Holds a simple list of the UUIDs of selected elements, in the order they were selected.
    const [selectionBuffer, setSelectionBuffer] = useState(() => {let arr: string[] = []; return arr;});
    //Updating is handled by lib/updateElementSelection.ts
    //This function simplifies, removing the need to supply the correct buffer
    const updateBuffer = (selectionUUID: string, select = true) => {
        setSelectionBuffer(updateElementSelection(selectionBuffer, selectionUUID, select));
    }

    //Mirror graphical element selections in the JSON editor
    useEffect(() => {
        setExpandedPaths(
            getExpandedPathsForSelectedElements(selectionBuffer, model, elementAssociatedDependenciesMap)
        );
    }, [selectionBuffer])

    //Generate HTML for dependency arrows
    const dependencyArrows = useMemo(() => {
        return (
            model.diagrams[0].dependencies.map((dep: any) =>
                <Xarrow
                key={dep.meta.uuid}
                start={dep.source}
                end={dep.target}
                strokeWidth={2}
                curveness={0.4}
                color={
                    ((selectionBuffer.includes(dep.source) || selectionBuffer.includes(dep.target)) ? causalTypeColors.Selected : null) ??
                    causalTypeColors[diagramElementMap.get(dep.source).causalType] ?? 
                    causalTypeColors.Unknown}
                />
        ))
    }, [model, selectionBuffer]);

    //Generate HTML for diagram elements
    //Diagram elements wrap inner content in a consistent draggable outer shell
    const diagramElements = 
        model.diagrams[0].elements.map((elem: any) => {
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

    //State and props for expanding/collapsing the summary in the meta info box (top left)
    const [summaryIsExpanded, setSummaryIsExpanded] = useState(false);
    const {getCollapseProps: getSummaryCollapseProps, getToggleProps: getSummaryToggleProps} = useCollapse({isExpanded: summaryIsExpanded})

    //Generate HTML for the meta info box
    //This hovers in the top-left of the diagram window
    //Currently shows model name, diagram name, and summary.
    //Does not break if any of those are missing.
    const modelMetaInfo = (
        <div className="diagram-meta">
            <b><u>{model.meta.name || "(Unnamed Model)"}</u></b><br/>{model.diagrams[0].meta.name || "(Unnamed Diagram)"}
            {model.meta.summary && (
                <>
                <div
                    className="diagram-meta-summary"
                    {...getSummaryToggleProps({ onClick: () => setSummaryIsExpanded((prev) => !prev) })}
                >
                    {summaryIsExpanded ? "(Hide summary)" : "(Show summary)"}
                </div><div {...getSummaryCollapseProps()}>{model.meta.summary}</div>
                </>
            )}
        </div>
    )

    return (
        <div className="diagram-contents">
            {/*Transparent Div. Covers the whole diagram display Div. Catches click events UNIQUE to the graph background */}
            {/*Click events from diagram elements won't bubble up to this div, because it's a leaf in the DOM tree.*/}
            <div style={{width: "100%", height: "100%" }} onClick={() => (setSelectionBuffer(updateElementSelection(selectionBuffer, null)))}></div>
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
            {modelMetaInfo}
            <ElementCRUDPanel
                setModelJSON={setModelJSON}
                selectionBuffer={selectionBuffer}
                setSelectionBuffer={setSelectionBuffer}
                diagramElementsMap={diagramElementMap}
                elementAssociatedDependenciesMap={elementAssociatedDependenciesMap}
            />
        </div>
        
        
    );

}

export default CausalDecisionDiagram;