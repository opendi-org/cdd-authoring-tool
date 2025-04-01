/**
 * Constructs an IO Value map out of the full JSON for a causal decision model.
 * Used by CausalDecisionDiagram.tsx
 * @param model Schema-compliant JSON for a causal decision model
 * @returns A map of IO Values, mapping UUID to the data stored in that IO Value
 */
export function getIOMapFromModelJSON(model: any): Map<string, any> {
    const values = new Map();
    model.inputOutputValues?.forEach((ioVal: any) => {
        values.set(ioVal.meta.uuid, ioVal.data);
    });
    return values;
}