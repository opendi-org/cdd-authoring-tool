import { validate } from 'uuid'
import { NoAPI } from './noApi';
import { generateReportStringFromValidationResults, getValidator } from '../validation';
import { downloadModel } from './fileIO';

/**
 * All API implementations must provide this functionality.
 * @see NoAPI for the API-less implementation.
 */
export interface APIInterface {
    baseURL: string;
    fetchFullModel(uuid: string): Promise<any>;
    saveModel(modelJSON: any): Promise<boolean>;
    deleteModel(uuid: string): Promise<boolean>;
    getModelMetas(): Promise<Array<any>>;
}  

/**
 * 
 * @param uuid UUID to check for in the builtin list
 * @returns Whether the model with the given UUID is a built-in model
 */
export async function modelIsBuiltIn(uuid: string): Promise<boolean> {
    const builtInAPI = new NoAPI();
    const builtInList = await builtInAPI.getModelMetas();
    let modelIsBuiltIn = false;
    builtInList.forEach((meta: any) => {
        if(meta.uuid == uuid)
            modelIsBuiltIn = true;
    })
    return modelIsBuiltIn;
}


export class API implements APIInterface{
    baseURL = "";

    constructor(URL: string)
    {
        this.baseURL = URL;
    }

    /**
     * Fetch the full model JSON associated with the given UUID from the API.
     * Returns the raw JSON if the UUID is associated with a model in the database.
     * If retrieval fails, returns empty JSON.
     * @param uuid UUID used to construct model GET endpoint
     * @returns Full model JSON for the given UUID, or empty JSON if retrieval fails
     */
    async fetchFullModel(uuid: string): Promise<any>
    {
        if(!validate(uuid))
        {
            return {};
        }

        const isBuiltIn = await modelIsBuiltIn(uuid);

        if(isBuiltIn)
        {
            const builtInAPI = new NoAPI();
            return await builtInAPI.fetchFullModel(uuid);
        }

        try {
            const requestURL = this.baseURL + `/v0/models/${String(uuid)}/full`
            const response = await fetch(requestURL)
            if (!response.ok) {
                console.error(response);
                throw new Error(`Failed to retrieve model.`);
            }
            return response.json();
        }
        catch (error) {
            alert(error);
            console.error(error);
        }

        return {};
    }
    
    /**
     * Send an API request to save the given model. If this model has not been saved yet, sends a POST request.
     * If it already exists, sends a PUT request. Checks for existing model based on the UUID. This method
     * requires that the model be valid according to the OpenDI JSON Schema before sending the request.
     * 
     * For built-in models, this shows an error and requests the user re-generate UUIDs before saving.
     * (Or they can use a "Save as New" option)
     * @param modelJSON The complete JSON for the model to save
     * @returns True if successfully saved, else false
     */
    async saveModel(modelJSON: any): Promise<boolean> {
        //Validate model JSON
        const validationResults = getValidator()(modelJSON);
        const reportString = generateReportStringFromValidationResults(validationResults);
        if(reportString != "")
        {
            alert("Failed to save model due to JSON Schema validation issues.\n" + reportString);
            console.error("Save fail: Schema validation.");
            console.error(validationResults);
            return false;
        }

        try {
            const requestURL = this.baseURL + "/v0/models"
            const uuid = modelJSON.meta.uuid;

            let modelExistsBuiltIn = await modelIsBuiltIn(uuid);
            if(modelExistsBuiltIn)
            {
                confirm(`"Save Model" is disabled for built-in models. Please use "Save as New".`);
                return false;
            }

            //Check if model exists in the API DB to determine "Save As" or "Save (overwrite)" behavior
            let modelExistsInAPI = false;
            const existsResponse = await fetch(requestURL + "/" + String(uuid));
            if(existsResponse.ok)
            {
                const existsModelMeta = await existsResponse.json();
                modelExistsInAPI = existsModelMeta?.uuid === uuid;
            }

            const method = modelExistsInAPI ? 'PUT' : 'POST';
            const confirmMessage = modelExistsInAPI ?
                "Overwriting model " + uuid + ": " + (modelJSON.meta.name ?? "<unnamed>") + ".\nOK?" :
                "Saving new model " + uuid + ": " + (modelJSON.meta.name ?? "<unnamed>") + ".\nOK?";
            
            //Convey behavior to user, get confirmation
            if(!confirm(confirmMessage)) return false;

            //Save via the API, either PUT or POST
            const response = await fetch(requestURL, {
                method: method,
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify(modelJSON)
            });

            //API failure
            if(!response.ok) {
                console.error(response);
                throw new Error("Failed to save model");
            }
            return true;
        }
        catch (error) {
            alert(error);
            console.error(error);

            //Fallback option: Local download!
            if(confirm("Would you like to download the model as a .json file instead?"))
            {
                downloadModel(modelJSON);
                return true;
            }
            return false;
        }
    }

    /**
     * Send an API request to delete the requested model. Checks that the model exists
     * before attempting to delete.
     * @param uuid UUID used to construct model DELETE endpoint
     * @returns True if successfully deleted, else false
     */
    async deleteModel(uuid: string): Promise<boolean> {
        try {
            const requestURL = this.baseURL + "/v0/models/" + String(uuid)
            //Check if model exists
            const existsResponse = await fetch(requestURL);
            let exists = false;
            let existsModelMeta: any = {};
            if(existsResponse.ok)
            {
                existsModelMeta = await existsResponse.json();
                exists = existsModelMeta?.uuid === uuid;
            }

            const modelName = existsModelMeta?.name ?? "<unnamed>";

            if(!exists)
            {
                alert(`Cannot delete model (${uuid}): not found in API database.`);
                return false;
            }

            if(confirm("Deleting model " + modelName + "(" + uuid +").\nOK?"))
            {
                const response = await fetch(requestURL, {method: 'DELETE'})

                //API failure
                if(!response.ok) {
                    console.error(response);
                    throw new Error("Failed to delete model");
                }

                return true;
            }
            return false;

        } catch (error) {
            alert(error);
            console.error(error);
            return false;
        }
    }

    /**
     * Get a list of the Meta objects for the Causal Decision Models that the user
     * has access to.
     * @returns Array of OpenDI Meta objects
     */
    async getModelMetas(): Promise<Array<any>> {
        try {
            const requestURL = this.baseURL + "/v0/models";
            const response = await fetch(requestURL);
            if(!response.ok)
            {
                throw new Error("Failed to get model list.");
            }
            return response.json();

        } catch (error) {
            alert(error);
            console.error(error);
        }

        return [{}];
    }
}