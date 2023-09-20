/*
* CLI Responders
*
*/

// Dependencies
import formatting from './formatting.mjs';
import os from 'os';
import v8 from 'v8';
import _data from '../../data.mjs';
import _logs from '../../logs.mjs';
import helpers from '../../helpers.mjs';

// Initiate the module
const responders = {};

// Help / Man
responders.help = function() {
    // Every command and its description
    const commands = {
        'exit' : 'Kill the CLI (and the rest of the application)',
        'man' : 'Show this help page',
        'help' : 'Alias of the "man" command',
        'stats' : 'Get statistics on the underlying operating system and resource utilization',
        'list users' : 'Show a list of all the registered (undeleted) users in the system',
        'more user info --{userId}' : 'Show details of a specific user',
        'list checks --up --down' : 'Show a list of all the active checks in the system, including their state. The --up and --down flags are both optional.',
        'more check info --{checkId}' : 'Show details of a specified check',
        'list logs' : 'Show a list of all the log files available to be read (compressed only)',
        'more log info --{fileName}' : 'Show details of a specified log file'
    };

    // Log page
    formatting.createHeader('CLI MANUAL');
    formatting.createContent(commands);
    formatting.createFooter();
};

// Exit
responders.exit = function() {
    process.exit(0);
};

// Stats
responders.stats = function() {
    // Compile an objects of stats
    const heapStatistics = v8.getHeapStatistics();
    const stats = {
        'Load Average' : os.loadavg().join(' '),
        'CPU Count' : os.cpus().length,
        'Free Memory' : os.freemem(),
        'Current Malloced Memory' : heapStatistics.malloced_memory,
        'Peak Malloced Memory' : heapStatistics.peak_malloced_memory,
        'Allocated Heap Used (%)' : Math.round((heapStatistics.used_heap_size / heapStatistics.total_heap_size) * 100),
        'Available Heap Allocated (%)' : Math.round((heapStatistics.total_heap_size / heapStatistics.heap_size_limit) * 100),
        'Uptime' : `${os.uptime()} Seconds`
    };
    
    // Log page
    formatting.createHeader('SYSTEM STATISTICS');
    formatting.createContent(stats);
    formatting.createFooter();
};

// List users
responders.listUsers = function() {
    _data.list('users', function(err, userdIds) {
        if (err || !userdIds || userdIds.length <= 0) {
            return
        }
        
        formatting.verticalSpace();
        userdIds.forEach(function(userId) {
            _data.read('users', userId, function(err, userData) {
                if (!err && userData) {
                    let line = `Name: ${userData.firstName} ${userData.lastName} Phone: ${userData.phone} Checks: `;
                    let numberOfChecks = typeof userData.checks === 'object' && userData.checks instanceof Array && userData.checks.length > 0 ? userData.checks.length : 0;
                    line += numberOfChecks;
                    console.log(line);
                    formatting.verticalSpace();
                }
            });
        });
    });
};

// More user info
responders.moreUserInfo = function(str) {
    // Get the ID from the string
    const arr = str.split('--');
    const userId = typeof arr[1] === 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
    if (!userId) {
        return
    }

    // Lookup the user
    _data.read('users', userId, function(err, userData) {
        if (err || !userData) {
            return
        }

        // Remove the hashed password
        delete userData.hashedPassword;

        // Print the JSON with text highlighting
        formatting.verticalSpace();
        console.dir(userData, {'colors' : true});
        formatting.verticalSpace();
    });
};

// List checks
responders.listChecks = function(str) {
    _data.list('checks', function(err, checkIds) {
        if (err || !checkIds || checkIds.length <= 0) {
            return
        }

        formatting.verticalSpace();
        checkIds.forEach(function(checkId) {
            _data.read('checks', checkId, function(err, checkData) {
                let includeCheck = false;
                const lowerString = str.toLowerCase();

                // Get the state, default to down
                let state = typeof checkData.state === 'string' ? checkData.state : 'down';

                // Get the state, default to unknown
                let stateOrUnknown = typeof checkData.state === 'string' ? checkData.state : 'unknown';

                // If the user has specified the state, or hasn't specified any state, include the current check accordingly
                if (lowerString.indexOf(`--${state}`) > -1 || (lowerString.indexOf('--down') === -1 && lowerString.indexOf('--up') === -1)) {
                    const line = `ID: ${checkData.id} ${checkData.method.toUpperCase()} ${checkData.protocol}://${checkData.url} State: ${stateOrUnknown}`;
                    console.log(line);
                    formatting.verticalSpace();
                }
            });
        });
    });
};

// More check info
responders.moreCheckInfo = function(str) {
    // Get the ID from the string
    const arr = str.split('--');
    const checkId = typeof arr[1] === 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
    if (!checkId) {
        return
    }

    // Lookup the check
    _data.read('checks', checkId, function(err, checkData) {
        if (err || !checkData) {
            return
        }

        // Print the JSON with text highlighting
        formatting.verticalSpace();
        console.dir(checkData, {'colors' : true});
        formatting.verticalSpace();
    });
};

// List logs
responders.listLogs = function() {
    _logs.list(true, function(err, logFileNames) {
        if (err || !logFileNames || logFileNames.length <= 0) {
            return
        }

        formatting.verticalSpace();
        logFileNames.forEach(function(logFileName) {
            if (logFileName.indexOf('-') > -1) {
                console.log(logFileName);
                formatting.verticalSpace();
            }
        });
    });
};

// More log info
responders.moreLogInfo = function(str) {
    // Get the logFileName from the string
    const arr = str.split('--');
    const logFileName = typeof arr[1] === 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
    if (!logFileName) {
        return;
    }

    formatting.verticalSpace();
    // Deccompress the log file
    _logs.decompress(logFileName, function(err, strData) {
        if (err || !strData) {
            return;
        }

        // Split into lines
        const arr = strData.split('\n');
        arr.forEach(function(jsonString) {
            const logObject = helpers.parseJsonToObject(jsonString);
            if (logObject && JSON.stringify(logObject) != '{}') {
                console.dir(logObject, {'colors' : true});
                formatting.verticalSpace();
            }
        });
    });
};

// Export the module
export default responders;