/*
* Example TLS Client
* Connects to port 6000 and sends the word 'ping' to server
*
*/

// Dependencies
import tls from 'tls';
import url from 'url';
import fs from 'fs';
import path from 'path';
// Set dirname
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server options
const options = {
    'ca': fs.readFileSync(path.join(__dirname,'/../https/cert.pem')) // Only required because we're using a self-signed certificate
};

// Define the message to send
const outboundMessage = 'ping';

// Create the client
const client = tls.connect(6000, options, function(connection) {
    // Send the message
    client.write(outboundMessage);
});

// When the server writes back, log  what it says then kill the client
client.on('data', function(inboundMessage) {
    const messageString = inboundMessage.toString();
    console.log(`I wrote ${outboundMessage} and they said ${messageString}`);
    client.end();
});