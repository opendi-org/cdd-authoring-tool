//Holds functions for interacting with the OpenDI API
//TODO: This is incomplete! Add abstractions for more endpoints.

import { validate } from 'uuid'
import { getValidator, generateReportStringFromValidationResults } from '../validation';
import * as fileIO from "../fileIO.js";
import {Config} from "../config.js";

export class API {
    
    constructor(baseURL = Config.apiBaseURI) {
        //In case the trailing slash accidentally made it in, remove it.
        if(baseURL.charAt(baseURL.length - 1) == '/')
        {
            baseURL = baseURL.substring(0, baseURL.length - 1);
        }

        this.baseURL = baseURL;
    }

    /**
     * Fetch the full model JSON associated with the given UUID from the API.
     * Returns the raw JSON if the UUID is associated with a model in the database.
     * If retrieval fails, returns empty JSON.
     * @param {string} uuid UUID used to construct model GET endpoint URI
     * @returns {JSON} Full model JSON for the given UUID, or empty JSON retrieval fails.
     */
    async fetchFullModel(uuid)
    {
        if(!validate(uuid))
        {
            return {};
        }

        try {
            const requestURL = this.baseURL + "/v0/models/" + String(uuid) + "/full"
            const response = await fetch(requestURL)
            if (!response.ok) {
                throw new Error("Failed to retrieve model.", response);
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
     * If it already exists, sends a PUT request. Checks for existing model based on the UUID. This
     * method requires that the model is valid according to the OpenDI JSON Schema before sending the request.
     * @param {JSON} modelJSON The complete JSON for the model to be saved
     * @returns {boolean} True if successfully saved, else false.
     */
    async saveModel(modelJSON)
    {
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
                throw new Error("Failed to save model, ", response);
            }
            return true;
        }
        catch (error) {
            alert(error);
            console.error(error);

            //Fallback option: Local download!
            if(confirm("Would you like to download the model as a .json file instead?"))
            {
                fileIO.downloadTextFile(JSON.stringify(modelJSON));
                return true;
            }
            return false;
        }
    }

    /**
     * Send an API request to delete the given model. Checks that the model exists before
     * attempting to delete.
     * @param {string} uuid UUID used to construct model DELETE endpoint URI
     * @returns {boolean} True if successfully deleted.
     */
    async deleteModel(uuid)
    {
        try {
            const requestURL = this.baseURL + "/v0/models/" + String(uuid)
            //Check if model exists
            const existsResponse = await fetch(requestURL);
            let exists = false;
            let existsModelMeta = {};
            if(existsResponse.ok)
            {
                existsModelMeta = await existsResponse.json();
                exists = existsModelMeta?.uuid === uuid;
            }

            const modelName = existsModelMeta?.name ?? "<unnamed>";

            if(!exists)
            {
                alert("Cannot delete model " + modelName + " (" + uuid + "): not found.");
                return false;
            }

            if(confirm("Deleting model " + modelName + "(" + uuid +").\nOK?"))
            {
                const response = await fetch(requestURL, {method: 'DELETE'})

                //API failure
                if(!response.ok) {
                    throw new Error("Failed to delete model, " , response);
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
     * @returns {JSON} Array of OpenDI Meta objects
     */
    async getModelMetas()
    {
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

        return {};
    }
}