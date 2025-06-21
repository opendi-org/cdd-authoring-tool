import React, { useEffect, useMemo, useState } from "react";
import { cleanComponentDisplay } from "../../lib/cleanupNames";
import RunnableModel from "./RunnableModel";
import './RunnableModelEditor.css';
import ReactMarkdown from "react-markdown";

import Editor from "@monaco-editor/react"
import { getActiveIOValues, getEvaluatableAssetMap, getIOMap } from "../../lib/modelPreprocessing";
import { addControlToModel, addDisplayToControl, addIOsToControl, addIOToModel, addScriptToModel, deleteControl, deleteDisplayFromControl, deleteEvaluatableAssetFromModel, deleteIOFromModel, moveIOsInControl, removeIOsFromControl, updateScript } from "../../lib/RunnableModelEditor/runnableCRUD";
import { undefinedIOJSON } from "../../lib/defaultJSON";
import { getExpandedPathForControl, getExpandedPathForEvaluatableAsset, getExpandedPathsForSelectedIOValues } from "../../lib/rightMenu/JSONEditorPathExpansion";
import { RIGHT_MENU_TABS } from "../../lib/rightMenu/menuTabIDs";

type RunnableModelEditorProps = {
    model: any;
    setModel: Function;
    selectedRunnableModelIndices: Array<number>;
    selectedDiagramIndex: number;
    setExpandedPaths: Function;
    setActiveRightMenuTab: Function;
    setMenuIsOpen: Function;
}

