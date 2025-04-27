/**
 * Functions in this file are for taking raw JSON data and 
 * constructing nicely-formatted "clean" displayable strings
 * from names, UUIDs, etc.
 */

/**
 * Generate a display-friendly preview string of the given UUID, capped at the given length.
 * @param uuid UUID string used for preview
 * @param previewLength Length of UUID preview. Preview will be the first [previewLength] characters of the UUID.
 * @returns Display-friendly preview string of a UUID, capped at the given length
 */
export function cleanUUIDPreview(uuid: string, previewLength = 5): string {
    if(uuid.length < previewLength) return "-----";
    return `${String(uuid).substring(0, previewLength)}`;
}

/**
 * Generate a display-friendly string for the component's name. Defaults to Unnamed [componentTypeLabel],
 * or Unnamed Component if no type label provided.
 * @param name Original JSON data for this component's name
 * @param componentTypeLabel The type of this component, used for unnamed components when name is null
 * @returns Display-friendly string of a component's name, or [Unnamed Component]
 */
export function cleanComponentName(name: string | null, componentTypeLabel = "Component")
{
    return `${name || `Unnamed ${componentTypeLabel}`}`;
}

/**
 * Generates a display-friendly string based on this component's meta object.
 * If componentMeta is null, defaults to Unnamed Component - -----
 * @param componentMeta Original JSON data for this component's meta information
 * @param componentTypeLabel The type of this component, used in @see cleanComponentName
 * @param uuidPreviewLength Length of UUID preview, used in @see cleanUUIDPreview
 * @returns Display-friendly string of a component's basic meta information: Name and UUID
 */
export function cleanComponentDisplay(componentMeta: any, componentTypeLabel = "Component", uuidPreviewLength = 5)
{
    const uuidPreview = cleanUUIDPreview(String(componentMeta.uuid), uuidPreviewLength);
    const name = cleanComponentName(componentMeta.name, componentTypeLabel);
    return `${name} - ${uuidPreview}`;
}

/**
 * Clean up display type label from the original camelCase of the
 * display type registry to Title Case with other adjustments.
 * @param originalName Original display name from the display type record
 * @returns Cleaned up selection option title for the display type
 */
export function cleanDisplayTypeName(originalName: string) {
    //Convert string from camelCase to Title Format
    return originalName
    .replace(/([A-Z])/g, ' $1') //Adds a space before each capital letter
    .replace(/^./, s => s.toUpperCase()) //Capitalizes the first character in the string
    .replace(/^Control/, 'Ctrl:'); //Shorten common prefix
}