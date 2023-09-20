/*
* Worker-realted tasks
*
*/

// Dependencies
import url from 'url';
import fs from 'fs';
import http from 'http';
import https from 'https';
import _data from './data.mjs';
import helpers from './helpers.mjs';
import _logs from './logs.mjs';
import util from 'util';
const debug = util.debuglog('workers'); // SET NODE_DEBUG=workers

// Container for the module (to be exported)
const workers = {};

// Lookup all checks, get their data, send to a validator
workers.gatherAllChecks = function(){
    // Get all the checks
    _data.list('checks', function(err, checks){
        if (!(!err && checks && checks.length > 0)) {
            return debug("Error: Could not find any checks to process");
        }

        checks.forEach(function(check) {
            // Read in the check data
            _data.read('checks', check, function(err, originalCheckData) {
                if(!(!err && originalCheckData)) {
                    return debug("Error reading one of the check's data");
                }

                // Pass the data to the check validator, and let that function continue or log errors as needed
                workers.validateCheckData(originalCheckData);
            });
        });
    });
};

// Sanity-check the check-data
workers.validateCheckData = function(originalCheckData) {
    originalCheckData = typeof originalCheckData === 'object' && originalCheckData != null ? originalCheckData : {};
    originalCheckData.id = typeof originalCheckData.id === 'string' && originalCheckData.id.trim().length === 20 ? originalCheckData.id.trim() : false;
    originalCheckData.userPhone = typeof originalCheckData.userPhone === 'string' && originalCheckData.userPhone.trim().length === 10 ? originalCheckData.userPhone.trim() : false;
    originalCheckData.protocol = typeof originalCheckData.protocol === 'string' && ['http', 'https'].indexOf(originalCheckData.protocol) >-1 ? originalCheckData.protocol : false;
    originalCheckData.url = typeof originalCheckData.url === 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
    originalCheckData.method = typeof originalCheckData.method === 'string' && ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) >-1 ? originalCheckData.method : false;
    originalCheckData.successCodes = typeof originalCheckData.successCodes === 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;
    originalCheckData.timeoutSeconds = typeof originalCheckData.timeoutSeconds === 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false;

    // Set the keys that may not be set (if the workers have never seen this check before)
    originalCheckData.state = typeof originalCheckData.state === 'string' && ['up', 'down'].indexOf(originalCheckData.state) >-1 ? originalCheckData.state : 'down';
    originalCheckData.lastChecked = typeof originalCheckData.lastChecked === 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

    // If all the checks pass, pass the data along to the next step in the proccess
    if (!(originalCheckData.id &&
    originalCheckData.userPhone &&
    originalCheckData.protocol &&
    originalCheckData.url &&
    originalCheckData.method &&
    originalCheckData.successCodes &&
    originalCheckData.timeoutSeconds)) {
        return debug("Error: One of the checks is not properly formatted. Skipping it.");
    }

    workers.performCheck(originalCheckData);
};

// Perform the check, send the originalCheckData and the outcome of the check process to the next step in the process
workers.performCheck = function(originalCheckData) {
    // Prepare the initial check outcome
    const checkOutcome = {
        'error' : false,
        'responseCode' : false
    };

    // Mark that the outcome has not been sent yet
    let outcomeSent = false;

    // Parse the hostname and the path out of the original check data
    const parsedUrl = url.parse(originalCheckData.protocol + '://' + originalCheckData.url, true);
    const hostName = parsedUrl.hostname;
    const path = parsedUrl.path; // Using path and not 'pathname' because we want the query string
    

    // Construct the request
    const requestDetails = {
        'protocol' : originalCheckData.protocol + ':',
        'hostname' : hostName,
        'method' : originalCheckData.method.toUpperCase(),
        'path' : path,
        'timeout' : originalCheckData.timeoutSeconds * 1000
    };

    // Instantiate the request object (using either the http ou https module)
    const _moduleToUse = originalCheckData.protocol == 'http' ? http : https;
    const req = _moduleToUse.request(requestDetails, function(res) {
        // Grab the status of the sent request
        const status = res.statusCode;

        // Update the checkOutcome and pass the data along
        checkOutcome.responseCode = status;
        outcomeSent = workers.assureCheckOutcomeIsSent(originalCheckData, checkOutcome, outcomeSent);
    });

    // Bind to the error event so it doesn't get thrown
    req.on('error',function(e) {
        // Update the checkOutcome and pass the data along
        checkOutcome.error = {
            'error' : true,
            'value' : e
        };
        outcomeSent = workers.assureCheckOutcomeIsSent(originalCheckData, checkOutcome, outcomeSent);
    });

    // Bind to the timeout event
    req.on('timeout',function(e) {
        // Update the checkOutcome and pass the data along
        checkOutcome.error = {
            'error' : true,
            'value' : 'timeout'
        };
        outcomeSent = workers.assureCheckOutcomeIsSent(originalCheckData, checkOutcome, outcomeSent);
    });

    // End the request
    req.end();
};

