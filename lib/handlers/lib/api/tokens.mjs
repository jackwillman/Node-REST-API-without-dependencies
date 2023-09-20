/*
* Tokens submethods
*
*/

// Dependencies
import _data from '../../../data.mjs';
import helpers from '../../../helpers.mjs';
import _perfHooks from 'perf_hooks';
const _perfomance = _perfHooks.performance;
import util from 'util';
const debug = util.debuglog('performance');

// Container for the tokens submethods
const _tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
_tokens.post = function(data, callback) {
    _perfomance.mark('entered function');

    // Check for the required fields
    const phone = typeof data.payload.phone === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
    const password = typeof data.payload.password === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    _perfomance.mark('inputs validated');

    if (!phone || !password) {
        return callback(400, {'Error' : 'Missing required field(s)'});
    }

    // Lookup the user who matches that phone number
    _perfomance.mark('beggining user lookup');
    _data.read('users', phone, function(err, userData) {
        _perfomance.mark('user lookup complete');

        if (err || !userData) {
            return callback(400, {'Error' : 'Could not find the specified user'});
        }

        // Hash the sent password and compare it to the password stored in the user object
        _perfomance.mark('beggining password hashing');
        const hashedPassword = helpers.hash(password);
        _perfomance.mark('password hashing complete');

        if (hashedPassword != userData.hashedPassword) {
            return callback(400, {'Error' : 'Password did not match the specified user\'s stored password'});
        }

        // If valid, create a new token with a random name. Set expiration date 1 hour in the future
        _perfomance.mark('creating data for token');
        const tokenId = helpers.createRandomString(20);
        const expires = Date.now() + 1000 * 60 * 60
        const tokenObject = {
            phone,
            id : tokenId,
            expires
        };

        // Store the token
        _perfomance.mark('beggining storing token');
        _data.create('tokens', tokenId, tokenObject, function(err) {
            _perfomance.mark('storing token complete');

            // Gather all the measurements
            _perfomance.measure('Beggining to end', 'entered function', 'storing token complete');
            _perfomance.measure('Validating user input', 'entered function', 'inputs validated');
            _perfomance.measure('User lookup', 'beggining user lookup', 'user lookup complete');
            _perfomance.measure('Password hashing', 'beggining password hashing', 'password hashing complete');
            _perfomance.measure('Token data creation', 'creating data for token', 'beggining storing token');
            _perfomance.measure('Token storing', 'beggining storing token', 'storing token complete');

            // Log out all the measurements
            const measurements = _perfomance.getEntriesByType('measure');
            measurements.forEach(function(measurement) {
                debug('\x1b[33m%s\x1b[0m', `${measurement.name} ${measurement.duration}`);
            });

            if (!err) {
                callback(200, tokenObject);
            } else {
                callback(500, {'Error' : 'Could not create the new token'});
            }
        });                    
    });
};

// Tokens - get
// Required data: id
// Optional data: none
_tokens.get = function(data, callback) {
    // Check that the id is valid
    const id = typeof data.queryStringObject.id === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        return callback(400, {'Error' : 'Missing required field'});  
    }

    // Lookup the token
    _data.read('tokens', id, function(err, tokenData) {
        if (!err && tokenData) {
            callback(200, tokenData);
        } else {
            callback(404);
        }
    });
};

// Tokens - put
// Required data: id, extend
// Optional data: none
_tokens.put = function(data, callback) {
    // Check required data
    const id = typeof data.payload.id === 'string' && data.payload.id.trim().length === 20 ? data.payload.id.trim() : false;
    const extend = typeof data.payload.extend === 'boolean' && data.payload.extend === true ? true : false;
    if (!id || !extend) {
        return callback(400, {'Error' : 'Missing required field(s) or field(s) are invalid'});
    }

    // Lookup the token
    _data.read('tokens', id, function(err,tokenData) {
        if (err || !tokenData) {
            return callback(400, {'Error' : 'Specfied token does not exist'});
        }

        // Check to make sure the token isn't already expired
        if (tokenData.expires <= Date.now()) {
            return callback(400, {'Error' : 'The token has already expired and cannot be extended'});
        }

        // Set the expiration an hour from now
        tokenData.expires = Date.now() + 1000 * 60 * 60;

        // Store the new updates
        _data.update('tokens', id, tokenData, function(err) {
            if (!err) {
                callback(200);
            } else {
                callback(500, {'Error' : 'Could not update the token\'s expiration'});
            }
        });
    });
};

// Tokens - delete
// Required data: id
// Optional data: none
_tokens.delete = function(data, callback) {
    const id = typeof data.queryStringObject.id === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;

    if (!id) {
        return callback(400, {'Error' : 'Missing required field'}); 
    }

    // Lookup the token
    _data.read('tokens', id, function (err, data) {
        if (!(!err && data)) {
            return callback(400, {'Error' : 'Could not find the specified token'});
        }
        
        _data.delete('tokens', id, function(err) {
            if (!err) {
                callback(200);
            } else {
                callback(500, {'Error' : 'Could not find the specified token'});
            }
        });
    });
};

// Verify if a given token id is curerntly valid for a given user
_tokens.verifyToken = function(id, phone, callback) {
    // Lookup the token
    _data.read('tokens', id, function(err, tokenData) {
        if (err || !tokenData) {
            return callback(false);
        }

        // Check that the token is for the given user and has not expired
        if (tokenData.phone === phone && tokenData.expires > Date.now()) {
            callback(true);
        } else {
            callback(false);
        }
    });
};

// Export tokens submethods
export default _tokens;