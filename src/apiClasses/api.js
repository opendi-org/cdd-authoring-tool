//Holds functions for interacting with the OpenDI API
//TODO: This is incomplete! Add abstractions for more endpoints.

import { validate } from 'uuid'
import { getValidator, generateReportStringFromValidationResults } from '../validation';
import * as fileIO from "../fileIO.js"

export class API {
    static DefaultBaseURL = "/api"  //Use the alias from the Docker Compose service name.
    
    constructor(baseURL = API.DefaultBaseURL) {
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
     * @returns Nothing
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
            return;
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
            if(!confirm(confirmMessage)) return;

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
            return;
        }
        catch (error) {
            alert(error);
            console.error(error);

            //Fallback option: Local download!
            if(confirm("Would you like to download the model as a .json file instead?"))
            {
                fileIO.downloadTextFile(JSON.stringify(modelJSON));
            }
        }
    }
}