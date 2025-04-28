import { APIInterface } from "./api";
import { BuiltInModels } from "../../model_json/builtin-examples/builtinModels";
import { downloadModel } from "./modelCRUD";

/**
 * API-less implementation of the API interface.
 * Loads all built-in models. Provides fallbacks or warnings/notifications
 * where relevant for operations that aren't supported without a "real"
 * API. Save operations fall back on download functionality.
 */
export class NoAPI implements APIInterface {
  //API-less functionality uses NO base URL
  baseURL = "";

  /**
   * Get the full JSON object for the requested model.
   * If the model is not in the API database, returns null.
   * In this case, returns null if the model is not built-in.
   * @param uuid UUID of model to fetch
   * @returns Full JSON object for the requested model
   */
  async fetchFullModel(uuid: string): Promise<any> {
    const modelRecord = BuiltInModels[uuid];
    if (!modelRecord) {
      console.warn(`No model found with UUID: ${uuid}`);
      return null;
    }
    return modelRecord.fullModel;
  }

  /**
   * Saves the given model object within the API database.
   * In this case, there is no database, so falls back on
   * download functionality.
   * @param modelJSON Full JSON object of the model to save
   * @returns Boolean representing success/failure to save model
   */
  async saveModel(modelJSON: any): Promise<boolean> {
    if(confirm(
      "Saving is disabled in No-API mode. Would you like to download the JSON instead?"
    ))
    {
      downloadModel(modelJSON);
      return true;
    }
    console.warn("Saving is not supported in No-API mode.");
    return false;
  }

  /**
   * Deletes the requested model from the API database.
   * In this case, there is no database, so the user is not 
   * allowed to try to delete the model.
   * @param _uuid UUID of the model to delete from the database
   * @returns Boolean representing success/failure to delete model
   */
  async deleteModel(_uuid: string): Promise<boolean> {
    console.warn("Deleting is not supported in No-API mode.");
    confirm("Deleting is disabled in No-API mode.");
    return false;
  }

  /**
   * Get an array of meta information for all models in the API database.
   * In this case, there is no database, so this returns meta
   * information for all built-in models.
   * @returns Array of the JSON objects for all models in the API database
   */
  async getModelMetas(): Promise<Array<any>> {
    return Object.values(BuiltInModels).map((record) => record.meta);
  }
}
