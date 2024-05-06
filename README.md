# model-authoring-prototype-internal
Internal repository for prototypes of an example implementation of an OpenDI-compliant CDM/CDD authoring frontend system.

# Setup

To setup, clone this repo to a local directory. Then:  
1. [Install npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm). This setup was initially performed on npm v9.6.6, and Node.js v18.16.0
2. From your installed directory, run `npm i` in a command prompt to install required node dependencies
3. In the same directory, run `npm start` to run webpack, initialize the dev server, and open the main project in a browser
4. If step 3 does not open your browser automatically, open a browser and navigate to http://localhost:8080/

# Environment configuration

Node dependencies are specified in `package.json` and `package-lock.json`.  
For `npm start` definition, see `scripts.start` in `package.json`.  
Webpack configuration is specified in `webpack.config.js`. See comments on that file for more information.