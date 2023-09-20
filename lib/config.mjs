/*
* Create and export configuration variables
*
*/

// Container for all the environments
const environments = {};

// Factory for environment object
environments.envFactory = function(envName, httpPort, httpsPort, hashingSecret, maxChecks, accountSid, authToken, fromPhone, appName, companyName, yearCreated, baseUrl) {
    const newEnv = {
        envName,
        httpPort,
        httpsPort,
        hashingSecret,
        maxChecks,
        twilio : {
            accountSid,
            authToken,
            fromPhone
        },
        templateGlobals: {
            appName,
            companyName,
            yearCreated,
            baseUrl
        }
    };
    return newEnv;
};

// Staging (default) environment
environments.staging = environments.envFactory('staging', 3000, 3001, 'thisIsASecret', 5, 'ACb32d411ad7fe886aac54c665d25e5c5d', '9455e3eb3109edc12e3d8c92768f7a67', '+15005550006', 'UptimeCheckers', 'NotARealCompany, Inc', '2018', 'http://localhost:3000/');

// Testing environment
environments.testing = environments.envFactory('testing', 4000, 4001, 'thisIsASecret', 5, 'ACb32d411ad7fe886aac54c665d25e5c5d', '9455e3eb3109edc12e3d8c92768f7a67', '+15005550006', 'UptimeCheckers', 'NotARealCompany, Inc', '2018', 'http://localhost:4000/');

// Production environment
environments.production = environments.envFactory('production', 5000, 5001, 'thisIsAlsoASecret', 5, '', '', '', 'UptimeCheckers', 'NotARealCompany', '2018', 'http://localhost:5000/');

// Determine which environment was passed as a command-line argument
const currentEnvironment = typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not, default to staging
const environmentToExport = typeof environments[currentEnvironment] === 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
export default environmentToExport;