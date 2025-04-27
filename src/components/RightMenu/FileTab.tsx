import React, { useEffect, useState } from "react";
import { copyDiagramInModel, deleteDiagramFromModel, addDiagramToModel, downloadModel, getNewModel } from "../../lib/api/modelCRUD";
import { API, APIInterface } from "../../lib/api/api";
import { v4 as uuidv4 } from "uuid";
import { NoAPI } from "../../lib/api/noApi";
import { cleanComponentDisplay } from "../../lib/cleanupNames";

type FileTabProps = {
    model: any;
    setModel: Function;
    selectedDiagramIndex: number;
    setSelectedDiagramIndex: Function;
    apiInstance: APIInterface;
    setApiInstance: Function;
}

/**
 * Renders a File tab in the help menu. Contains UI elements
 * for model-level CRUD operations (new model, save model, load model, delete model),
 * and some UI elements for changing API settings.
 */
const FileTab: React.FC<FileTabProps> = ({
    model,
    setModel,
    selectedDiagramIndex,
    setSelectedDiagramIndex,
    apiInstance,
    setApiInstance,
}) => {

     // Options list for the "Pick a model" dropdown menu
    const [modelOptions, setModelOptions] = useState<JSX.Element[]>([]);

    /**
     * Generate new <option> elements for all available models,
     * via both the API (if relevant) and the built-in list
     */
    const generateOptions = async () => {
        let options: JSX.Element[] = [];
        //Header marking the API-retrieved models
        const apiHeaderOption = <option value={""} key={`option-models-api`}>===API MODELS===</option>
        //Header marking the built-in models
        const builtinHeaderOption = <option value={""} key={`option-models-builtin`}>==BUILTIN MODELS==</option>

        //Generates an <option> tag for a model based on its meta object
        const generateMetaOption = (meta: any) => {
            const label = cleanComponentDisplay(meta);
            const value = meta.uuid;
            return <option value={value} key={`option-models-${label}`}>{label}</option>
        }

        //Add options for a given array of model meta objects
        const addOptions = (modelMetas: Array<any>, useBuiltinsHeader: boolean) => {
            options.push(useBuiltinsHeader ? builtinHeaderOption : apiHeaderOption);
            options = [...options, ...(modelMetas.map(
                generateMetaOption
            ))]
        };

        const apiFetchedMetas = await apiInstance.getModelMetas();
        addOptions(apiFetchedMetas, apiInstance instanceof NoAPI);

        if(!(apiInstance instanceof NoAPI))
        {
            const noAPIMetas = await (new NoAPI()).getModelMetas();
            addOptions(noAPIMetas, true);
        }

        setModelOptions(options);
    }

    /**
     * Generate a list of Diagrams associated with the open model, and provide
     * some options for each.
     * @returns List of Diagrams associated with the open model
     */
    const generateModelDiagramList = () => {
        
        if(!model.diagrams) return null;

        let diagramIndex = 0;
        return model.diagrams.map((diagram: any) => {
            const diaMeta = diagram.meta;
            const diaLabel = cleanComponentDisplay(diaMeta, "Diagram");
            const thisDiagramIndex = diagramIndex;
            const isSelected = selectedDiagramIndex == thisDiagramIndex;

            const deleteClick = () => {
                setModel((prev: any) => {
                    if(confirm(`Deleting diagram ${diaLabel}\nOK?`))
                    {
                        return deleteDiagramFromModel(prev, thisDiagramIndex);
                    }
                    return prev;
                })
                if(selectedDiagramIndex >= thisDiagramIndex)
                {
                    const diagramIndexToSelect = model.diagrams[selectedDiagramIndex - 1] ? selectedDiagramIndex - 1 : 0;
                    setSelectedDiagramIndex(diagramIndexToSelect);    
                }
            }

            const openClick = () => {
                setSelectedDiagramIndex(thisDiagramIndex);
            }

            const copyClick = () => {
                setModel((prev: any) => {
                    return copyDiagramInModel(prev, thisDiagramIndex);
                });
            }
            diagramIndex++;

            const key = `model-dia-${diaMeta.uuid}`;
            return (
                <div key={key} className={`model-option ${thisDiagramIndex % 2 == 1 ? "odd-entry" : ""}`}>
                    <label>{diaLabel}</label>
                    <div>
                        <button onClick={openClick}>Open</button>
                        <button onClick={copyClick}>Make a Copy</button>
                        <button onClick={deleteClick}>Delete</button>
                        {isSelected && "(Opened)"}
                    </div>
                </div>
            )
        })
    }

    // When the API class instance changes, update the options
    // in the "Pick a model" dropdown menu
    useEffect(() => {
        generateOptions();
    }, [apiInstance]);

    // Always try to select the current model in the drop-down menu.
    // If this isn't a valid option, it will just show the
    // "Pick a model" option.
    useEffect(() => {
        setSelectedModel(model.meta?.uuid ?? "");
        generateModelDiagramList();
    }, [model]);

    //Holds UUID of the model selected in the "Select a Model" dropdown
    const [selectedModel, setSelectedModel] = useState(model.meta?.uuid ?? "")
    //Holds the contents of the "set base URL" text input box
    const [urlInput, setUrlInput] = useState("");

    //OnClick for "Load Model" button
    //Try to fetch selected model, and set it if fetched.
    const clickLoad = () => {
        const fetchModel = async () => {
            const fetchedModel = await apiInstance.fetchFullModel(selectedModel);
            if(fetchedModel !== null && fetchedModel.meta !== undefined)
            {
                setModel(fetchedModel);
            }
        }
        fetchModel();
    }

    //OnClick for "Save Model" button
    //Save new model and refresh model options
    const clickSave = async () => {
        if(await apiInstance.saveModel(model))
        {
            generateOptions();
        }
    }

    //OnClick for "Save As" button
    //Generate new UUID for model to save it as a new model
    const clickSaveAs = async () => {
        let newModel = structuredClone(model);
        const newModelUUID = uuidv4();

        newModel.meta.uuid = newModelUUID;
        if(await apiInstance.saveModel(newModel))
        {
            setModel(newModel);
            generateOptions();
        }
    }

    //OnClick for "Delete Model" button
    //If deletion is successful, replaces model display with an empty CDM
    const clickDelete = async () => {
        if(await apiInstance.deleteModel(selectedModel))
        {
            if(selectedModel == model.meta.uuid)
            {
                setModel(getNewModel());
            }
            generateOptions();
        }
    }

    //OnClick for "Update Base URL" button
    const clickUpdateBaseURL = () => {
        if(urlInput === "")
        {
            setApiInstance(new NoAPI());
        }
        else
        {
            setApiInstance(new API(urlInput));
        }
    }

    //OnClick for "New model" button
    const clickNewModel = () => {
        if(confirm("This will overwrite the current model.\nAre you sure?"))
        {
            const newModel = getNewModel();
            setModel(newModel);
        }
        
    }

    //OnClick for "Add Diagram" button
    const clickAddDiagram = () => {
        setModel((prev: any) => addDiagramToModel(prev));
    }

    

    return (
        <>
            <h2>File Settings</h2>
            <div>
                <button onClick={clickNewModel}>New Model</button>Create a new model file, with an empty diagram.
            </div>
            <div>
                <button onClick={clickSave}>
                    Save Model
                </button>
                <button onClick={clickSaveAs}>
                    Save as New
                </button>
                <button onClick={() => {downloadModel(model)}}>
                    Download JSON
                </button>
            </div>
            <div>
                <label>Pick a model:</label>
                <select name="Select a Model" value={selectedModel} onChange={(event) => {setSelectedModel(event.target.value)}}>
                    <option value={""}>Pick a model</option>
                    {modelOptions}
                </select>
                <button onClick={clickLoad}>Load Model</button>
                <button onClick={clickDelete}>Delete Model</button>
            </div>
            <h2>Model Settings</h2>
            <h3>Diagrams</h3>
            <div className="model-options-list">
                {generateModelDiagramList()}
            </div>
            <div>
                <button onClick={clickAddDiagram}>Add Diagram</button>
            </div>
            <h3>Runnable Models</h3>
            <div>
            </div>
            <h2>API Settings</h2>
            <div>
                Base URL: <input type="text" value={urlInput} onChange={(event) => setUrlInput(event.target.value)}></input>
                <button onClick={clickUpdateBaseURL}>Update</button>
            </div>
        </>
    )
};

export default FileTab;