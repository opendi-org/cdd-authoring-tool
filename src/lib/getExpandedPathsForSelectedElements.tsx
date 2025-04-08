/**
 * Returns a list of JSON paths related to the selected diagram elements.
 * These paths will be expanded in the JSON editor. The last path in the list will be the scroll anchor.
 * Pass an empty selection buffer to revert JSON editor to default expanded state.
 * @param selectionBuffer List of UUIDs for selected diagram elements
 * @param model CDM JSON
 * @param associatedDependenciesMap Map from diagram element UUIDs to list of dependencies associated with that element
 * @returns List of JSON paths to expand related to the selected diagram elements
 */
export function getExpandedPathsForSelectedElements(
    selectionBuffer: Array<string>,
    model: any,
    associatedDependenciesMap: Map<string, Set<string>>
): Array<Array<string>> {

    if(selectionBuffer.length > 0)
    {
        const elemsList = model.diagrams[0]?.elements;
        const depsList = model.diagrams[0]?.dependencies;
        /**
         * Get array index of an element or dependency by its UUID.
         * svelte-jsoneditor uses array index for JSON path stuff.
         * 
         * @param {string} uuid UUID of element or dependency to find
         * @param {boolean} idIsDependency Whether to look for this UUID in the list of elements or dependencies
         * @returns {number} The array index of the given element/dependency
         */
        const findIdx = (uuid: string, idIsDependency = false) => {
            const listToSearch = idIsDependency ? depsList : elemsList;

            // Find UUID in list, get the index.
            for(let i = 0; i < listToSearch.length; i++)
            {
                if(listToSearch[i].meta.uuid === uuid)
                {
                    return i;
                }
            }
            return undefined;
        }

        let depsUUIDsToExpand = new Set<string>();

        let elemPathsToExpand = new Array<Array<string>>();
        let depsPathsToExpand = new Array<Array<string>>();

        //Find all dependencies associated with the selected elements
        //Construct JSON paths for the selected elements while we're at it
        selectionBuffer.forEach((elemUUID: string) => {
            //Path
            const elemIdx = findIdx(elemUUID, false);
            if(elemIdx !== undefined)
            {
                elemPathsToExpand.push(["diagrams", "0", "elements", elemIdx.toString()]);
            }

            //Associated dependencies
            const associatedDeps = associatedDependenciesMap.get(elemUUID);
            if(associatedDeps)
            {
                depsUUIDsToExpand = new Set<string>([...depsUUIDsToExpand, ...associatedDeps]);
            }
        })

        //Construct JSON paths for dependencies associated with the selected elements
        depsUUIDsToExpand.forEach((depUUID: string) => {
            const depIdx = findIdx(depUUID, true);
            if(depIdx !== undefined)
            {
                depsPathsToExpand.push(["diagrams", "0", "dependencies", depIdx.toString()]);
            }
        })
        return [
            ...depsPathsToExpand,
            ...elemPathsToExpand,
        ];
    }
    else //No selected elements, expand the default paths
    {
        let defaultPaths: Array<Array<string>> = []
        if(model.diagrams[0])
        {
            defaultPaths.push(["diagrams", "0"]);
        }
        defaultPaths.push(["meta"])
        return(defaultPaths);
    }
}