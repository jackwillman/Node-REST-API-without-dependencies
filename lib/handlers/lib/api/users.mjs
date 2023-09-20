/*
* User submethods
*
*/

// Dependencies
import _data from '../../../data.mjs';
import helpers from '../../../helpers.mjs';
import _tokens from './tokens.mjs';

// Container for the users submethods
const _users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
_users.post = function(data, callback) {
    // Check for the required fields
    const firstName = typeof data.payload.firstName === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof data.payload.lastName === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const phone = typeof data.payload.phone === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
    const password = typeof data.payload.password === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof data.payload.tosAgreement === 'boolean' && data.payload.tosAgreement === true ? true : false;

    if (!(firstName && lastName && phone && password && tosAgreement)) {
        return callback(400, {'Error' : 'Missing required fields'});
    }   

    // Make sure that the user doesnt already exist
    _data.read('users', phone, function(err, data) {
        if (!err) {
            return callback(400, {'Error' : 'A user with that phone number already exists'});
        }

        // Hash the password
        const hashedPassword = helpers.hash(password);
        if (!hashedPassword) {
            return callback(500, {'Error' : 'Could not hash the user\'s password'});
        }

        // Create the user object
        const userObject = {
            firstName,
            lastName,
            phone,
            hashedPassword,
            tosAgreement : true
        };

        // Store the user
        _data.create('users', phone, userObject, function(err) {
            if (!err) {
                return callback(200);
            } else {
                console.log(err);
                return callback(500, {'Error' : 'Could not create the new user'});
            }
        });
    });
};

// Users - get
// Required data: phone, token
// Optional data: none
_users.get = function(data, callback) {
    // Check for the required fields
    const phone = typeof data.queryStringObject.phone === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;

    // Check that phone is valid
    if (!phone) {
        return callback(400, {'Error' : 'Missing required field'});  
    }

    // Verify that the given token is valid for the phone number
    const token = typeof data.headers.token === 'string' ? data.headers.token : false;
    _tokens.verifyToken(token, phone, function(tokenIsValid) {
        if (!tokenIsValid) {
            return callback(403, {'Error' : 'Missing required token in header, or token is invalid'});
        }
        
        // Lookup the user
        _data.read('users', phone, function (err, data) {
            if (!err && data) {
                // Remove the hashed password from the user object before returning it to the requester
                delete data.hashedPassword;
                callback(200, data);
            } else {
                callback(404);
            }
        });
    });
};

// Users - put
// Required data: phone, token
// Optional data: firstName, lastName, password (at least one must be specified)
_users.put = function(data, callback) {
    // Check for the required fields
    const phone = typeof data.payload.phone === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;

    // Check for the optional fields
    const firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // Error if the phone is invalid
    if (!phone) {
        return callback(400, {'Error' : 'Missing required field'});
    }

    // Error if nothing is sent to update
    if (!(firstName || lastName || password)) {
        return callback(400, {'Error' : 'Missing fields to update'});
    }

    // Verify that the given token is valid for the phone number
    const token = typeof data.headers.token === 'string' ? data.headers.token : false;
    _tokens.verifyToken(token, phone, function(tokenIsValid) {
        if (!tokenIsValid) {
            return callback(403, {'Error' : 'Missing required token in header, or token is invalid'});
        }
        // Lookup the user
        _data.read('users', phone, function(err, userData) {
            if (!(!err && userData)) {
                return callback(400, {'Error' : 'The specified user does not exist'});
            }

            // Update the fields necessary
            if (firstName) {
                userData.firstName = firstName;
            }
            if (lastName) {
                userData.lastName = lastName;
            }
            if (password) {
                userData.hashedPassword = helpers.hash(password);
            }

            // Store the new updates
            _data.update('users', phone,userData,function(err){
                if (!err) {
                    return callback(200);
                } else {
                    console.log(err);
                    return callback(500, {'Error' : 'Could not update the user'});
                }
            });
        });
    });
};

// Users - delete
// Required data: phone
_users.delete = function(data, callback) {
    // Check for the required fields
    const phone = typeof data.queryStringObject.phone === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
    // Check if phone number is valid
    if (!phone) {
        return callback(400, {'Error' : 'Missing required field'}); 
    }

    // Verify that the given token is valid for the phone number
    const token = typeof data.headers.token === 'string' ? data.headers.token : false;
    _tokens.verifyToken(token, phone, function(tokenIsValid) {
        if (!tokenIsValid) {
            return callback(403, {'Error' : 'Missing required token in header, or token is invalid'});
        }
        // Lookup the user
        _data.read('users', phone, function (err, userData) {
            if (!(!err && userData)) {
                return callback(400, {'Error' : 'Could not find the specified user'});
            }
            _data.delete('users', phone, function(err) {
                if (err) {
                    return callback(500, {'Error' : 'Could not find the specified user'});
                } 

                // Delete each of the checks associated with the user
                const userChecks = typeof (userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
                const checksToDelete = userChecks.length;
                if (checksToDelete <= 0) {
                    callback(200);
                }

                let checksDeleted = 0;
                let deletionErrors = false; 
                //Loop through the checks
                userChecks.forEach(function(checkId) {
                    // Delete the check
                    _data.delete('checks', checkId, function(err) {
                        if (err) {
                            deletionErrors = true;
                        }
                        checksDeleted++;

                        if (checksDeleted == checksToDelete) {
                            if (deletionErrors) {
                                return callback(500, {'Error' : 'Errors ecountered while attempting to delete all of the user\'s checks. All checks may not have been deleted from the system successfully'});
                            }
                            return callback(200);
                        }
                    });
                });
            });
        });
    });
};

// Export users submethods
export default _users;