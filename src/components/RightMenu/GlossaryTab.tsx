import React from "react";

/**
 * Provides definitions of CDD terminology
 * @returns Glossary Tab component for the help menu
 */
const GlossaryTab: React.FC = () => {
    return (
        <>
            <h2><a target="_blank" rel="noopener noreferrer" href="https://opendi.org/OpenDI%20Glossary#lever">Lever</a></h2>
            <p>Represents an <a target="_blank" rel="noopener noreferrer" href="https://opendi.org/OpenDI%20Glossary#action">Action</a> directly within the decision maker's control.</p>
            <h2><a target="_blank" rel="noopener noreferrer" href="https://opendi.org/OpenDI%20Glossary/#intermediate">Intermediate</a></h2>
            <p>Consequence of the decision maker's actions which impact the outcomes of the decision.</p>
            <h2><a target="_blank" rel="noopener noreferrer" href="https://opendi.org/OpenDI%20Glossary/#outcome">Outcome</a></h2>
            <p>A result of a decision the decision maker is interested in measuring.</p>
            <h2><a target="_blank" rel="noopener noreferrer" href="https://opendi.org/OpenDI%20Glossary/#external">External</a></h2>
            <p>Represents something outside the decision maker's control that have an impact on outcomes, either directly or indirectly.</p>
        </>
    )
};

export default GlossaryTab;