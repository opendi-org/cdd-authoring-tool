import React, { useEffect, useMemo, useState } from "react";
import { cleanComponentDisplay } from "../../lib/cleanupNames";
import RunnableModel from "./RunnableModel";
import './RunnableModelEditor.css';
import ReactMarkdown from "react-markdown";

import Editor from "@monaco-editor/react"
import { getActiveIOValues, getIOMap } from "../../lib/modelPreprocessing";

type RunnableModelEditorProps = {
    model: any;
    setModel: Function;
    selectedRunnableModelIndices: Array<number>;
    selectedDiagramIndex: number;
}

const RunnableModelEditor: React.FC<RunnableModelEditorProps> = ({
    model,
    setModel,
    selectedRunnableModelIndices,
    selectedDiagramIndex,
}) => {

    let [displayIDMap, setDisplayIDMap] = useState(new Map<string, any>());
    let [diagramDisplaysMap, setDiagramDisplaysMap] = useState(new Map<string, Set<string>>());
    let [selectedIOValues, setSelectedIOValues] = useState(new Array<string>());
    const generateIOToggleFunction = (id: string) => {
        const toggleIOValue = () => {
            setSelectedIOValues((prev: Array<string>) => 
                prev.includes(id)
                    ? prev.filter(idToCheck => idToCheck !== id)
                    : [...prev, id]
            );
        }
        return toggleIOValue;
    }

    useEffect(() => {
        let newDisplayIDMap = new Map<string, any>();
        let newDiagramDisplaysMap = new Map<string, Set<string>>();

        if(model.diagrams) model.diagrams.forEach((diagram: any) => {
            const displaySetForThisDiagram = new Set<string>();
            if(diagram.elements) diagram.elements.forEach((diaElem: any) => {
                if(diaElem.displays) diaElem.displays.forEach((display: any) => {
                    newDisplayIDMap.set(display.meta.uuid, display);
                    displaySetForThisDiagram.add(display.meta.uuid);
                })
            })
            newDiagramDisplaysMap.set(diagram.meta.uuid, displaySetForThisDiagram);
        });

        setDisplayIDMap(newDisplayIDMap);
        setDiagramDisplaysMap(newDiagramDisplaysMap);

    }, [model]);

    const ioMap = useMemo(() => getIOMap(model), [model]);

    //These components will generate JSX for runnable models, including eval elements and I/O values
    const runnableModelsList = useMemo(() => {
        return selectedRunnableModelIndices.map((idx: number) => {
            return <RunnableModel
                key={`selected-runnable-panel-${idx}`}
                model={model}
                activeModelIndex={idx}
                ioMap={ioMap}
                selectedIOValues={selectedIOValues}
                generateIOToggleFunction={generateIOToggleFunction}
            />
        })
    }, [model, selectedRunnableModelIndices, selectedIOValues]);

    const activeIOs = useMemo(() => getActiveIOValues(model, selectedRunnableModelIndices), [model, selectedRunnableModelIndices]);

    //Generate JSX for input output list, with checkboxes etc.
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
                    <input type="checkbox" checked={selectedIOValues.includes(ioMeta.uuid)} onChange={generateIOToggleFunction(ioMeta.uuid)}></input>
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
    }, [activeIOs, selectedIOValues]);

    //Generate JSX for evaluatable assets list
    //These are scripts, API calls, etc. Currently only really works for scripts.
    const [editorCode, setEditorCode] = useState("");
    const evalAssetsList = useMemo(() => {
        const evalAssetListEntries = model.evaluatableAssets && model.evaluatableAssets.map((evalAsset: any) => {
            const openEditor = () => {
                setEditorCode(atob(evalAsset.content.script));
            }
            return (
                <div key={evalAsset.meta.uuid} className="eval-asset-info">
                    <h3>{cleanComponentDisplay(evalAsset.meta, "Evaluatable Asset")}</h3>
                    <p><b>Type: </b>{evalAsset.evalType}</p>
                    {evalAsset.meta.summary && <ReactMarkdown children={evalAsset.meta.summary}/>}
                    <div>
                        <button onClick={openEditor}>{`Edit ${evalAsset.evalType}`}</button>
                        <button>{`Delete ${evalAsset.evalType}`}</button>
                    </div>
                </div>
            )
        });
        return evalAssetListEntries;
    }, [model]);
    const closeEditor = (save: boolean) => {
        if(save)
        {
            alert("Not implemented.");
            return;
        }
        setEditorCode("");
    }

    //Generate JSX for model controls list
    const modelControlsList = useMemo(() => {
        const getControlJSX = (control: any) => {
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
                        <input type="checkbox" checked={selectedIOValues.includes(thisIOVal.meta.uuid)} onChange={generateIOToggleFunction(thisIOVal.meta.uuid)}></input>
                    </div>
                })
            };

            const getControlDisplaysList = () => {
                let displaysCount = 0;
                return control.displays && control.displays.map((displayID: string) => {
                    const thisDisplay = displayIDMap.get(displayID);
                    if(!thisDisplay) return;
                    const thisDisplayNumber = displaysCount;
                    const displayMeta = thisDisplay.meta;
                    const key = `control-display-${displayMeta.uuid}`;
                    const displayLabel = cleanComponentDisplay(displayMeta, "Display");

                    displaysCount++;
                    return (
                        <div key={key} className={`model-option ${thisDisplayNumber % 2 == 1 ? "odd-entry" : ""}`}>
                            <label>{displayLabel}</label>
                            <div>
                                <button>Remove</button>
                            </div>
                        </div>
                    )
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
                                <button>Add Selected I/O</button>
                                <button>Remove Selected I/O</button>
                            </div>
                        </div>
                        <div className="control-hooks-list">
                            <h4>Displays</h4>
                            <div className="model-options-list">
                                {getControlDisplaysList()}
                            </div>
                            <div>
                                <select>
                                    <option>Pick a Display...</option>
                                </select>
                                <button>Add to Control</button>
                            </div>
                        </div>
                    </div>
                    <div>
                        <button>Delete Control</button>
                    </div>
                </div>
            )
        };
        const activeControls = new Array<JSX.Element>();
        const otherControls = new Array<JSX.Element>();
        model.controls && model.controls.forEach((control: any) => {
            const controlJSX = getControlJSX(control);
            const controlHasDisplaysInActiveDiagram = control.displays && control.displays.filter(
                (uuid: string) => diagramDisplaysMap.get((model.diagrams[selectedDiagramIndex]?.meta?.uuid))?.has(uuid)
            ).length > 0;

            controlHasDisplaysInActiveDiagram ? activeControls.push(controlJSX) : otherControls.push(controlJSX);
        });

        return (
            <div>
                <div className="controls-list">
                    <h3>Controls used in Open Diagram</h3>
                    {activeControls}
                </div>
                <div className="controls-list">
                    <h3>Other Controls</h3>
                    {otherControls}
                </div>
            </div>
        )
    }, [displayIDMap, diagramDisplaysMap, selectedIOValues]);


    return (
        <div className={"runnable-model-editor"}>
            <div className="editor-row top">
                <div className="editor-panel io-values">
                    <h2>I/O Values</h2>
                    {inputOutputList}
                    <div>
                        <button>Add New I/O</button>
                        <button>Delete Selected I/O</button>
                        <button onClick={() => setSelectedIOValues(new Array<string>())}>Clear I/O Selection</button>
                    </div>
                </div>
                <div className="editor-panel runnable-models">
                    <h2>Active Runnable Models</h2>
                    <div className="runnable-models">
                        {runnableModelsList}
                    </div>
                    <div>
                        <button>Add New Model</button>
                    </div>
                </div>
            </div>
            <div className={`editor-row bottom ${editorCode != "" ? "code-editor-open" : ""}`}>
                <div className={`editor-panel eval-assets ${editorCode != "" ? "hidden" : ""}`}>
                    <h2>Evaluatable Assets</h2>
                    <div className="eval-assets-list">
                        {evalAssetsList}
                    </div>
                    <div>
                        <button>Add New Script</button>
                    </div>
                </div>
                {editorCode != "" && (
                    <div className="editor-panel code-editor">
                        <Editor
                            defaultLanguage="javascript"
                            defaultValue={editorCode}
                            onChange={(value) => {setEditorCode(value ?? "")}}
                            theme="vs-dark"
                        />
                        <div>
                            <button
                                onClick={() => closeEditor(true)}
                            >Save and Close</button>
                            <button
                                onClick={() => closeEditor(false)}
                            >Close Without Saving</button>
                        </div>
                    </div>
                )}
                <div className="editor-panel controls">
                    <h2>Model Controls</h2>
                    <div className="controls-list">
                        {modelControlsList}
                    </div>
                    <div>
                        <button>Add New Control</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RunnableModelEditor;