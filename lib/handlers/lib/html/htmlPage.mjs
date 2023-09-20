/*
* HTML page methods
*
*/

// Dependencies
import helpers from '../../../helpers.mjs';

// Container for the module (to be exported)
const htmlPage = {};


// GET method for html pages
htmlPage.get = function(pageName, templateData, callback) {

    // Read in a template as a string
    helpers.getTemplate(pageName, templateData, function(err, str) {
        if (err || !str) {
            return callback(500, undefined, 'html');
        }

        // Add the universal header and footer
        helpers.addUniversalTemplates(str, templateData, function(err, str) {
            if(err || !str) {
                return callback(500, undefined, 'html');
            }

            // Return that page as HTML
            callback(200, str, 'html');
        });
    });
};

// Export the module
export default htmlPage;