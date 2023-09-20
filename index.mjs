/*
* Primary file for the API
* 
*/

// Dependencies
import server from './lib/server.mjs';
import config from './lib/config.mjs';
import workers from './lib/workers.mjs';
import cli from './lib/cli/index.mjs';
import { fileURLToPath } from 'url';
import process from 'process';

// Declare the app
const app = {};

// Init function
app.init = function(callback) {
    // Start the server
    server.init(config);

    // Start the workers
    workers.init();

    // Start the CLI, but make sure it starts last
    setTimeout(function() {
        cli.init();
        callback();
    }, 50);
};

// Self invoking only if required directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    app.init(function() {});
}

// Export the app
export default app;