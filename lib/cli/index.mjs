/*
* CLI-Related Tasks
*
*/

// Dependencies
import responders from './lib/responders.mjs';
import readline from 'readline';
import util from 'util';
const debug = util.debuglog('cli');
import events from 'events';
class _events extends events{};
const e = new _events();

// Instantiate the CLI module object
const cli = {};

// Codify the unique strings that identify the unique questions allowed to be asked
cli.uniqueInputs = [
    'man',
    'help',
    'exit',
    'stats',
    'list users',
    'more user info',
    'list checks',
    'more check info',
    'list logs',
    'more log info'
];

// Input handlers
e.on('man', function(str) {
    responders.help();
});
e.on('help', function(str) {
    responders.help();
});
e.on('exit', function(str) {
    responders.exit();
});
e.on('stats', function(str) {
    responders.stats();
});
e.on('list users', function(str) {
    responders.listUsers();
});
e.on('more user info', function(str) {
    responders.moreUserInfo(str);
});
e.on('list checks', function(str) {
    responders.listChecks(str);
});
e.on('more check info', function(str) {
    responders.moreCheckInfo(str);
});
e.on('list logs', function(str) {
    responders.listLogs();
});
e.on('more log info', function(str) {
    responders.moreLogInfo(str);
});

// Input processor
cli.processInput = function(str) {
    str = typeof str === 'string' && str.trim().length > 0 ? str.trim() : false;

    // Only process the input if the user actually wrote something. Otherwise ignore.
    if (!str) {
        return;
    }

    // Go through the possible inputs, emit an event when match is found
    const uniqueInputs = cli.uniqueInputs;
    let matchFound = false;
    let counter = 0;

    uniqueInputs.some(function(input) {
        if (str.toLowerCase().indexOf(input) > -1) {
            matchFound = true;
            // Emit an event matching the unique input and include the full string the full string given by the user
            e.emit(input, str);
            return true;
        }
    });

    // If no match is found, tell the user to try again
    if (!matchFound) {
        console.log("Sorry, try again");
    }
};

// Init script
cli.init = function() {
    // Send the start message to console, in dark blue
    console.log('\x1b[34m%s\x1b[0m', `The CLI is running`);

    // Start the interface
    const _interface = readline.createInterface({
        input : process.stdin,
        output : process.stdout,
        prompt : ''
    });

    // Create an initial prompt
    _interface.prompt();

    // Handle each line of input separately
    _interface.on('line', function(str) {

        // Send to the input processor
        cli.processInput(str);

        // Re-initialize the prompt afterwards
        _interface.prompt();
    });

    // If the user stops the CLI, kill the associated process
    _interface.on('close', function() {
        responders.exit();
    });
};

// Export the module
export default cli;