// A stubbier version of the API class, for use with the static version of the site available at https://opendi.org/cdd-authoring-tool/
// Index uses config.js and a simple dependency injection pattern to decide between this class and the "true" API class, defined in api.js

import builtinModelJson from "../schema_compliant_cdd.json"  assert {type: 'json'}
import * as fileIO from "../fileIO.js"
import {Config} from "../config.js"

export class StaticAPI {

    constructor(baseURL = Config.apiBaseURI) {
        this.baseURL = baseURL;
    }

    async fetchFullModel(uuid)
    {
        return builtinModelJson;
    }

    async saveModel(modelJSON)
    {
        alert("NOTE: API disabled. The tool will initiate a download of the model's JSON file.")
        fileIO.downloadTextFile(JSON.stringify(modelJSON))
        return false; //Prevent the tool from refreshing and potentially losing the current model JSON
    }

    async deleteModel(uuid)
    {
        alert("NOTE: API disabled. There is no database to delete the model from.")
        return false;
    }

    async getModelMetas()
    {
        return [builtinModelJson.meta];
    }
}