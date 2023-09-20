/*
* Test runner
*
*/

// Dependencies
import unitTests from './lib/unit.mjs';
import apiTests from './lib/api.mjs';
import formatting from '../lib/cli/lib/formatting.mjs';

// Override the NODE_ENV variable
process.env.NODE_ENV = 'testing';

// Application logic for the test runner
const _app = {};

// Container for the tests
_app.tests = {};

// Add on the unit tests
_app.tests.unit = unitTests;

// Add on the api tests
_app.tests.api = apiTests;

// Invoke a callback function on each subtest for each test
_app.forSubTest = function(callback) {
    for (let key in _app.tests) {
        if (_app.tests.hasOwnProperty(key)) {
            let subTests = _app.tests[key];
            for (let testName in subTests) {
                if (subTests.hasOwnProperty(testName)) {
                    callback(key, subTests, testName);
                }
            }
        }
    }
};

// Count all the tests
_app.countTests = function() {
    let counter = 0;
    _app.forSubTest(function() {
        counter++;
    });
    return counter;                    
};

// Produce a test outcome report
_app.produceTestReport = function(limit, successes, errors) {
    const reportObj = {
        'Total Tests' : limit,
        'Pass' : successes,
        'Fail' : errors.length
    };
    formatting.createHeader('BEGIN TEST REPORT');
    formatting.createContent(reportObj);
    formatting.verticalSpace(1);

    // If there are errors, print them in detail
    if (errors.length > 0) {
        formatting.centered('BEGIN ERROR DETAILS');
        formatting.verticalSpace(1);

        errors.forEach(function(testError) {
            console.log('\x1b[31m%s\x1b[0m', testError.name);
            console.log(testError.error);
            formatting.verticalSpace(1);
        });

        formatting.verticalSpace(1);
        formatting.centered('END ERROR DETAILS');
        formatting.createFooter();
    }

    formatting.createHeader('END TEST REPORT');
    process.exit(0);
};

// Run all the tests, collecting the errors and successes
_app.runTests = function() {
    let errors = [];
    let successes = 0;
    const limit = _app.countTests();
    let counter = 0;
    _app.forSubTest(function (key, subTests, testName) {
        (function() {
            let tmpTestName = testName;
            let testValue = subTests[testName];
            // Call the test
            try {
                testValue(function() {
                    // If it calls back without throwing, then it succeded, so log it in green
                    console.log('\x1b[32m%s\x1b[0m', tmpTestName);
                    counter++;
                    successes++;
                    if (counter === limit) {
                        _app.produceTestReport(limit, successes, errors);
                    }
                });
            } catch (e) {
                // If it throws, then it failed, so capture the error thrown and log it in red
                errors.push({
                    'name' : testName,
                    'error' : e
                });
                console.log('\x1b[31m%s\x1b[0m', tmpTestName);
                counter++;
                if (counter === limit) {
                    _app.produceTestReport(limit, successes, errors);
                }
            }
        })();
    });
};

// Run the tests
_app.runTests();