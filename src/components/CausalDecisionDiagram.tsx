import React, { useState, useMemo, useEffect } from "react";
import Xarrow, { useXarrow, Xwrapper } from "react-xarrows";
import DiagramElement from "./DiagramElement";
import { evaluateModel } from "../lib/evaluateModel"
import { getIOMapFromModelJSON } from "../lib/getIOMapFromModelJSON";
import { causalTypeColors } from "../lib/causalTypeColors";

type CausalDecisionDiagramProps = {
    model: any;
    setModelJSON: Function;
}

const CausalDecisionDiagram: React.FC<CausalDecisionDiagramProps> = ({
    model,
    setModelJSON,
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
    //Currently only used to color dependency arrows based on their source element's causal type
    const diagramElementMap = useMemo(() => {
        const diaElems = new Map<string, any>();
        model.diagrams[0].elements.forEach((elem: any) => {
            diaElems.set(elem.meta.uuid, elem);
        })
        return diaElems;
    }, [model])

    //Generate HTML for dependency arrows
    const dependencyArrows = model.diagrams[0].dependencies.map((dep: any) => (
        <Xarrow
        key={dep.meta.uuid}
        start={dep.source}
        end={dep.target}
        strokeWidth={2}
        curveness={0.4}
        color={causalTypeColors[diagramElementMap.get(dep.source).causalType] ?? causalTypeColors.Unknown}
        />
    ))

    //Generate HTML for diagram elements
    //Diagram elements wrap inner content in a consistent draggable outer shell
    const diagramElements = model.diagrams[0].elements.map((elem: any) => {
        return <DiagramElement
        elementData={elem}
        computedIOValues={computedIOValues}
        IOValues={IOValues}
        setIOValues={setIOValues}
        controlsMap={controlsMap}
        updateXarrow={updateXarrow}
        onPositionChange={handlePositionChange}
        />
    })

    return (
        /*Wrapper for Xarrows*/
        <Xwrapper>
        <div style={{ fontFamily: "sans-serif"}}>
            {/* Draw arrows BELOW element boxes */}
            {dependencyArrows}
            {diagramElements}
        </div>
        </Xwrapper>
    );

}

export default CausalDecisionDiagram;