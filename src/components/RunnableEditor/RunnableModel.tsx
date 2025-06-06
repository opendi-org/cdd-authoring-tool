import React from "react";
import { cleanComponentDisplay } from "../../lib/cleanupNames";
import "./RunnableModel.css"
import ReactMarkdown from "react-markdown";
import { addIOToEvalElement, moveIOsInEvalElement, removeIOFromEvalElement } from "../../lib/runnableCRUD";

type RunnableModelProps = {
    model: any;
    setModel: Function;
    activeModelIndex?: number;
    ioMap: Map<string, any>;
    selectedIOValues: Array<string>;
    generateIOToggleFunction: Function;
}

const RunnableModel: React.FC<RunnableModelProps> = ({
    model,
    setModel,
    activeModelIndex,
    ioMap,
    selectedIOValues,
    generateIOToggleFunction,
}) => {
    if(activeModelIndex === undefined) activeModelIndex = 0;
    if(!(model.runnableModels && model.runnableModels[activeModelIndex])) return null;
    const thisModel = model.runnableModels[activeModelIndex];

    const getElementInputsList = (element: any) => {
        let inputCount = 0;
        return element.inputs && element.inputs.map((inputID: string) => {
            const thisIOVal = ioMap.get(inputID);
            const thisInputIdx = inputCount;
            inputCount++;
            return <div className={`model-option ${thisInputIdx % 2 == 1 ? "odd-entry" : ""}`}>
                <label>{cleanComponentDisplay(thisIOVal.meta, "I/O Value")}</label>
                <div>
                    <button
                        onClick={() => {setModel(moveIOsInEvalElement(model, thisIOVal.meta.uuid, element.meta.uuid, activeModelIndex, -1, true))}}
                    >
                        ↑
                    </button>
                    <button
                        onClick={() => {setModel(moveIOsInEvalElement(model, thisIOVal.meta.uuid, element.meta.uuid, activeModelIndex, 1, true))}}
                    >
                        ↓
                    </button>
                </div>
                <input type="checkbox" checked={selectedIOValues.includes(thisIOVal.meta.uuid)} onChange={generateIOToggleFunction(thisIOVal.meta.uuid)}></input>
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
                    <button
                        onClick={() => {setModel(moveIOsInEvalElement(model, thisIOVal.meta.uuid, element.meta.uuid, activeModelIndex, -1, false))}}
                    >
                        ↑
                    </button>
                    <button
                        onClick={() => {setModel(moveIOsInEvalElement(model, thisIOVal.meta.uuid, element.meta.uuid, activeModelIndex, 1, false))}}
                    >
                        ↓
                    </button>
                </div>
                <input type="checkbox" checked={selectedIOValues.includes(thisIOVal.meta.uuid)} onChange={generateIOToggleFunction(thisIOVal.meta.uuid)}></input>
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
                    {runnableElement.meta.summary && (<div className="eval-element-summary">
                        <ReactMarkdown children={runnableElement.meta.summary}/>
                    </div>)}
                </div>)}
                <div className="eval-io">
                    <div className="eval-io-list">
                        <h4>Inputs</h4>
                        <div className="model-options-list">
                            {getElementInputsList(runnableElement)}
                        </div>
                        <div>
                            <button
                                onClick={() => setModel(addIOToEvalElement(
                                    model,
                                    selectedIOValues,
                                    runnableElement.meta.uuid,
                                    activeModelIndex,
                                    true
                                ))}
                            >
                                Add Selected I/O
                            </button>
                            <button
                                onClick={() => setModel(removeIOFromEvalElement(
                                    model,
                                    selectedIOValues,
                                    runnableElement.meta.uuid,
                                    activeModelIndex,
                                    true
                                ))}
                            >
                                Remove Selected I/O
                            </button>
                        </div>
                    </div>
                    <div className="eval-io-list">
                        <h4>Outputs</h4>
                        <div className="model-options-list">
                            {getElementOutputsList(runnableElement)}
                        </div>
                        <div>
                            <button
                                onClick={() => setModel(addIOToEvalElement(
                                    model,
                                    selectedIOValues,
                                    runnableElement.meta.uuid,
                                    activeModelIndex,
                                    false
                                ))}
                            >
                                Add Selected I/O
                            </button>
                            <button
                                onClick={() => setModel(removeIOFromEvalElement(
                                    model,
                                    selectedIOValues,
                                    runnableElement.meta.uuid,
                                    activeModelIndex,
                                    false
                                ))}
                            >
                                Remove Selected I/O
                            </button>
                        </div>
                    </div>
                </div>
                <div>
                    <button>Delete Element</button>
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
            <div>
                <button>Add New Evaluatable Element</button>
            </div>
        </div>
    )
}

export default RunnableModel