export class Config {
    //Canvas size
    static paperWidth = "64%"; //See style.css for .right, which is taking up the other 34%.
    static paperHeight = 90000; //Effectively caps max height at 90k pixels (see style.css). Hopefully that covers most use cases.

    //Used for resizing elements
    static minElementWidth = 120;
    static maxElementWidth = 200;
    static minElementHeight = 60;
    //Do not limit height, so longer text can fully render
}