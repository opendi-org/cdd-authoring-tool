// A stubbier version of the API class, for use with the static version of the site available at https://opendi.org/cdd-authoring-tool/
// Index uses config.js and a simple dependency injection pattern to decide between this class and the "true" API class, defined in api.js

import builtinModelJson from "../schema_compliant_cdd.json"  assert {type: 'json'}

export class StaticAPI {
    static DefaultBaseURL = ""
    static StaticErrorMessage = "Error: Authoring tool is configured for Static deployment, and cannot make API calls to save, load, update, or delete any models."

    constructor(baseURL = StaticAPI.DefaultBaseURL) {
        this.baseURL = baseURL;
    }

    async fetchFullModel(uuid)
    {
        return builtinModelJson;
    }

    async updateModel(modelJSON)
    {
        confirm("Update " + StaticAPI.StaticErrorMessage);
    }

    async saveNewModel(modelJSON)
    {
        confirm(StaticAPI.StaticErrorMessage);
    }
}