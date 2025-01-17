//Holds functions for interacting with the OpenDI API
//TODO: This is incomplete! Add abstractions for more endpoints.

import { validate } from 'uuid'
import { getValidator, generateReportStringFromValidationResults } from '../validation';

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
            console.error("Failed to retrieve model. ", error);
        }

        return {};
    }

    /**
     * Send an API request to update the given model. API attempts to update the model
     * based on its UUID. This method ensures the model is valid according to the OpenDI JSON
     * Schema before sending the request.
     * @param {JSON} modelJSON The complete JSON for the model to be updated
     * @returns Nothing
     */
    async updateModel(modelJSON)
    {
        //Validate model JSON
        const validationResults = getValidator()(modelJSON);
        const reportString = generateReportStringFromValidationResults(validationResults);
        if(reportString != "")
        {
            confirm("Failed to update model due to JSON Schema validation issues.\n" + reportString);
            console.error("Update fail: Schema validation.");
            console.error(validationResults);
            return;
        }

        //Send API call to UPDATE
        try {
            const requestURL = this.baseURL + "/v0/models"
            const response = await fetch(requestURL, {
                method: 'PUT',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify(modelJSON)
            });
            if(!response.ok) {
                throw new Error("Failed to update model,", response);
            }
            return;
        }
        catch (error) {
            console.error("Failed to update model. ", error);
        }
    }

}