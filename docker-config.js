export class Config {
    //Canvas size
    static paperWidth = 90000; //Effectively caps max width at 90k pixels (see style.css). Hopefully that covers most use cases.
    static paperHeight = 90000; //Effectively caps max height at 90k pixels (see style.css). Hopefully that covers most use cases.

    //Used for resizing elements
    static minElementWidth = 120;
    static maxElementWidth = 200;
    static minElementHeight = 60;
    //Do not limit height, so longer text can fully render

    // Leave empty for static site
    // Do not include a trailing slash
    static apiBaseURI = "/api";
}