const RunnableModelEditor: React.FC<RunnableModelEditorProps> = ({
    model,
    setModel,
    selectedRunnableModelIndices,
    selectedDiagramIndex,
    setExpandedPaths: setExpandedJSONPaths,
    setActiveRightMenuTab,
    setMenuIsOpen: setRightMenuIsOpen,
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
        setExpandedJSONPaths(getExpandedPathsForSelectedIOValues(selectedIOValues, model, selectedRunnableModelIndices));
    }, [selectedIOValues])

    const expandNonIOComponentInJSON = (componentPath: string[]) =>
    {
        console.log(componentPath);
        if(componentPath.length > 0)
        {
            setRightMenuIsOpen("open");
            setActiveRightMenuTab(RIGHT_MENU_TABS.JSON);
            setExpandedJSONPaths([
                componentPath,
            ])
        }
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


    const evalAssetMap = useMemo(() => getEvaluatableAssetMap(model), [model]);
    const ioMap = useMemo(() => getIOMap(model), [model]);

    //These components will generate JSX for runnable models, including eval elements and I/O values
    const runnableModelsList = useMemo(() => {
        return selectedRunnableModelIndices.map((idx: number) => {
            return <RunnableModel
                key={`selected-runnable-panel-${idx}`}
                model={model}
                setModel={setModel}
                activeModelIndex={idx}
                ioMap={ioMap}
                evalAssetMap={evalAssetMap}
                selectedIOValues={selectedIOValues}
                generateIOToggleFunction={generateIOToggleFunction}
                expandNonIOComponentInJSON={expandNonIOComponentInJSON}
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
    const [editorEvalAssetUUID, setEditorEvalAssetUUID] = useState("");
    const evalAssetsList = useMemo(() => {
        const evalAssetListEntries = model.evaluatableAssets && model.evaluatableAssets.map((evalAsset: any) => {
            const openEditor = () => {
                setEditorCode(atob(evalAsset.content.script));
                setEditorEvalAssetUUID(evalAsset.meta.uuid);
            }
            return (
                <div key={evalAsset.meta.uuid} className="eval-asset-info">
                    <h3>{cleanComponentDisplay(evalAsset.meta, "Evaluatable Asset")} <button className="json-link" onClick={() => expandNonIOComponentInJSON(getExpandedPathForEvaluatableAsset(evalAsset.meta?.uuid, model))}>(Reveal in JSON)</button></h3>
                    <p><b>Type: </b>{evalAsset.evalType}</p>
                    {evalAsset.meta.summary && <ReactMarkdown children={evalAsset.meta.summary}/>}
                    <div>
                        <button
                            onClick={openEditor}
                        >
                            {`Edit ${evalAsset.evalType}`}
                        </button>
                        <button
                            onClick={() => setModel(deleteEvaluatableAssetFromModel(model, evalAsset.meta))}
                        >
                            {`Delete ${evalAsset.evalType}`}
                        </button>
                    </div>
                </div>
            )
        });
        return evalAssetListEntries;
    }, [model]);
    const closeEditor = (save: boolean) => {
        if(save)
        {
            setModel(updateScript(model, editorEvalAssetUUID, btoa(editorCode)));
        }
        setEditorCode("");
    }

    //Generate JSX for model controls list
    const modelControlsList = useMemo(() => {
        const generateDisplaysOptionsForControl = (controlUUID: string) => {
            const options= [
                <option value={undefined} key={`option-control-${controlUUID}-display-none`}>(Pick)</option>
            ]

            const activeOptions: JSX.Element[] = [];
            const inactiveOptions: JSX.Element[] = [];
            const displaysAlreadyInList: Set<string> = new Set();

            let diagramIdx = 0;
            model.diagrams?.forEach((diagram: any) => {
                const thisDiaDisplays = [...(diagramDisplaysMap.get(diagram.meta?.uuid ?? "") ?? [])];
                thisDiaDisplays.forEach((displayUUID: string) => {
                    const displayInfo = displayIDMap.get(displayUUID);
                    const thisDisplayOption = <option value={displayUUID} key={`option-control${controlUUID}-display-${displayUUID}`}>{cleanComponentDisplay(displayInfo.meta, "Display")}</option>
                    if(!displaysAlreadyInList.has(displayUUID))
                    {
                        if(diagramIdx === selectedDiagramIndex) activeOptions.push(thisDisplayOption);
                        else inactiveOptions.push(thisDisplayOption);

                        displaysAlreadyInList.add(displayUUID);
                    }
                })
                diagramIdx++;
            })

            options.push(...[...activeOptions, ...inactiveOptions]);
            
            return (
                <select name="Display Options for Control" value={undefined} onChange={(event) => {
                    setModel(addDisplayToControl(model, controlUUID, event.target.value))
                }}>{options}</select>
            )
        }
        const getControlJSX = (control: any) => {
            const getControlIOList = () => {
                let IOCount = 0;
                const totalIOCount = [...(control.inputOutputValues ?? [])].length;
                return control.inputOutputValues && control.inputOutputValues.map((IOValueID: string) => {
                    const thisIOVal = ioMap.get(IOValueID) ?? undefinedIOJSON(IOValueID);
                    const thisIOValIdx = IOCount;
                    IOCount++;
                    return <div className={`model-option ${thisIOValIdx % 2 == 1 ? "odd-entry" : ""}`}>
                        <label>{cleanComponentDisplay(thisIOVal.meta, "I/O Value")}</label>
                        <div>
                            <button
                                onClick={() => {setModel(moveIOsInControl(model, thisIOVal.meta.uuid, control.meta.uuid, -1))}}
                                disabled={thisIOValIdx == 0}
                            >
                                ↑
                            </button>
                            <button
                                onClick={() => {setModel(moveIOsInControl(model, thisIOVal.meta.uuid, control.meta.uuid, 1))}}
                                disabled={thisIOValIdx == totalIOCount - 1}
                            >
                                ↓
                            </button>
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
                                <button
                                    onClick={() => setModel(deleteDisplayFromControl(model, control.meta.uuid, displayMeta.uuid))}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    )
                })
            };

            return (
                <div key={control.meta.uuid} className="control-info">
                    <h3>{cleanComponentDisplay(control.meta, "Control")} <button className="json-link" onClick={() => expandNonIOComponentInJSON(getExpandedPathForControl(control.meta?.uuid, model))}>(Reveal in JSON)</button> </h3>
                    <div className="control-hooks">
                        <div className="control-hooks-list">
                            <h4>Input/Output Values</h4>
                            <div className="model-options-list">
                                {getControlIOList()}
                            </div>
                            <div>
                                <button
                                    onClick={() => setModel(addIOsToControl(
                                        model,
                                        selectedIOValues,
                                        control.meta.uuid
                                    ))}
                                >
                                    Add Selected I/O
                                </button>
                                <button
                                    onClick={() => setModel(removeIOsFromControl(
                                        model,
                                        selectedIOValues,
                                        control.meta.uuid
                                    ))}
                                >
                                    Remove Selected I/O
                                </button>
                            </div>
                        </div>
                        <div className="control-hooks-list">
                            <h4>Displays</h4>
                            <div className="model-options-list">
                                {getControlDisplaysList()}
                            </div>
                            <div>
                                <p>
                                    Select a display to add it to control:
                                </p>
                                {generateDisplaysOptionsForControl(control.meta.uuid)}
                            </div>
                        </div>
                    </div>
                    <div>
                        <button
                            onClick={() => setModel(deleteControl(model, control.meta.uuid))}
                        >
                            Delete Control
                        </button>
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
                        <button
                            onClick={() => setModel(addIOToModel(model))}
                        >
                            Add New I/O
                        </button>
                        <button
                            onClick={() => {
                                    setModel(deleteIOFromModel(model, selectedIOValues));
                                    setSelectedIOValues([]);
                                }
                            }
                        >
                            Delete Selected I/O
                        </button>
                        <button onClick={() => setSelectedIOValues(new Array<string>())}>Clear I/O and JSON Selections</button>
                    </div>
                </div>
                <div className="editor-panel runnable-models">
                    <h2>Active Runnable Models</h2>
                    <div className="runnable-models">
                        {runnableModelsList}
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
                        <button
                            onClick={() => setModel(addScriptToModel(model))}
                        >
                            Add New Script
                        </button>
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
                        <button
                            onClick={() => setModel(addControlToModel(model))}
                        >
                            Add New Control
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RunnableModelEditor;