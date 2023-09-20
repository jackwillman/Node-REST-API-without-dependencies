/*
* Example UDP client
* Sending a message to a UDP server on port 6000
*/

// Dependencies
import dgram from 'dgram';

// Create a server
const client = dgram.createSocket('udp4');

// Define the message and pull it into a buffer
const messageString = 'This is a message';
const messageBuffer = Buffer.from(messageString);

// Send off the message
client.send(messageBuffer, 6000, 'localhost', function(err) {
    client.close();
});