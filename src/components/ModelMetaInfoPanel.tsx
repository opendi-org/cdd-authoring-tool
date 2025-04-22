import React, { useState } from "react";
import { useCollapse } from "react-collapsed";
import ReactMarkdown from "react-markdown";

type ModelMetaInfoPanelProps = {
    model: any;
    diagramIndex: number;
}

/**
 * Provides meta information about the model, in a small panel.
 * This hovers in the top-left of the diagram window.
 * Should not break if any of its display info is missing.
 * 
 * @returns Meta Info panel for the CDM
 */
const ModelMetaInfoPanel: React.FC<ModelMetaInfoPanelProps> = ({
    model,
    diagramIndex,
}) => {
    //State and props for expanding/collapsing the summary in the meta info box (top left)
    const [summaryIsExpanded, setSummaryIsExpanded] = useState(false);
    const {getCollapseProps: getSummaryCollapseProps, getToggleProps: getSummaryToggleProps} = useCollapse({isExpanded: summaryIsExpanded})
    
    const meta = model.meta ?? {name: null, summary: null};
    const diagramMeta = ((model.diagrams && model.diagrams[diagramIndex]) && model.diagrams[diagramIndex].meta)
        ?? {name: null, summary: null};

    const modelName = meta.name || "(Unnamed Model)";
    const diagramName = diagramMeta.name || "(Unnamed Diagram)";
    const summaryFromMarkdown = meta.summary && <ReactMarkdown children={meta.summary}/>;


    return (
        <div className="diagram-meta">
            <b><u>{modelName}</u></b><br/>
            {diagramName}
            {meta.summary && (
                <>
                <div
                    className="diagram-meta-summary"
                    {...getSummaryToggleProps({ onClick: () => setSummaryIsExpanded((prev) => !prev) })}
                >
                    {summaryIsExpanded ? "(Hide summary)" : "(Show summary)"}
                </div><div {...getSummaryCollapseProps()}>{summaryFromMarkdown}</div>
                </>
            )}
        </div>
    )
}

export default ModelMetaInfoPanel;