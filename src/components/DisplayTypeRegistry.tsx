import React from "react";
import ControlRange from "./displayTypes/ControlRange";
import ControlText from "./displayTypes/ControlText";
import ControlBoolean from "./displayTypes/ControlBoolean";

export type CommonDisplayProps = {
    displayJSON: any;
    computedIOValues: Map<string, any>;
    IOValues: Map<string, any>;
    setIOValues: React.Dispatch<React.SetStateAction<Map<string, any>>>;
    controlsMap: Map<string, string[]>;
};

const DisplayTypeRegistry: Record<string, React.FC<CommonDisplayProps>> = {
    controlRange: ControlRange,
    controlText: ControlText,
    controlBoolean: ControlBoolean,
};

export default DisplayTypeRegistry;