/*
* Example HTTP2 Client
*
*/

// Dependencies
import http2 from 'http2';

// Create client
const client = http2.connect('http://localhost:6000');

// Create a request
const req = client.request({
    ':path' : '/'
});

// When a message is received, add the pieces of it together until you reach the end
let str = '';
req.on('data', function(chunk) {
    str += chunk;
});

// When the message ends, log it out
req.on('end', function() {
    console.log(str);
});

// End the request
req.end();