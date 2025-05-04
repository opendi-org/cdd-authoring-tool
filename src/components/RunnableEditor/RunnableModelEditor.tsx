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

    const inputOutputList = useMemo(() => {
        let IOCount = 0;
        const ioListEntries = model.inputOutputValues && model.inputOutputValues.map((ioValue: any) => {
            const ioMeta = ioValue.meta;
            const key = `io-value-${ioMeta.uuid}`;
            const thisIONumber = IOCount;
            const ioLabel = cleanComponentDisplay(ioMeta, "I/O Value");
            const data = `${ioValue.data}`;

            IOCount++;
            return (
                <div key={key} className={`model-option ${thisIONumber % 2 == 1 ? "odd-entry" : ""}`}>
                    <label>{ioLabel}</label>
                    <div className="io-value-data">
                        Data: {data}
                    </div>
                    <input type="checkbox"></input>
                </div>
            )
        })
        return (
            <div className="model-options-list">
                {ioListEntries && ioListEntries}
            </div>
        )
    }, [model, selectedRunnableModelIndices]);

    const runnableModelsList = useMemo(() => {
        return selectedRunnableModelIndices.map((idx: number) => {
            return <RunnableModel key={`selected-runnable-panel-${idx}`} model={model} activeModelIndex={idx}/>
        })
    }, [model, selectedRunnableModelIndices]);

    const evalAssetsList = useMemo(() => {
        const evalAssetListEntries = model.evaluatableAssets && model.evaluatableAssets.map((evalAsset: any) => {
            const codeMarkdown = () => {
                if(evalAsset.evalType !== "Script") return null;
                return `${"```"}${evalAsset.content.language}\n${atob(evalAsset.content.script)}\n${"```"}`;
            }
            return (
                <div key={evalAsset.meta.uuid}>
                    <h3>{cleanComponentDisplay(evalAsset.meta, "Evaluatable Asset")}</h3>
                    <p><b>Type: </b>{evalAsset.evalType}</p>
                    {evalAsset.meta.summary && <ReactMarkdown children={evalAsset.meta.summary}/>}
                    <div>
                        <ReactMarkdown children={codeMarkdown()} />
                    </div>
                </div>
            )
        });
        return evalAssetListEntries;
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
                <div className="editor-panel">
                    {evalAssetsList}
                </div>
                <div className="editor-panel"></div>
            </div>
        </div>
    )
}

export default RunnableModelEditor;