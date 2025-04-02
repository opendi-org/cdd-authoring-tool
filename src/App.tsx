import { useMemo, useState } from "react";
import rawModelJSON from "./model_json/coffee.json" assert { type: "json" };
import CausalDecisionDiagram from "./components/CausalDecisionDiagram";
import VanillaJSONEditor from "./components/VanillaJSONEditor";

function App() {
    // This is the single source of truth for Model JSON, used by both VanillaJSONEditor and CausalDecisionDiagram.
    const [modelJSON, setModelJSON] = useState(rawModelJSON);
    // Memoized copy of the above JSON for use in VanillaJSONEditor,
    // put in the Content type structure expected by VanillaJSONEditor
    const content = useMemo(() => {
        return {
            json: modelJSON,
            text: undefined
        }
    }, [modelJSON])

    return (
        <div style={{ display: "flex", flexDirection: "row", height: "85vh", border: "1px solid #ddd" }}>
            {/* Diagram view / engine */}
            <div style={{ flex: 2, position: "relative", overflow: "scroll"}}>
                <CausalDecisionDiagram model={modelJSON} setModelJSON={setModelJSON} />
            </div>

            {/*JSON Editor*/}
            <div style={{ flex: 1, overflow: "auto", borderRight: "1px solid #ddd" }}>
                <VanillaJSONEditor
                    content={content}
                    onChange={(newContent: any) => {
                        if(newContent.json)
                        {
                            setModelJSON(newContent.json);
                        }
                    }}
                    readOnly={false}
                />
            </div>
        </div>
    )
};

export default App;