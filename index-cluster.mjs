/*
* Primary file for the API
* For cluster usage
*/

// Dependencies
import server from './lib/server.mjs';
import config from './lib/config.mjs';
import workers from './lib/workers.mjs';
import cli from './lib/cli/index.mjs';
import { fileURLToPath } from 'url';
import process from 'process';
import os from 'os';
import cluster from 'cluster';

// Declare the app
const app = {};

// Init function
app.init = function(callback) {
    
    // If we're on the primary thread, start the background workers and the CLI
    if (cluster.isPrimary) {
        // Start the workers
        workers.init();

        // Start the CLI, but make sure it starts last
        setTimeout(function() {
            cli.init();
            callback();
        }, 50);
        
        // Fork the process
        for (let i = 0; i < os.cpus().length; i++) {
            cluster.fork();
        }
    } else {
        // If we're not on the primary thread, start the HTTP server
        server.init(config);
    }
};

// Self invoking only if required directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    app.init(function() {});
}

// Export the app
export default app;