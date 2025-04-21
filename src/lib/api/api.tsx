import { validate } from 'uuid'
import { NoAPI } from './noApi';

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
        throw new Error("Method not implemented.");
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