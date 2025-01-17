# CDD Authoring Tool
This repo holds a publicly-useable prototype of an OpenDI-compliant CDM/CDD authoring frontend tool.

This is meant as an example implementation of OpenDI standards and resources. It is mainly intended to be used in conjunction with the other services defined as part of the [Containerized Authoring Demo](https://github.com/opendi-org/containerized-authoring-demo), but it can also be served statically, as in the Live Test.

## Containerized Authoring Demo
The Containerized Authoring Demo provides more complete functionality, including saving and loading models via an API. For instructions on running the demo locally, see the [Containerized Authoring Demo repo](https://github.com/opendi-org/containerized-authoring-demo).

## Live Test
You can try this tool out yourself!  
Visit https://opendi.org/cdd-authoring-tool/  
**See warning below.**

### Warning
This tool is a prototype!  
We cannot yet guarantee that the system is bug-free. The tool may crash unexpectedly, and you may lose data.

The tool provides a Download button to save your work to a JSON file. Use this often!  
To use your own JSON file as a starting point:  
1. Delete all contents in the tool's JSON view.
2. Open your JSON file in a text editor.
3. Copy the entire text contents of the JSON file.
4. Paste into the frontend tool's JSON view.

## Setup for Local Testing

For local testing instructions that include the API and reverse proxy services, see the [Containerized Authoring Demo repo](https://github.com/opendi-org/containerized-authoring-demo).

To test this project on its own (outside of a Docker container), clone this repo to a local directory. Then:  
1. [Install npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm). This setup was initially performed on npm v9.6.6, and Node.js v18.16.0
2. From your installed directory, run `npm i` in a command prompt to install required node dependencies
3. In the same directory, run `npm start` to run webpack, initialize the dev server, and open the main project in a browser
4. If step 3 does not open your browser automatically, open a browser and navigate to http://localhost:8080/

## Contributing

Contributions are welcome and encouraged! Please fork and PR to `dev`.  
See [issues](https://github.com/opendi-org/cdd-authoring-tool/issues) for task ideas. If you have an idea that is not in the issues list, open a new issue so it can be discussed!

## Environment configuration

Node dependencies are specified in `package.json` and `package-lock.json`.  
For `npm start` definition, see `scripts.start` in `package.json`.  
Webpack configuration is specified in `webpack.config.js`. See comments on that file for more information.