// Send check outcome if not sent
workers.assureCheckOutcomeIsSent = function(originalCheckData, checkOutcome, outcomeSent) {
    if (!outcomeSent) {
        workers.processCheckOutcome(originalCheckData, checkOutcome);
        outcomeSent = true;
    }
    return outcomeSent;
};

// Process the check outcome, update the check data as needed, trigger an alert if needed
// Special logic for accomodating a check that has never been tested before (don't alert on that one)
workers.processCheckOutcome = function(originalCheckData, checkOutcome) {
    // Decide if the check is considered up or down 
    let state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

    // Decide if an alert is warranted
    const alertWarranted = originalCheckData.lastChecked && originalCheckData.state != state ? true : false;

    // Log the outcome
    const timeOfCheck = Date.now();
    workers.log(originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck);

    // Update the check data
    const newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = timeOfCheck;

    // Save the updates
    _data.update('checks', newCheckData.id, newCheckData, function(err) {
        if (err) {
            return debug("Error trying to save updates to one of the checks");
        }

        // Send the new check data to the next phase in the process if needed
        if (!alertWarranted) {
            return debug('Check outcome has not changed, no alert needed');
        }

        workers.alertUserToStatusChange(newCheckData);
    });
    
};

// Alert the user as to a change in their check status
workers.alertUserToStatusChange = function(newCheckData) {
    const msg = `Alert: Your check for ${newCheckData.method.toUpperCase()} ${newCheckData.protocol}//${newCheckData.url} is currently ${newCheckData.state}.`;
    helpers.sendTwilioSms(newCheckData.userPhone, msg, function(err) {
        if (!err) {
            debug("success: User was alerted to a status change in their check, via sms", msg);
        } else {
            debug("error: could not send sms alert to user who had a state change in their check");
        }
    });
};

workers.log = function(originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck) {
    // Form the log data
    const logData = {
        'check' : originalCheckData,
        'outcome' : checkOutcome,
        'state' : state,
        'alert' : alertWarranted,
        'time' : timeOfCheck
    };

    // Convert data to a string
    const logString = JSON.stringify(logData);

    // Determine the name of the log file
    const logFileName = originalCheckData.id;

    // Append the log string to the file
    _logs.append(logFileName, logString, function(err) {
        if(err) {
            return debug("Logging to file failed");
        }
        debug("Logging to file succeded");
    });
};


// Timer to execute the worker-process once per minute
workers.loop = function (frequency) {
    setInterval(function(){
        workers.gatherAllChecks();
    }, frequency)
};

// Rotate (compress) the log files
workers.rotateLogs = function () {
    // List all the (non compressed) log files
    _logs.list(false, function(err, logs) {
        if (!(!err && logs && logs.length > 0)) {
            return debug("Error : could not find any logs to rotate");
        }
        logs.forEach(function(logName) {
            // Compress the data to a different file
            const logId = logName.replace('.log', '');
            const newFileId = logId + '-' + Date.now();
            _logs.compress(logId, newFileId, function(err) {
                if (err) {
                    return debug("Error compressing one of the log files", err);
                }
                // Truncate the log
                _logs.truncate(logId, function(err) {
                    if(err) {
                        return debug("Error truncating logFile");
                    }
                    debug("Success truncating logFile");
                });
            });
        });
    });
}

// Timer to execute the log-rotation process once per day
workers.logRotationLoop = function (frequency) {
    setInterval(function(){
        workers.rotateLogs();
    }, frequency)
};

// Init script
workers.init = function() {

    // Send to console, in yellow
    console.log('\x1b[33m%s\x1b[0m', 'Background workers are running');

    // Execute all the checks immediately
    workers.gatherAllChecks();

    // Call the loop so the checks will execute later on
    workers.loop(1000 * 60);

    // Compress all the logs immediately
    workers.rotateLogs();

    // Call the compression loop só logs will be compressed later on
    workers.logRotationLoop(1000 * 60 * 60 * 24);
};

// Export workers object
export default workers;