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


export class API implements APIInterface{
    baseURL = "";

    constructor(URL: string)
    {
        this.baseURL = URL;
    }

    async fetchFullModel(uuid: string): Promise<any>
    {
        if(!validate(uuid))
        {
            return {};
        }

        //Check if this model is built-in
        const builtInAPI = new NoAPI();
        const builtInList = await builtInAPI.getModelMetas();
        let modelIsBuiltIn = false;
        builtInList.forEach((meta: any) => {
            if(meta.uuid == uuid)
                modelIsBuiltIn = true;
        })

        if(modelIsBuiltIn)
        {
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

            //Check if model exists to determine "Save As" or "Save (overwrite)" behavior
            const existsResponse = await fetch(requestURL + "/" + String(uuid));
            let exists = false;
            if(existsResponse.ok)
            {
                const existsModelMeta = await existsResponse.json();
                exists = existsModelMeta?.uuid === uuid;
            }

            const method = exists ? 'PUT' : 'POST';
            const confirmMessage = exists ?
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

    async deleteModel(uuid: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

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