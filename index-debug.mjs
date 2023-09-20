/*
* Primary file for the API
* For debugging
*/

// Dependencies
import server from './lib/server.mjs';
import config from './lib/config.mjs';
import workers from './lib/workers.mjs';
import cli from './lib/cli/index.mjs';
import exampleDebuggingProblem from './lib/exampleDebuggingProblem.mjs';

// Declare the app
const app = {};

// Init function
app.init = function() {
    // Start the server
    debugger;
    server.init(config);
    debugger;

    // Start the workers
    debugger;
    workers.init();
    debugger;

    // Start the CLI, but make sure it starts last
    debugger;
    setTimeout(function() {
        cli.init();
        debugger;
    }, 50);
    debugger;

    debugger;
    let foo = 1
    console.log("Just assigned 1 to foo");
    debugger;

    foo++;
    console.log("Just incremented foo");
    debugger;

    foo = foo*foo;
    console.log("Just squared foo");
    debugger;

    foo = foo.toString();
    console.log("Just converted foo to string");
    debugger;

    // Call the init that will throw
    exampleDebuggingProblem.init();
    console.log("Just called the library");
    debugger;
};

// Execute
app.init();

// Export the app
export default app;