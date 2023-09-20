/*
* favicon methods
*
*/

// Dependencies
import helpers from '../../../helpers.mjs';

// Container for the module (to be exported)
const favicon = {};

// GET method for favicon
favicon.get = function(callback) {
    // Read in the favicon's data
    helpers.getStaticAsset('favicon.ico', function(err, data) {
        if (err || !data) {
            return callback(500);
        }

        // Callback the data
        callback(200, data, 'favicon');
    });
};

// Export the module
export default favicon;