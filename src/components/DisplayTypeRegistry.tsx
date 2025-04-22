import React from "react";
import ControlRange, { defaultControlRangeJSON } from "./displayTypes/ControlRange";
import ControlText, { defaultControlTextJSON } from "./displayTypes/ControlText";
import ControlBoolean, { defaultControlBooleanJSON } from "./displayTypes/ControlBoolean";

export type CommonDisplayProps = {
    displayJSON: any;
    computedIOValues: Map<string, any>;
    IOValues: Map<string, any>;
    setIOValues: React.Dispatch<React.SetStateAction<Map<string, any>>>;
    controlsMap: Map<string, string[]>;
};

export type DisplayRegistryEntry = {
    component: React.FC<CommonDisplayProps>;
    defaultJSON: () => any; //This function returns JSON for a new instance of the display
}

const DisplayTypeRegistry: Record<string, DisplayRegistryEntry> = {
    controlRange: {component: ControlRange, defaultJSON: defaultControlRangeJSON},
    controlText: {component: ControlText, defaultJSON: defaultControlTextJSON},
    controlBoolean: {component: ControlBoolean, defaultJSON: defaultControlBooleanJSON},
};

export default DisplayTypeRegistry;