/**
 * Maps causal type strings to hex colors, for styling
 * diagram elements and dependency arrows.
 */
export const causalTypeColors: Record<string, string> = {
    Lever: "#3946fae5",
    Intermediate: "#0c9188e5",
    Outcome: "#ad3e9de5",
    External: "#125c26e5",
    Unknown: "#7a7a7ae5",
    Highlighted: "#ffffff",
    SemiHighlighted: "#eaeaea",
}

/**
 * Role of an element within a dependency.
 * It's either listed as the source or the target
 * of the dependency.
 */
export enum DependencyRole {
    source = "source",
    target = "target",
}

/**
 * For elementAssociatedDependenciesMap.
 * uuid: UUID of the dependency associated with an element in the map.
 * role: Role of the element within the dependency it's associated with.
 * otherElement: UUID of the other element involved in the dependency.
 */
export type AssociatedDependencyData = {
    uuid: string;
    role: DependencyRole;
    otherElement: string;
}