/*
* Library for storing and rotating logs
*
*/

// Dependencies
import fs from 'fs';
import path from 'path';
import url from 'url';
import zlib from 'zlib';
// Set dirname
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Container for the module
const lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname,'/../.logs/');

// Append a string to a file. Create the file if it does not exist.
lib.append = function(file, str, callback) {
    // Open the file for appending
    fs.open(lib.baseDir + file + '.log', 'a', function(err, fileDescriptor) {
        if (!(!err && fileDescriptor)) {
            return callback('Could not open file for appending');
        }

        // Append to the file and close it
        fs.appendFile(fileDescriptor, str + '\n', function(err) {
            if (err) {
                return callback('Error appending to file');
            }
            fs.close(fileDescriptor, function(err) {
                if (err) {
                    return callback('Error closing file that was being appended');
                }
                callback(false);
            });
        });
    });
};

// List all the logs, and optionally include the compressed logs
lib.list = function(includeCompressedLogs, callback) {
    fs.readdir(lib.baseDir, function(err, data) {
        if (!(!err && data && data.length > 0)) {
            return callback(err, data);
        }

        const trimmedFileNames = [];
        data.forEach(function(fileName) {
            // Add the .log files
            if (fileName.indexOf('.log') > -1) {
                trimmedFileNames.push(fileName.replace('.log', ''));
            }

            // Add on the .gz files
            if (fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs) {
                trimmedFileNames.push(fileName.replace('.gz.b64', ''));
            }
        });

        callback(false, trimmedFileNames);
    });
};

// Compress the contents of one .log file into a .gz.b64 file within the same directory
lib.compress = function(logId, newFileId, callback) {
    const sourceFile = logId + '.log';
    const destFile = newFileId + '.gz.b64';

    // Read the source file
    fs.readFile(lib.baseDir + sourceFile, 'utf8', function(err, inputString) {
        if (!(!err && inputString)) {
            return callback(err);
        }

        // Compress the data using gzip
        zlib.gzip(inputString, function (err, buffer) {
            if (!(!err && buffer)) {
                return callback(err);
            }

            // Send the data to the destination file
            fs.open(lib.baseDir + destFile, 'wx', function(err, fileDescriptor) {
                if (!(!err && fileDescriptor)) {
                    return callback(err);
                }

                // Write to the destination file
                fs.writeFile(fileDescriptor, buffer.toString('base64'), function(err) {
                    if (err) {
                        return callback(err);
                    }

                    // Close the destination file
                    fs.close(fileDescriptor, function(err) {
                        if (err) {
                            return callback(err);
                        }

                        callback(false);
                    });
                });
            });
        });
    });
};

// Decompress the contents of a .gz.b64 file into a string variable
lib.decompress = function(fileId, callback) {
    const fileName = fileId + '.gz.b64';
    fs.readFile(lib.baseDir + fileName, 'utf8', function(err, str) {
        if (err || !str) {
            return callback(err);
        }
        // Decompress the data
        const inputBuffer = Buffer.from(str, 'base64');
        zlib.unzip(inputBuffer, function(err, outputBuffer) {
            if (err || !outputBuffer) {
                return callback(err);
            }
            // Callback
            const str = outputBuffer.toString();
            callback(false, str);
        });
    });
 };

// Truncate a log file
lib.truncate = function(logId, callback) {
    fs.truncate(lib.baseDir + logId + '.log', 0, function(err) {
        if (err) {
            return callback(err);
        }
        callback(false);
    });
};

// Export Module
export default lib;