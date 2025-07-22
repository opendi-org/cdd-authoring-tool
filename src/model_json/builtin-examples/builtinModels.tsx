import ExampleCoffee from  "./coffee.json" assert { type: "json" };
import ExampleCoffeeNonInteractive from "./coffee_noninteractive.json" assert { type: "json" };
import ExampleBasicAdder from "./basic_adder.json" assert { type: "json" };
import ExampleMultistepAdder from "./multistep_adder.json" assert { type: "json" };
import ExampleStringsBools from "./strings_bools.json" assert { type: "json" };
import ExampleStringsBoolsMultidisplay from "./strings_bools_multidisplays.json" assert { type: "json" };
import ExampleBarGraph2DArray from "./Bar_Graph_Demo_2D_Array.json" assert { type: "json" };
import ExampleBarGraphDynamicCategories from "./Bar_Graph_Demo_Dynamic_Categories.json" assert { type: "json" };

/**
 * Holds info about built-in models. Stores model
 * meta object for ease of access alongside the full
 * JSON.
 */
export type BuiltInModelRecord = {
    meta: any;
    fullModel: any;
}

/**
 * A map of all the built-in model JSON info. To access
 * info about a model, retrieve from this Record by UUID.
 */
export const BuiltInModels: Record<string, BuiltInModelRecord> = {};
[
    ExampleCoffee,
    ExampleCoffeeNonInteractive,
    ExampleBasicAdder,
    ExampleMultistepAdder,
    ExampleStringsBools,
    ExampleStringsBoolsMultidisplay,
    ExampleBarGraph2DArray,
    ExampleBarGraphDynamicCategories,
].forEach((model) => {
    const uuid = model.meta?.uuid;
    if (uuid) {
        BuiltInModels[uuid] = {
            meta: model.meta,
            fullModel: model
        };
    } else {
        console.warn("Skipping model with missing UUID:", model);
    }
});