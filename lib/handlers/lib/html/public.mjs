/*
* Public assets methods
*
*/

// Dependencies
import helpers from '../../../helpers.mjs';

// Container for the module (to be exported)
const publicAssets = {};

// GET method for publicAssets
publicAssets.get = function(data, callback) {
    // Get the filename being requested
    const trimmedAssetName = data.trimmedPath.replace('public/', '').trim();
    if (trimmedAssetName.length <= 0) {
        return callback(404);
    }

    // Read in the asset's data
    helpers.getStaticAsset(trimmedAssetName, function(err, data) {
        if (err || !data) {
            return callback(404);
        }

        // Determine the content type (default to plain text)
        let contentType = 'plain';
        if (trimmedAssetName.indexOf('.css') > -1) {
            contentType = 'css';
        } else if (trimmedAssetName.indexOf('.png') > -1) {
            contentType = 'png';
        } else if (trimmedAssetName.indexOf('.jpg') > -1) {
            contentType = 'jpg';
        } else if (trimmedAssetName.indexOf('.ico') > -1) {
            contentType = 'favicon';
        }

        // Callback the data
        callback(200, data, contentType);
    });
};

// Export the module
export default publicAssets;