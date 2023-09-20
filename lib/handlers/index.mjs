/*
* Request Handlers
* 
*/

// Dependencies
import _htmlPage from './lib/html/htmlPage.mjs';
import _favicon from './lib/html/favicon.mjs';
import _public from './lib/html/public.mjs';
import _users from './lib/api/users.mjs';
import _tokens from './lib/api/tokens.mjs';
import _checks from './lib/api/checks.mjs';

// Container for the module (to be exported)
const handlers = {};

/*
* HTML Handlers
*
*/

// Index Handler
handlers.index = function(data, callback) {
    // Reject any request that isn't a GET
    if (data.method != 'get') {
        return callback(405, undefined, 'html');
    }

    const pageName = 'index';
    const templateData = {
        'head.title' : 'Uptime Monitoring - Made Simple',
        'head.description' : 'We offer free, simple uptime monitoring for HTTP/HTTPS sites of all kinds. When your site goes down, we\'ll send you a text to let you know.',
        'body.class' : pageName
    };

    _htmlPage.get(pageName, templateData, callback);
};

// Account Create Handler
handlers.accountCreate = function(data, callback) {
    // Reject any request that isn't a GET
    if (data.method != 'get') {
        return callback(405, undefined, 'html');
    }

    const pageName = 'accountCreate';
    const templateData = {
        'head.title' : 'Create an account',
        'head.description' : 'Signup is easy and only takes a few seconds.',
        'body.class' : pageName
    };

    _htmlPage.get(pageName, templateData, callback);
};

// Edit Account
handlers.accountEdit = function(data, callback) {
    // Reject any request that isn't a GET
    if (data.method != 'get') {
        return callback(405, undefined, 'html');
    }

    const pageName = 'accountEdit';
    const templateData = {
        'head.title' : 'Account Settings',
        'body.class' : pageName
    };

    _htmlPage.get(pageName, templateData, callback);
};

// Account has been deleted
handlers.accountDeleted = function(data, callback) {
    // Reject any request that isn't a GET
    if (data.method != 'get') {
        return callback(405, undefined, 'html');
    }

    const pageName = 'accountDeleted';
    const templateData = {
        'head.title' : 'Account Deleted',
        'head.description' : 'Your account has been deleted',
        'body.class' : pageName
    };

    _htmlPage.get(pageName, templateData, callback);
};

// Session Create Handler
handlers.sessionCreate = function(data, callback) {
    // Reject any request that isn't a GET
    if (data.method != 'get') {
        return callback(405, undefined, 'html');
    }

    const pageName = 'sessionCreate';
    const templateData = {
        'head.title' : 'Login to your Account',
        'head.description' : 'Please enter your phone number and password to access your account.',
        'body.class' : pageName
    };
    

    _htmlPage.get(pageName, templateData, callback);
};

// Session has been deleted
handlers.sessionDeleted = function(data, callback) {
    // Reject any request that isn't a GET
    if (data.method != 'get') {
        return callback(405, undefined, 'html');
    }

    const pageName = 'sessionDeleted';
    const templateData = {
        'head.title' : 'Logged out',
        'head.description' : 'You have been logged out of your account.',
        'body.class' : pageName
    };

    _htmlPage.get(pageName, templateData, callback);
};

// Create a new check
handlers.checksCreate = function(data, callback) {
    // Reject any request that isn't a GET
    if (data.method != 'get') {
        return callback(405, undefined, 'html');
    }

    const pageName = 'checksCreate';
    const templateData = {
        'head.title' : 'Create a New Check',
        'body.class' : pageName
    };

    _htmlPage.get(pageName, templateData, callback);
};

// Dashboard (view all checks)
handlers.checksList = function(data, callback) {
    // Reject any request that isn't a GET
    if (data.method != 'get') {
        return callback(405, undefined, 'html');
    }

    const pageName = 'checksList';
    const templateData = {
        'head.title' : 'Dashboard',
        'body.class' : pageName
    };

    _htmlPage.get(pageName, templateData, callback);
};

// Edit a Check
handlers.checksEdit = function(data, callback) {
    // Reject any request that isn't a GET
    if (data.method != 'get') {
        return callback(405, undefined, 'html');
    }

    const pageName = 'checksEdit';
    const templateData = {
        'head.title' : 'Checks Details',
        'body.class' : pageName
    };

    _htmlPage.get(pageName, templateData, callback);
};

// Favicon
handlers.favicon = function(data, callback) {
    // Reject any request that isn't a GET
    if (data.method != 'get') {
        return callback(405);
    }

    _favicon.get(callback);
};

// Public assets
handlers.public = function(data, callback) {
    // Reject any request that isn't a GET
    if (data.method != 'get') {
        return callback(405);
    }

    _public.get(data, callback);
};

/*
* JSON API Handlers
*
*/

// Example error
handlers.exampleError = function(data, callback) {
    const err = new Error('This is an example error');
    throw(err);
};

// Users handler
handlers.users = function(data, callback) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        _users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Tokens handler
handlers.tokens = function(data, callback) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        _tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Checks handler
handlers.checks = function(data, callback) {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        _checks[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Ping handler
handlers.ping = function (data, callback) {
    callback(200);
};

// Not found handler
handlers.notFound = function (data, callback) {
    callback(404);
};

// Export handlers object
export default handlers;