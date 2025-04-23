(function () {

    //IMPLEMENT YOUR FUNCTION AS A CONST HERE:
    const myScriptFunction = function (inputs) {
        return [null];
    }

    //MAP YOUR FUNCTION TO A STRING NAME HERE:
    return { funcMap: {"myScriptFunction": myScriptFunction} };

})();


// To import a script, it must use a similar structure to the example code above. It should take the form of
// an immediately invoked function expression: https://developer.mozilla.org/en-US/docs/Glossary/IIFE where the
// function returns a function map called funcMap.
// 
// funcMap should have string keys and function values. String keys will be used by Evaluatable Elements
// to pass inputs to and receive outputs from the functions.
// 
// Each script may define arbitrarily many functions, so long as they're all exposed via funcMap.
// 
// Function inputs will take the form of a single array of <any> values.
// Functions should likewise return an array of <any> values.
// Meaning for arguments and return values is determined by their order in the array.