const path = require('path');

module.exports = {
    entry: './src/index.js',                    //Relative path to entry file
    output: {
        path: path.resolve(__dirname, 'dist'),  //Output bundled script file in ./dist/
        filename: 'bundled_app.js'              //Name of bundled script file
    },
    mode: 'development',                        //Webpack yells at you if you don't set a mode
    devServer: {
        static: {
            directory: path.join(__dirname, 'static') //Tell the server where to find static files (like index.html)
        },
        port:8080
    }
};