/*
* Helpers for various tasks
*
*/

// Dependencies
import crypto from 'crypto';
import https from 'https';
import config from './config.mjs';
import path from 'path';
import fs from 'fs';
import url from 'url';
// Set dirname
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Container for the module (to be exported)
const helpers = {};

// Sample for testing that simply returns a number
helpers.getANumber = function() {
    return 1;
};

// Create a SHA256 hash
helpers.hash = function(str) {
    if (typeof str == 'string' && str.length > 0) {
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str) {
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch(e) {
        return {};
    }
};

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = function(strLength) {
    strLength = typeof strLength === 'number' && strLength > 0 ? strLength : false;
    if (strLength) {
        // Define all the possible characters that could go into a string
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789'

        // Start the final string
        let str = '';

        for (let i = 1; i <= strLength; i++){
            // Get a random character from the possibleCharacters string
            const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            // Append this character to the final string
            str += randomCharacter;
        }

        // Return the final string
        return str;

    } else {
        return false;
    }
};

// Send and SMS message via Twilio
helpers.sendTwilioSms = function(phone, msg, callback) {
    // Validate parameters
    phone = typeof phone === 'string' && phone.trim().length === 10 ? phone.trim() : false;
    msg = typeof msg === 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;    
    if (!(phone && msg)) {
        return callback('Given parameters were missing or invalid');
    }
    
    // Configure the request payload
    const payload = {
        'From' : config.twilio.fromPhone,
        'To' : '+55' + phone,
        'Body' : msg
    };

    // Stringify the payload
    const stringPayload = new URLSearchParams(payload).toString();    // TENTATIVA DE VERSAO NOVA DE querystring.stringify(payload);

    // Configure the request details
    const requestDetails ={
        'protocol' : 'https:',
        'hostname' : 'api.twilio.com',
        'method' : 'POST',
        'path' : '/2010-04-01/Accounts/'+ config.twilio.accountSid + '/Messages.json',
        'auth' : config.twilio.accountSid + ':' + config.twilio.authToken,
        'headers' : {
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Content-Length' : Buffer.byteLength(stringPayload)
        }
    };

    // Instantiate the request model
    const req = https.request(requestDetails, function(res){
        // Grab the status of the sent request
        const status = res.statusCode;

        // Callback successfully if the request wen through
        if (status === 200 || status == 201) {
            callback(false);
        } else {
            callback('Status code returned was ' + status);
        }
    });

    // Bind to the error event so it doesn't get thrown
    req.on('error', function(e) {
        callback(e);
    });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();
};

// Get the string content of a template
helpers.getTemplate = function (templateName, data, callback) {
    templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
    data = typeof(data) === 'object' && data != null ? data : {};

    if (!templateName) {
        return callback('A valid template name was not specified');
    }

    const templatesDir = path.join(__dirname, '/../templates/')
    fs. readFile(`${templatesDir}${templateName}.html`, 'utf-8', function(err, str) {
        if (err || !str || str.length <= 0) {
            callback('No template could be found');
        }
        // Do interpolation on the string
        const finalString = helpers.interpolate(str, data);
        callback(false, finalString);
    });
};

// Add the universal header and footer to a string, and pass provided data object to the header and footer for interpolation
helpers.addUniversalTemplates = function(str, data, callback) {
    str = typeof str === 'string' && str.length > 0 ? str : '';
    data = typeof(data) === 'object' && data != null ? data : {};

    // Get the header
    helpers.getTemplate('_header', data, function(err, headerString) {
        if (err || !headerString) {
            return callback('Could not find the header template');
        }

        // Get the footer
        helpers.getTemplate('_footer', data, function(err, footerString) {
            if (err || !footerString) {
                return callback('Could not find the footer template');
            }

            // Add them all together
            const fullString = headerString + str + footerString;
            callback(false, fullString);
        });
    });
};

// Take a given string and a data object and find/replace all the keys within it
helpers.interpolate = function(str, data) {
    str = typeof str === 'string' && str.length > 0 ? str : '';
    data = typeof(data) === 'object' && data != null ? data : {};

    // Add the templateGlobals to the data object, prepending their key name with "global"
    for (let keyName in config.templateGlobals) {
        if (config.templateGlobals.hasOwnProperty(keyName)) {
            data[`global.${keyName}`] = config.templateGlobals[keyName];
        }
    }

    // For each key in the data object, insert its value into the string at the corresponding placeholder
    for (let key in data) {
        if (data.hasOwnProperty(key) && typeof(data[key]) === 'string') {
            let replace = data[key];
            let find = `{${key}}`;
            str = str.replace(find, replace);
        }
    }
    
    return str;
};

// Get the contents of a static (public) asset
helpers.getStaticAsset = function (fileName, callback) {
    fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false;
    if (!fileName) {
        return callback('A valid file name was not specified');
    }

    const publicDir = path.join(__dirname, '/../public/');
    fs.readFile(`${publicDir}${fileName}`, function(err, data) {
        if (err || !data) {
            callback('No file could be found');
        }

        callback(false, data);
    });
};

// @TODO MAYBE DELETE OR USE IT
helpers.sanityCheckFunction = function(type, data) {
    switch (type) {
        case 'str':
            data = typeof data === 'string' && data.length > 0 ? data : '';
            break
        case 'data':
            data = typeof(data) === 'object' && data != null ? data : {};
            break
        default:
            console.log(`Type: ${type} is invalid.`)
            data = false;
    }
    return data;
};

// @TODO MAYBE DELETE OR USE IT
helpers.sanityCheck = {};
helpers.sanityCheck.str = function(data) {
    data = typeof data === 'string' && data.length > 0 ? data : '';
    return data;
};
helpers.sanityCheck.data = function(data) {
    data = typeof(data) === 'object' && data != null ? data : {};
    return data;
};

// Export helpers object
export default helpers;