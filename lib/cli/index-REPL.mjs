/*
* CLI-Related Tasks
* REPL version
*
*/

// Dependencies
import responders from './lib/responders.mjs';
import repl from 'repl';
import util from 'util';
const debug = util.debuglog('cli');
import events from 'events';
class _events extends events{};
const e = new _events();

// Instantiate the CLI module object
const cli = {};

// Input Evaluation
cli.evaluation = function(str) {
    // Go through the possible inputs, call responder
    if (str.indexOf('man') > -1 || str.indexOf('help') > -1) {
        responders.help();
    } else if (str.indexOf('exit') > -1) {
        responders.exit();
    } else if (str.indexOf('stats') > -1) {
        responders.stats();
    } else if (str.indexOf('list users') > -1) {
        responders.listUsers();
    } else if (str.indexOf('more user info') > -1) {
        responders.moreUserInfo(str);
    } else if (str.indexOf('list checks') > -1) {
        responders.listChecks(str);
    } else if (str.indexOf('more check info') > -1) {
        responders.moreCheckInfo(str);
    } else if (str.indexOf('list logs') > -1) {
        responders.listLogs();
    } else if (str.indexOf('more log info') > -1) {
        responders.moreLogInfo(str);
    } else {
        console.log("Sorry, try again");
    }
};

// Init script
cli.init = function() {
    // Send the start message to console, in dark blue
    console.log('\x1b[34m%s\x1b[0m', `The CLI is running`);

    repl.start({
        'prompt' : '> ',
        'eval' : cli.evaluation
    });
};

// Export the module
export default cli;