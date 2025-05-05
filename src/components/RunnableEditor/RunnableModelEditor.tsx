import React, { useMemo, useState } from "react";
import { cleanComponentDisplay } from "../../lib/cleanupNames";
import RunnableModel from "./RunnableModel";
import './RunnableModelEditor.css';
import ReactMarkdown from "react-markdown";

type RunnableModelEditorProps = {
    model: any;
    setModel: Function;
    selectedRunnableModelIndices: Array<number>;
}

const RunnableModelEditor: React.FC<RunnableModelEditorProps> = ({
    model,
    setModel,
    selectedRunnableModelIndices,
}) => {

    const ioMap = useMemo(() => {
        let newMap = new Map<string, any>();
        if(model.inputOutputValues) model.inputOutputValues.forEach((ioVal: any) => {
            newMap.set(ioVal.meta.uuid, ioVal);
        });
        return newMap;
    }, [model]);

    const runnableModelsList = useMemo(() => {
        return selectedRunnableModelIndices.map((idx: number) => {
            return <RunnableModel key={`selected-runnable-panel-${idx}`} model={model} activeModelIndex={idx} ioMap={ioMap}/>
        })
    }, [model, selectedRunnableModelIndices]);

    const activeIOs = useMemo(() => {
        let activeIOs = new Set<string>();
        selectedRunnableModelIndices.forEach((idx: number) => {
            if(model.runnableModels[idx].elements) model.runnableModels[idx].elements.forEach((elem: any) => {
                if(elem.inputs) elem.inputs.forEach((input: string) => {
                    activeIOs.add(input);
                });
                if(elem.outputs) elem.outputs.forEach((output: string) => {
                    activeIOs.add(output);
                });
            })
        });
        return activeIOs;
    }, [model, selectedRunnableModelIndices]);

    const inputOutputList = useMemo(() => {
        let activeIOCount = 0;
        let inactiveIOCount = 0;
        let activeIOList: Array<JSX.Element> = [];
        let inactiveIOList: Array<JSX.Element> = [];
        model.inputOutputValues && model.inputOutputValues.forEach((ioValue: any) => {
            const ioMeta = ioValue.meta;
            const key = `io-value-${ioMeta.uuid}`;
            const ioLabel = cleanComponentDisplay(ioMeta, "I/O Value");
            const data = `${ioValue.data}`;

            const isActive = activeIOs.has(ioMeta.uuid);
            const thisIONumber = isActive ? activeIOCount : inactiveIOCount;
            isActive ? activeIOCount++ : inactiveIOCount++;
            const thisIOEntry = (
                <div key={key} className={`model-option ${thisIONumber % 2 == 1 ? "odd-entry" : ""}`}>
                    <label>{ioLabel}</label>
                    <div className="io-value-data">
                        Data: {data}
                    </div>
                    <input type="checkbox"></input>
                </div>
            )
            isActive ? activeIOList.push(thisIOEntry) : inactiveIOList.push(thisIOEntry);
        })
        return (
            <>
                <h3>Active Values</h3>
                {(activeIOList.length > 0 && (
                    <div className="model-options-list">
                        {activeIOList}
                    </div>
                )) || "(none)"}
                <h3>Inactive Values</h3>
                {(inactiveIOList.length > 0 && (
                    <div className="model-options-list">
                        {inactiveIOList}
                    </div>
                )) || "(none)"}
            </>
        )
    }, [activeIOs]);

    const evalAssetsList = useMemo(() => {
        const evalAssetListEntries = model.evaluatableAssets && model.evaluatableAssets.map((evalAsset: any) => {
            const codeMarkdown = () => {
                if(evalAsset.evalType !== "Script") return null;
                return `${"```"}${evalAsset.content.language}\n${atob(evalAsset.content.script)}\n${"```"}`;
            }
            return (
                <div key={evalAsset.meta.uuid} className="eval-asset-info">
                    <h3>{cleanComponentDisplay(evalAsset.meta, "Evaluatable Asset")}</h3>
                    <p><b>Type: </b>{evalAsset.evalType}</p>
                    {evalAsset.meta.summary && <ReactMarkdown children={evalAsset.meta.summary}/>}
                    <div className="eval-asset-code">
                        <ReactMarkdown children={codeMarkdown()} />
                    </div>
                    <div><button>Edit Script</button><button>Delete Script</button></div>
                </div>
            )
        });
        return evalAssetListEntries;
    }, [model]);

    const modelControlsList = useMemo(() => {
        const controlListEntries = model.controls && model.controls.map((control: any) => {
            const getControlIOList = () => {
                let IOCount = 0;
                return control.inputOutputValues && control.inputOutputValues.map((IOValueID: string) => {
                    const thisIOVal = ioMap.get(IOValueID);
                    const thisIOValIdx = IOCount;
                    IOCount++;
                    return <div className={`model-option ${thisIOValIdx % 2 == 1 ? "odd-entry" : ""}`}>
                        <label>{cleanComponentDisplay(thisIOVal.meta, "I/O Value")}</label>
                        <div>
                            <button>↑</button>
                            <button>↓</button>
                        </div>
                        <input type="checkbox"></input>
                    </div>
                })
            };

            return (
                <div key={control.meta.uuid} className="control-info">
                    <h3>{cleanComponentDisplay(control.meta, "Control")}</h3>
                    <div className="control-hooks">
                        <div className="control-hooks-list">
                            <h4>Input/Output Values</h4>
                            <div className="model-options-list">
                                {getControlIOList()}
                            </div>
                            <div>
                                <button>Add Selected</button>
                                <button>Remove Selected</button>
                            </div>
                        </div>
                        <div className="control-hooks-list">
                            <h4>Displays</h4>
                            <div className="model-options-list">

                            </div>
                        </div>
                    </div>
                </div>
            )
        });
        return controlListEntries;
    }, [model]);


    return (
        <div className={"runnable-model-editor"}>
            <div className="editor-row top">
                <div className="editor-panel io-values">
                    <h2>I/O Values</h2>
                    {inputOutputList}
                </div>
                <div className="editor-panel runnable-models">
                    <h2>Active Runnable Models</h2>
                    <div className="runnable-models">
                        {runnableModelsList}
                    </div>
                </div>
            </div>
            <div className="editor-row bottom">
                <div className="editor-panel eval-assets">
                    <h2>Evaluatable Assets</h2>
                    <div className="eval-assets-list">
                        {evalAssetsList}
                    </div>
                </div>
                <div className="editor-panel controls">
                    <h2>Model Controls</h2>
                    <div className="controls-list">
                        {modelControlsList}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RunnableModelEditor;