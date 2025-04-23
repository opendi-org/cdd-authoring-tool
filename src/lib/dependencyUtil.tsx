import { v4 as uuidv4 } from 'uuid';

/**
 * Generate schema-compliant JSON for a new dependency
 * @param sourceUUID UUID for this dependency's source Diagram Element
 * @param targetUUID UUID for this dependency's target Diagram Element
 * @param sourceName The name of this dependency's source Diagram Element
 * @param targetName The name of this dependency's target Diagram Element
 * @returns JSON for a new dependency, formatted for schema compliance
 */
export function defaultDependencyJSON(
  sourceUUID: string,
  targetUUID: string,
  sourceName: string = "Unnamed",
  targetName: string = "Unnamed"
): any {
  return {
    meta: {
      uuid: uuidv4(),
      name: `${sourceName} --> ${targetName}`,
    },
    source: sourceUUID,
    target: targetUUID,
  };
}
