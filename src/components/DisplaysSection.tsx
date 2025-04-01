import { useState } from "react";
import React from "react";
import { useCollapse } from "react-collapsed";

type DisplaysSectionProps = {
    displays: Array<JSX.Element>;
    expandByDefault: boolean;
};

/**
 * Construct a collapsible section with multiple Displays.
 * Displays are rendered in a simple vertical list.
 * Section expand/collapse state is handled by a wide "+" or "-" button.
 */
const DisplaysSection: React.FC<DisplaysSectionProps> = ({
    displays,
    expandByDefault = true,
}) => {
    // Needed for react-collapse setup
    const [isExpanded, setExpanded] = useState(expandByDefault);
    // These attach to the button (toggle props) and the collapsible section (collapse props)
    const {getCollapseProps, getToggleProps} = useCollapse({ isExpanded });

    // If we don't have displays, don't take up any vertical space.
    if (displays.length === 0) return <div style={{height: "0px"}}></div>

    return (
        <div>
            {/* (Center the toggle button) */}
            <div style={{ display: "flex", justifyContent: "center", margin: "0px" }}>
                <button
                    style={{
                        width: "100%",
                        fontSize: "8px",
                        borderRadius: "0px",
                        backgroundColor: "#000000AA",
                        color: "white",
                        border: "0px",
                        padding: "0px 0px",
                    }}
                    {...getToggleProps({
                        onClick: () => setExpanded((prev) => !prev),
                    })}
                >
                    {isExpanded ? "-" : "+"}
                </button>
            </div>
            <section {...getCollapseProps()}>
                <div style={{ padding: "5px", backgroundColor: "#0000004D" }}>
                    {displays}
                </div>
            </section>
        </div>
    )
};

export default DisplaysSection;