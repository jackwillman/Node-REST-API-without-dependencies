/*
* Primary file for the API
* For strict call
*/

// Dependencies
import server from './lib/server.mjs';
import config from './lib/config.mjs';
import workers from './lib/workers.mjs';
import cli from './lib/cli/index.mjs';

// Declare the app
const app = {};

// Init function
app.init = function() {
    // Start the server
    server.init(config);

    // Start the workers
    workers.init();

    // Start the CLI, but make sure it starts last
    setTimeout(function() {
        cli.init();
    }, 50);
};

// Execute
app.init();

// Export the app
export default app;