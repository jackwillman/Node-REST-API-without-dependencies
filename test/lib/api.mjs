/*
* Unit tests
*
*/

// Dependencies
import app from '../../index.mjs';
import assert from 'assert';
import http from 'http';
import config from '../../lib/config.mjs';

// Containter for module
const apiTests = {};

// Helpers
const helpers = {};
helpers.makeGetRequest = function(path, callback) {
    // Configure the request details
    const requestDetails = {
        'protocol' : 'http:',
       'hostname' : 'localhost',
        'port' : config.httpPort,
        'method' : 'GET',
        'path' : path,
        'headers' : {
            'Content-Type' : 'application/json'
        }
    };
    // Send the request
    const req = http.request(requestDetails, function(res) {
        callback(res);
    });
    req.end();
};

apiTests['app.init should start without throwing'] = function(done) {
    assert.doesNotThrow(function() {
        app.init(function(err) {
            done();
        });
    }, TypeError);
};

apiTests['/ping should respond to GET with 200'] = function(done) {
    helpers.makeGetRequest('/ping', function(res) {
        assert.equal(res.statusCode, 200);
        done();
    });
};

apiTests['/api/users should respond to GET with 400'] = function(done) {
    helpers.makeGetRequest('/api/users', function(res) {
        assert.equal(res.statusCode, 400);
        done();
    });
};

apiTests['A random path should respond to GET with 404'] = function(done) {
    helpers.makeGetRequest('/this/path/shouldnt/exist', function(res) {
        assert.equal(res.statusCode, 404);
        done();
    });
};

// Export module
export default apiTests;