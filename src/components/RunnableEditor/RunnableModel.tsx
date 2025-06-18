import React, { useMemo } from "react";
import { cleanComponentDisplay } from "../../lib/cleanupNames";
import "./RunnableModel.css"
import ReactMarkdown from "react-markdown";
import { addIOToEvalElement, addNewEvaluatableElement, deleteEvaluatableElement, moveIOsInEvalElement, removeIOFromEvalElement, updateEvalAssetUsedByRunnableElement, updateFunctionNameUsedByRunnableElement } from "../../lib/RunnableModelEditor/runnableCRUD";
import { undefinedIOJSON } from "../../lib/defaultJSON";
import { getEvaluatableAssetFunctionNamesMap } from "../../lib/modelPreprocessing";

type RunnableModelProps = {
    model: any;
    setModel: Function;
    activeModelIndex?: number;
    ioMap: Map<string, any>;
    evalAssetMap: Map<string, any>;
    selectedIOValues: Array<string>;
    generateIOToggleFunction: Function;
}

const RunnableModel: React.FC<RunnableModelProps> = ({
    model,
    setModel,
    activeModelIndex,
    ioMap,
    evalAssetMap,
    selectedIOValues,
    generateIOToggleFunction,
}) => {
    if(activeModelIndex === undefined) activeModelIndex = 0;
    if(!(model.runnableModels && model.runnableModels[activeModelIndex])) return null;
    const thisModel = model.runnableModels[activeModelIndex];

    const getElementInputsList = (element: any) => {
        let inputCount = 0;
        const totalInputCount = (element.inputs ?? []).length;
        return element.inputs && element.inputs.map((inputID: string) => {
            const thisIOVal = ioMap.get(inputID) ?? undefinedIOJSON(inputID);
            const thisInputIdx = inputCount;
            inputCount++;
            return <div className={`model-option ${thisInputIdx % 2 == 1 ? "odd-entry" : ""}`}>
                <label>{cleanComponentDisplay(thisIOVal.meta, "I/O Value")}</label>
                <div>
                    <button
                        onClick={() => {setModel(moveIOsInEvalElement(model, thisIOVal.meta.uuid, element.meta.uuid, activeModelIndex, -1, true))}}
                        disabled={thisInputIdx == 0}
                    >
                        ↑
                    </button>
                    <button
                        onClick={() => {setModel(moveIOsInEvalElement(model, thisIOVal.meta.uuid, element.meta.uuid, activeModelIndex, 1, true))}}
                        disabled={thisInputIdx == totalInputCount - 1}
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
            const thisIOVal = ioMap.get(outputID) ?? undefinedIOJSON(outputID);
            const thisOutputIdx = outputCount;
            const totalOutputCount = (element.outputs ?? []).length;
            outputCount++;
            return <div className={`model-option ${thisOutputIdx % 2 == 1 ? "odd-entry" : ""}`}>
                <label>{cleanComponentDisplay(thisIOVal.meta, "I/O Value")}</label>
                <div>
                    <button
                        onClick={() => {setModel(moveIOsInEvalElement(model, thisIOVal.meta.uuid, element.meta.uuid, activeModelIndex, -1, false))}}
                        disabled={thisOutputIdx == 0}
                    >
                        ↑
                    </button>
                    <button
                        onClick={() => {setModel(moveIOsInEvalElement(model, thisIOVal.meta.uuid, element.meta.uuid, activeModelIndex, 1, false))}}
                        disabled={thisOutputIdx == totalOutputCount - 1}
                    >
                        ↓
                    </button>
                </div>
                <input type="checkbox" checked={selectedIOValues.includes(thisIOVal.meta.uuid)} onChange={generateIOToggleFunction(thisIOVal.meta.uuid)}></input>
            </div>
        })
    }

    //TODO: This runs eval() on each asset's script, which may be expensive for large scripts.
    //Would be good to restructure the app a bit so that we only re-run eval() on scripts when absolutely
    //necessary, preferably at the App.tsx level, then pass results in to the runnable editor and the decision
    //simulation logic in evaluateModel.tsx (and wherever else it's needed)
    //
    //For now, though, this works fine for all the models I've tested.
    const evalAssetsFunctionNamesMap = useMemo(() => getEvaluatableAssetFunctionNamesMap(model), [model]);

    const generateEvalAssetsOptionsForElement = (elemUUID: string, selected: string) =>
    {
        const options = [
            <option value={undefined} key={`option-eval-${elemUUID}-none`}>(Pick)</option>
        ]

        evalAssetMap.forEach((evalAsset: any, evalAssetUUID: string) => {
            options.push(
                <option value={evalAssetUUID} key={`option-eval-${elemUUID}-${evalAssetUUID}`}>{cleanComponentDisplay(evalAsset.meta, "Evaluatable Asset")}</option>
            )
        })

        return (
            <select name="Evaluatable Asset Used" value={selected} onChange={(event) => {
                setModel(updateEvalAssetUsedByRunnableElement(model, activeModelIndex, elemUUID, event.target.value))
            }}>{options}</select>
        )
    }
    const generateFunctionNameOptionsForElement = (elemUUID: string, selectedEvalUUID: string, selectedFunction: string) =>
    {
        const options = [
            <option value={undefined} key={`option-function-${elemUUID}-none`}>(Pick)</option>
        ]

        evalAssetsFunctionNamesMap.get(selectedEvalUUID)?.forEach((functionName: string) => {
            options.push(
                <option value={functionName} key={`option-function-${elemUUID}-${functionName}`}>{functionName}</option>
            )
        })

        return (
            <select name="Function Used" value={selectedFunction} onChange={(event) => {
                setModel(updateFunctionNameUsedByRunnableElement(model, activeModelIndex, elemUUID, event.target.value))
            }}>{options}</select>
        )
    }


    const evalElementsList = thisModel.elements.map((runnableElement: any) => {
        return (
            <div className="eval-element-info">
                <h3>{cleanComponentDisplay(runnableElement.meta, "Element")}</h3>
                <div>
                    <p>
                        <b>Evaluatable Asset Used: </b>{generateEvalAssetsOptionsForElement(runnableElement.meta.uuid, runnableElement.evaluatableAsset)}
                    </p>
                    <p>
                        <b>Function: </b>{generateFunctionNameOptionsForElement(runnableElement.meta.uuid, runnableElement.evaluatableAsset, runnableElement.functionName)}
                    </p>
                    {runnableElement.meta.summary && (<div className="eval-element-summary">
                        <ReactMarkdown children={runnableElement.meta.summary}/>
                    </div>)}
                </div>
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
                    <button
                        onClick={() => setModel(deleteEvaluatableElement(model, runnableElement.meta.uuid, activeModelIndex))}
                    >
                        Delete Element
                    </button>
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
                <button
                    onClick={() => setModel(addNewEvaluatableElement(model, activeModelIndex))}
                >
                    Add New Evaluatable Element
                </button>
            </div>
        </div>
    )
}

export default RunnableModel