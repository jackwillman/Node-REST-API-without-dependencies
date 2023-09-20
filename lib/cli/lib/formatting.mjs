/*
* Interface related tasks
*
*/

// Dependencies

// Initiate the module
const formatting = {};

// Create a horizontal line across the string
formatting.horizontalLine = function() {
    // Get the available screen size
    const width = process.stdout.columns;

    let line = '';
    for (let i = 0; i < width; i++) {
        line += '-';
    }

    console.log(line);
};

// Create centered text on the screen
formatting.centered = function(str) {
    str = typeof str === 'string'  && str.trim().length > 0 ? str.trim() : '';

    // Get the available screen size
    const width = process.stdout.columns;

    // Calculate the left padding
    const leftPadding = Math.floor((width - str.length) / 2);

    // Put in left padded spaces before the string itself
    let line = '';
    for (let i = 0; i < leftPadding; i++) {
        line += ' ';
    }

    // Add the string and log to the console
    line += str;

    console.log(line);
};

// Create a vertical space
formatting.verticalSpace = function(lines) {
    lines = typeof lines === 'number' && lines > 0 ? lines : 1;
    for (let i = 0; i < lines; i++) {
        console.log('');
    }
};

// Show a header for the page that is as wide as the screen
formatting.createHeader = function(title) {
    formatting.horizontalLine();
    formatting.centered(title);
    formatting.horizontalLine();
    formatting.verticalSpace(2);
};

// End with another horizontal line
formatting.createFooter = function() {
    formatting.verticalSpace(1);
    formatting.horizontalLine();
};

// Create page content
formatting.createContent = function(obj) {
    obj = typeof obj === 'object' ? obj : {};

    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            let value = obj[key];
            let line = `\x1b[33m${key}\x1b[0m`;
            const padding = 60 - line.length;
            for (let i = 0; i < padding; i++) {
                line += ' ';
            }
            line += value;
            console.log(line);
            formatting.verticalSpace(1);
        }
    }
};

// Export the module
export default formatting;