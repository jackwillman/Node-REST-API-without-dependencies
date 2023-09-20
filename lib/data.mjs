/*
* Library for storing and editing data
*
*/

// Dependencies
import url from 'url';
import fs from 'fs';
import path from 'path';
import helpers from './helpers.mjs';
// Set dirname
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Container for the module (to be exported)
const lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname,'/../.data/');

// Write to a file and close it
lib.writeAndClose = function(fileDescriptor, stringData, newOrExisting, callback) {
    fs.writeFile(fileDescriptor, stringData, function(err) {
        if (err) {
            return callback(`Error writing to ${newOrExisting} file`);
        }

        fs.close(fileDescriptor, function(err) { 
            if (!err) {
                callback(false);
            } else {
                callback(`Error closing ${newOrExisting} file`);
            }
        });
    });
};

// Write data to a file
lib.create = function (dir, file, data, callback) {
    // Open the file for writing
    fs.open(`${lib.baseDir}${dir}/${file}.json`, 'wx', function(err, fileDescriptor) {
        if (!(!err && fileDescriptor)) {
            return callback('Could not create new file, it may already exist');
        }

        // Convert data to string
        const stringData = JSON.stringify(data);

        // Write do a file and close it
        lib.writeAndClose(fileDescriptor, stringData, 'new', callback);
    });
};

// Read data from a file
lib.read = function(dir, file, callback) {
    fs.readFile(`${lib.baseDir}${dir}/${file}.json`, 'utf8', function(err, data) {
        if (!(!err && data)) {
            return callback(err,data);
        }

        const parsedData = helpers.parseJsonToObject(data);
        callback(false, parsedData);
    });
};

// Update data inside a file
lib.update = function(dir, file, data, callback) {
    // Open the file for writing
    fs.open(`${lib.baseDir}${dir}/${file}.json`, 'r+', function(err, fileDescriptor) {
        if (!(!err && fileDescriptor)) {
            return callback('Could not open the file for updating, it may not exist yet');
        }

        // Convert data to string
        const stringData = JSON.stringify(data);

        // Truncate the file
        fs.ftruncate(fileDescriptor, function (err) {
            if (err) {
                return callback('Error truncating file');
            }

            // Write to the file and close it
            lib.writeAndClose(fileDescriptor, stringData, 'existing', callback);
        });
    });
};

// Detele file
lib.delete = function(dir, file, callback) {
    // Unlink the file
    fs.unlink(`${lib.baseDir}${dir}/${file}.json`, function(err) {
        if (!err) {
            callback(false);
        } else {
            callback('Error deleting file');
        }
    });
};

// List all the items in a directory
lib.list = function(dir, callback) {
    fs.readdir(lib.baseDir + dir + '/', function(err, data) {
        if (!(!err && data && data.length > 0)) {
            return callback(err, data);
        }
        const trimmedFileNames = [];
        data.forEach(function(fileName){
            trimmedFileNames.push(fileName.replace('.json', ''));
        });
        callback(false, trimmedFileNames);
    });
};

// Export the module
export default lib;