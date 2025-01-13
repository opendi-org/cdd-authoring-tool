//Holds functions for interacting with the OpenDI API
//TODO: This is incomplete! Add abstractions for more endpoints.

import { validate } from 'uuid'

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
}