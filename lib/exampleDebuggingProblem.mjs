/*
* Library that demonstates something trhowing when it's init() is called
*
*/

// Container for the module
const example = {};

// Init Function
example.init = function() {
    // This is an error created intentionally (bar is not defined)
    const foo = bar;
};

// Export the module
export default example;