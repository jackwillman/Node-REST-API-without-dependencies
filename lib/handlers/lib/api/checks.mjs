/*
* Checks submethods
*
*/


// Dependencies
import config from '../../../config.mjs';
import helpers from '../../../helpers.mjs';
import _data from '../../../data.mjs';
import _tokens from './tokens.mjs';
import _url from 'url';
import dns from 'dns';

// Container for the checks submethods
const _checks = {};

// Checks - post
// Required data: protocol, url, method, successCodes, timeoutSeconds
// Optional data: none
_checks.post = function(data, callback) {
    // Validate inputs 
    const protocol = typeof data.payload.protocol === 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = typeof data.payload.url === 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof data.payload.method === 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const successCodes = typeof data.payload.successCodes === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    const timeoutSeconds = typeof data.payload.timeoutSeconds === 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5? data.payload.timeoutSeconds : false;

    if (!protocol || !url || !method || !successCodes || !timeoutSeconds) {
        return callback(400, {'Error' : 'Missing required inputs, or inputs are invalid'});
    }

    // Get the token from the headers
    const token = typeof data.headers.token === 'string' ? data.headers.token : false;

    // Lookup the user by reading the token
    _data.read('tokens', token, function(err, tokenData){
        if (err || !tokenData) {
            return callback(403);
        }

        const userPhone = tokenData.phone;

        // Lookup the user data
        _data.read('users', userPhone, function(err, userData) {
            if (err || !userData) {
                return callback(403);
            }

            const userChecks = typeof userData.checks === 'object' && userData.checks instanceof Array ? userData.checks : [];
            
            // Verify that the user has less than the max checks per user
            if (userChecks.length >= config.maxChecks) {
                return callback(400, {'Error' : 'The user already has the maximum numer of checks ('+config.maxChecks+')'});
            }

            // Verify that the URL given has DNS entries (and therefore can resolve)
            const parsedUrl = _url.parse(`${protocol}://${url}`, true);
            const hostName = typeof parsedUrl.hostname === 'string' && parsedUrl.hostname.length > 0 ? parsedUrl.hostname : false;
            dns.resolve(hostName, function(err, records) {
                if (err || !records) {
                    return callback(400, {'Error' : 'The hostname of the URL entered did not resolve to any DNS entries'});
                }

                // Create a random id for the check
                const checkId = helpers.createRandomString(20);
                
                // Create the check object, and include the user's phone
                const checkObject = {
                    'id' : checkId,
                    userPhone,
                    protocol,
                    url,
                    method,
                    successCodes,
                    timeoutSeconds
                };

                // Save the object
                _data.create('checks', checkId, checkObject, function(err) {
                    if (err) {
                        return callback(500, {'Error' : 'Could not create the new check'});
                    }

                    // Add the check id to the user's object
                    userData.checks = userChecks;
                    userData.checks.push(checkId);

                    // Save the new user data
                    _data.update('users', userPhone, userData, function(err) {
                        if (err) {
                            return callback(500, {'Error' : 'Could not update the user with the new check'});
                        }

                        // Return the data about the new check
                        callback(200, checkObject);
                    });
                });
            });
        });
    });
};

// Checks - get
// Required data: id
// Optional data: none
_checks.get = function(data, callback) {
    // Check for the required fields
    const id = typeof data.queryStringObject.id === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;

    // Check that phone is valid
    if (!id) {
        return callback(400, {'Error' : 'Missing required field'});  
    }

    // Lookup the check
    _data.read('checks',id,function(err, checkData){
        if (err || !checkData) {
            return callback(404);
        }

        // Verify that the given token is valid and belongs to the user who created the check
        const token = typeof data.headers.token === 'string' ? data.headers.token : false;
        _tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
            if (!tokenIsValid) {
                return callback(403);
            }
            
            // Return the check data
            return callback(200, checkData);
        });
    });
};

// Checks - put
// Required data: id and at least one optional data must be sent
// Optional data: protocol, url, method, sucessCodes, timeoutSeconsd
_checks.put = function(data, callback) {
    // Check for the required fields
    const id = typeof data.payload.id === 'string' && data.payload.id.trim().length === 20 ? data.payload.id.trim() : false;

    // Check for the optional fields
    const protocol = typeof data.payload.protocol === 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = typeof data.payload.url === 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof data.payload.method === 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const successCodes = typeof data.payload.successCodes === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    const timeoutSeconds = typeof data.payload.timeoutSeconds === 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5? data.payload.timeoutSeconds : false;

    // Check if id is valid
    if (!id) {
        return callback(400, {'Error' : 'Missing required field'});
    }

    // Check if one or more optional fields has been sent
    if (!(protocol || url || method || successCodes || timeoutSeconds)) {
        return callback(400, {'Error' : 'Missing fields to update'});
    }

    // Lookup the check
    _data.read('checks', id, function(err, checkData) {
        if (!(!err && checkData)) {
            return callback(400, {'Error' : 'Check ID did not exist'});
        }

        // Verify that the given token is valid and belongs to the user who created the check
        const token = typeof data.headers.token === 'string' ? data.headers.token : false;
        _tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
            if (!tokenIsValid) {
                return callback(403);
            }
            
            // Update the check where necessary
            if (protocol) {
                checkData.protocol = protocol;
            }
            if (url) {
                checkData.url = url;
            }
            if (method) {
                checkData.method = method;
            }
            if (successCodes) {
                checkData.successCodes = successCodes;
            }
            if (timeoutSeconds) {
                checkData.timeoutSeconds = timeoutSeconds;
            }

            // Store the new updates
            _data.update('checks', id, checkData, function(err) {
                if (err) {
                    return callback(500, {'Error' : 'Could not update the check'});
                }
                return callback(200);
            });
        });
    });
};

// Checks - delete
// Required data: id
// Optional data: none
_checks.delete = function(data, callback) {
    // Check if id is valid
    const id = typeof data.queryStringObject.id === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;
    if (!id) {
        return callback(400, {'Error' : 'Missing required field'}); 
    }

    // Lookup the check
    _data.read('checks', id, function(err, checkData) {
        if (!(!err && checkData)) {
            return callback(400, {'Error' : 'The specified check ID does not exist'});
        }

        // Verify that the given token is valid for the phone number
        const token = typeof data.headers.token === 'string' ? data.headers.token : false;
        _tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
            if (!tokenIsValid) {
                return callback(403);
            }

            // Delete the check data
            _data.delete('checks', id, function(err) {
                if (err) {
                    return callback(500, {'Error' : 'Could not delete the check data'});
                }

                // Lookup the user
                _data.read('users', checkData.userPhone, function(err, userData) {
                    if (!(!err && userData)) {
                        return callback(500, {'Error' : 'Could not find the user who created the check, so could not remove the check from the list of checks on the user object'});
                    }
                    const userChecks = typeof userData.checks === 'object' && userData.checks instanceof Array ? userData.checks : [];

                    // Remove the deleted check from their list of checks
                    const checkPosition = userChecks.indexOf(id);
                    if (checkPosition <= -1) {
                        return callback(500, {'Error' : 'Could not find the check on the users object, so could not remove it'});
                    }
                    userChecks.splice(checkPosition,1);

                    // Re-save the user's data
                    _data.update('users', checkData.userPhone, userData, function(err) {
                        if (err) {
                            return callback(500, {'Error' : 'Could not find the specified user'});
                        }                            
                        return callback(200);
                    });
                });
            });
        });
    });
};

// Export checks submethods
export default _checks;