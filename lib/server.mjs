/*
* Server-related tasks
*
*/

// Dependencies
import url from 'url';
import http from 'http';
import https from 'https';
import { StringDecoder } from 'string_decoder';
import fs from 'fs';
import path from 'path';
import helpers from './helpers.mjs';
import router from './router.mjs';
import handlers from './handlers/index.mjs';
import util from 'util';
const debug = util.debuglog('server');
// Set dirname
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Container for the module (to be exported)
const server = {};

// HTTPS Options
server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};

// Get Path and query string from URL
server.parseURL = function(req) {
    // Get the URL and parse it
    const parsedURL = url.parse(req.url, true);

    // Get the path
    const path = parsedURL.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    const queryStringObject = parsedURL.query;
    
    // Return Object containing the parsed URL stuff
    const refinedParsedURL = {
        trimmedPath,
        queryStringObject
    };
    return refinedParsedURL;
};

// Get response specific for the content-type
server.getContentSpecificRes = function(res, resPayload, contentType) {
    let payloadString = '';
    
    if (contentType === 'json') {
        res.setHeader('Content-Type', 'application/json');
        resPayload = typeof resPayload === 'object' ? resPayload : {};
        payloadString = JSON.stringify(resPayload);
    } else if (contentType === 'html') {
        res.setHeader('Content-Type', 'text/html');
        payloadString = typeof resPayload === 'string' ? resPayload : '';
    } else if (contentType === 'favicon') {
        res.setHeader('Content-Type', 'image/x-icon');
        payloadString = typeof resPayload != undefined ? resPayload : '';
    } else if (contentType === 'css') {
        res.setHeader('Content-Type', 'text/css');
        payloadString = typeof resPayload != undefined ? resPayload : '';
    } else if (contentType === 'png') {
        res.setHeader('Content-Type', 'image/png');
        payloadString = typeof resPayload != undefined ? resPayload : '';
    } else if (contentType === 'jpg') {
        res.setHeader('Content-Type', 'image/jpeg');
        payloadString = typeof resPayload != undefined ? resPayload : '';
    } else if (contentType === 'plain') {
        res.setHeader('Content-Type', 'text/plain');
        payloadString = typeof resPayload != undefined ? resPayload : '';
    }

    return payloadString;
};

// Handle response to the routed request
server.processHandlerResponse = function(res, reqData, statusCode, resPayload, contentType) {
    // Used the status code called back by the handler, or default to 200
    statusCode = typeof statusCode === 'number' ? statusCode : 200; 

    // Determine the type of response (fallback to JSON)
    contentType = typeof contentType === 'string' ? contentType : 'json';

    // Return the response-parts that are content-specific
    const payloadString = server.getContentSpecificRes(res, resPayload, contentType);

    // Return the response-parts that are common to all content-types
    res.writeHead(statusCode);
    res.end(payloadString);

    // If the response is 200, print green, otherwise, print red
    if (statusCode === 200) {
        debug('\x1b[32m%s\x1b[0m', `${reqData.method.toUpperCase()} /${reqData.trimmedPath} ${statusCode}`);
    } else {
        debug('\x1b[31m%s\x1b[0m', `${reqData.method.toUpperCase()} /${reqData.trimmedPath} ${statusCode}`);
    }
};

// Choose the handler this request should go to. If one is not found, use the notFound handler.
server.chooseHandler = function(trimmedPath) {
    let chosenHandler = typeof router[trimmedPath] != 'undefined' ? router[trimmedPath] : handlers.notFound;

    // If the request is whithin the public directory, use the public handler instead
    chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;

    return chosenHandler;
};

// Get Payload, if any, and Response
server.getPayloadAndResponse = function(req, res, reqData) {
    const decoder = new StringDecoder('utf-8');
    let buffer = '';

    req.on('data',function(data) {
        buffer += decoder.write(data);
    });

    req.on('end', function() {
        // Get complete payload, if any
        buffer += decoder.end();
        reqData.payload = helpers.parseJsonToObject(buffer);

        // Route the request to the handler specified in the router
        const chosenHandler = server.chooseHandler(reqData.trimmedPath);
        try {
            chosenHandler(reqData, function(statusCode, resPayload, contentType) {
                server.processHandlerResponse(res, reqData, statusCode, resPayload, contentType);
            });
        } catch(e) {
            debug(e);
            const errorPayload = {
                'Error' : 'An unknown error has occurred'
            };
            server.processHandlerResponse(res, reqData, 500, errorPayload, 'json');
        }
    });
};

// All the server logic for both the http and https server
server.unifiedServer = function(req, res) {
    const parsedURL = server.parseURL(req);
    const method = req.method.toLowerCase();
    const headers = req.headers;
    const reqData = {
        trimmedPath : parsedURL.trimmedPath,
        queryStringObject : parsedURL.queryStringObject,
        method,
        headers
    }
    server.getPayloadAndResponse(req, res, reqData);
};

// Instantiate the HTTP Server
server.httpServer = http.createServer(function(req, res) {
    server.unifiedServer(req, res);
});

// Instantiate the HTTPS Server
server.httpsServer = https.createServer(server.httpsServerOptions,function(req, res) {
    server.unifiedServer(req, res);
});

// Start Server and Listen on a port
server.init = function(config) {
    server.httpServer.listen(config.httpPort, function() {
        console.log('\x1b[36m%s\x1b[0m', `The server is listening on a port ${config.httpPort}`);
    });
    server.httpsServer.listen(config.httpsPort, function() {
        console.log('\x1b[35m%s\x1b[0m', `The server is listening on a port ${config.httpsPort}`);
    });
};

// Export server object
export default server;