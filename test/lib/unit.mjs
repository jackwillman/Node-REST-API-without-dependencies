/*
* Unit tests
*
*/

// Dependencies
import helpers from '../../lib/helpers.mjs';
import assert from 'assert';
import logs from '../../lib/logs.mjs';
import exampleDebuggingProblem from '../../lib/exampleDebuggingProblem.mjs';

// Containter for module
const unitTests = {};

unitTests['helpers.getANumber should return a number'] = function(done) {
    const val = helpers.getANumber();
    assert.equal(typeof val, 'number');
    done();
};

unitTests['helpers.getANumber should return 1'] = function(done) {
    const val = helpers.getANumber();
    assert.equal(val, 1);
    done();
};

unitTests['helpers.getANumber should return 2'] = function(done) {
    const val = helpers.getANumber();
    assert.equal(val, 2);
    done();
};

unitTests['logs.list should callback a false error and an array of log names'] = function(done) {
    logs.list(true, function(err, logFileNames) {
        assert.equal(err, false);
        assert.ok(logFileNames instanceof Array);
        assert.ok(logFileNames.length > 1);
        done();
    });
};

unitTests['logs.truncate should not throw if the logId does not exist. It should callback an error instead'] = function(done) {
    assert.doesNotThrow(function() {
        logs.truncate('I do not exist', function(err) {
            assert.ok(err);
            done();
        });
    }, TypeError);
};

unitTests['exampleDebuggingProblem.init should not throw when called'] = function(done) {
    assert.doesNotThrow(function() {
        exampleDebuggingProblem.init();
        done();
    }, TypeError);
};

// Export module
export default unitTests;