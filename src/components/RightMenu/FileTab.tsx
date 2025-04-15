import React, { useState } from "react";
import { downloadModel, getDisplayNameForModel } from "../../lib/api/fileIO";
import { APIHandler } from "../../lib/api/api";
import { v4 as uuidv4 } from "uuid";
import { NoAPI } from "../../lib/api/noApi";

type FileTabProps = {
    model: any;
    apiHandler: APIHandler;
    setModel: Function;
}

/**
 * Renders a File tab in the help menu. Contains UI elements
 * for model-level CRUD operations (new model, save model, load model, delete model),
 * and some UI elements for changing API settings.
 */
const FileTab: React.FC<FileTabProps> = ({
    model,
    apiHandler,
    setModel,
}) => {
    /**
     * Populate the list of models to load/delete in the File menu.
     * This list will contain all models retrieved via API call, followed by
     * all of the built-in models. Adds non-functional "header" options to separate
     * the API models from the built-ins. Built-in header is always present.
     * @returns List of <option> elements for all models available w/ the current API
     */
    const getModelOptions = () => {
        let options = [];
        //Header marking the API-retrieved models
        const apiHeaderOption = <option value={""} key={`option-models-api`}>===API MODELS===</option>
        //Header marking the built-in models
        const builtinHeaderOption = <option value={""} key={`option-models-builting`}>==BUILTIN MODELS==</option>
        //Shorthand for whether we'll actually retrieve any models from the API
        const noApiActive = apiHandler.apiInstance instanceof NoAPI;

        //Generates an <option> tag for a model based on its meta object
        const generateMetaOption = (meta: any) => {
            const label = getDisplayNameForModel({meta: meta});
            const value = meta.uuid;
            return <option value={value} key={`option-models-${label}`}>{label}</option>
        }

        //Add relevant header
        options.push(noApiActive ? builtinHeaderOption : apiHeaderOption);
        //Add API-retrieved options. If no api active, this will retrieve built-ins
        options = [...options, ...apiHandler.apiInstance.getModelMetas().map(
            generateMetaOption
        )]
        //If we had an API, we'll need to get the built-ins separately
        if(!noApiActive)
        {
            options.push(builtinHeaderOption);
            options = [...options, ...(new NoAPI().getModelMetas().map(
                generateMetaOption
            ))]
        }
        return options;
    }

    //Holds UUID of the model selected in the "Select a Model" dropdown
    const [selectedModel, setSelectedModel] = useState("")
    //Holds the contents of the "set base URL" text input box
    const [baseURL, setBaseURL] = useState("");

    //OnClick for "Load Model" button
    //Try to fetch selected model, and set it if fetched.
    const clickLoad = () => {
        const fetchedModel = apiHandler.apiInstance.fetchFullModel(selectedModel);
        if(fetchedModel)
        {
            setModel(fetchedModel);
        }
    }

    //OnClick for "Save As" button
    //Generate new UUID for model to save it as a new model
    const clickSaveAs = () => {
        let newModel = structuredClone(model);
        const newModelUUID = uuidv4();

        newModel.meta.uuid = newModelUUID;
        if(apiHandler.apiInstance.saveModel(newModel))
        {
            setModel(newModel);
        }
    }

    //OnClick for "Update Base URL" button
    const clickUpdateBaseURL = () => {
        apiHandler.updateApiPath(baseURL);
    }

    

    return (
        <div className="info-menu">
            <h2>File Settings</h2>
            <div>
                <button>New Model</button>Create a new model file, with an empty diagram.
            </div>
            <div>
                <button onClick={() => {apiHandler.apiInstance.saveModel(model)}}>
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
                <select name="Select a Model" value={selectedModel} onChange={(event) => {setSelectedModel(event.target.value)}}>
                    <option value={""}>Pick a model</option>
                    {getModelOptions()}
                </select>
                <button onClick={clickLoad}>Load Model</button>
                <button onClick={() => apiHandler.apiInstance.deleteModel(selectedModel)}>Delete Model</button>
            </div>
            <h2>API Settings</h2>
            <div>
                Base URL: <input type="text" value={baseURL} onChange={(event) => setBaseURL(event.target.value)}></input>
                <button onClick={clickUpdateBaseURL}>Update</button>
            </div>
        </div>
    )
};

export default FileTab;