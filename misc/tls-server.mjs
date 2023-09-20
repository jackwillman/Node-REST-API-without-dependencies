/*
* Example TLS Server
* Listens to port 6000 and sends the word 'pong' to client
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
    'key': fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};

// Create the server
const server = tls.createServer(options, function(connection) {
    // Send the word 'pong'
    const outboundMessage = 'pong';
    connection.write(outboundMessage);

    // When the client writes something, log it out
    connection.on('data', function(inboundMessage) {
        const messageString = inboundMessage.toString();
        console.log(`I wrote ${outboundMessage} and they said ${messageString}`);
    });
});

// Listen
server.listen(6000);