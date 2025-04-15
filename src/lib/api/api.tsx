import { NoAPI } from "./noApi";

/**
 * All API implementations must provide this functionality.
 * @see NoAPI for the API-less implementation.
 */
export interface API {
    baseURL: string;
    fetchFullModel(uuid: string): any;
    saveModel(modelJSON: any): boolean;
    deleteModel(uuid: string): boolean;
    getModelMetas(): Array<any>;
}

/**
 * Handles logic for dynamically changing the API's base URI,
 * and for automatically falling back on an instance of NoAPI
 * when an API base URI is not provided
 */
export class APIHandler {
    apiInstance = new NoAPI();
    apiPath = "";
    updateApiPath = (newPath: string) =>
    {
        this.apiPath = newPath;
        if(this.apiPath !== "")
        {
            //Set up actual API
        }
        this.apiInstance = new NoAPI();
    }
}