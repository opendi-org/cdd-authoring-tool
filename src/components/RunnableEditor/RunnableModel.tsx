import React from "react";
import { cleanComponentDisplay } from "../../lib/cleanupNames";
import "./RunnableModel.css"

type RunnableModelProps = {
    model: any;
    activeModelIndex?: number;
}

const RunnableModel: React.FC<RunnableModelProps> = ({
    model,
    activeModelIndex,
}) => {
    if(activeModelIndex === undefined) activeModelIndex = 0;
    if(!(model.runnableModels && model.runnableModels[activeModelIndex])) return null;
    const thisModel = model.runnableModels[activeModelIndex];

    let ioMap = new Map<string, any>();
    if(model.inputOutputValues) model.inputOutputValues.forEach((ioVal: any) => {
        ioMap.set(ioVal.meta.uuid, ioVal);
    })

    const getElementInputsList = (element: any) => {
        let inputCount = 0;
        return element.inputs && element.inputs.map((inputID: string) => {
            const thisIOVal = ioMap.get(inputID);
            const thisInputIdx = inputCount;
            inputCount++;
            return <div className={`model-option ${thisInputIdx % 2 == 1 ? "odd-entry" : ""}`}>
                <label>{cleanComponentDisplay(thisIOVal.meta, "I/O Value")}</label>
                <div>
                    <button>↑</button>
                    <button>↓</button>
                </div>
                <input type="checkbox"></input>
            </div>
        })
    }

    const getElementOutputsList = (element: any) => {
        let outputCount = 0;
        return element.outputs && element.outputs.map((outputID: string) => {
            const thisIOVal = ioMap.get(outputID);
            const thisOutputIdx = outputCount;
            outputCount++;
            return <div className={`model-option ${thisOutputIdx % 2 == 1 ? "odd-entry" : ""}`}>
                <label>{cleanComponentDisplay(thisIOVal.meta, "I/O Value")}</label>
                <div>
                    <button>↑</button>
                    <button>↓</button>
                </div>
                <input type="checkbox"></input>
            </div>
        })
    }


    const evalElementsList = thisModel.elements.map((runnableElement: any) => {
        return (
            <div className="eval-element-info">
                <h3>{cleanComponentDisplay(runnableElement.meta, "Element")}</h3>
                {runnableElement.functionName && (<div>
                    <p>
                        <b>Function: </b>{runnableElement.functionName}
                    </p>
                </div>)}
                <div className="eval-io">
                    <div className="eval-io-list">
                        <h4>Inputs</h4>
                        <div className="model-options-list">
                            {getElementInputsList(runnableElement)}
                        </div>
                        <div>
                            <button>Add Selected</button>
                            <button>Remove selected</button>
                        </div>
                    </div>
                    <div className="eval-io-list">
                        <h4>Outputs</h4>
                        <div className="model-options-list">
                            {getElementOutputsList(runnableElement)}
                        </div>
                        <div>
                            <button>Add Selected</button>
                            <button>Remove selected</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    });

    return (
        <div className="runnable-model-info">
            <h3>{cleanComponentDisplay(thisModel.meta, "Runnable Model")}</h3>
            <div className="model-options-list">
                {evalElementsList}
            </div>
        </div>
    )
}

export default RunnableModel