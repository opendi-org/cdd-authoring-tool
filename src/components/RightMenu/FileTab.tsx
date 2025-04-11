import React from "react";


const FileTab: React.FC = () => {
    return (
        <div className="info-menu">
            <h2>File Settings</h2>
            <div>
                <button>New Model</button>Create a new model file, with an empty diagram.
            </div>
            <div>
                <button>Save Model</button><button>Save as New</button><button>Download JSON</button>
            </div>
            <div>
                <select>
                    <option>Pick a file</option>
                </select>
                <button>Load Model</button>
                <button>Delete Model</button>
            </div>
            <h2>API Settings</h2>
            <div>
                Base URL: <input type="text"></input> <button>Update</button>
            </div>
        </div>
    )
};

export default FileTab;