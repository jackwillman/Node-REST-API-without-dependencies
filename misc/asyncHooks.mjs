/*
* Async Hooks Example
*
*/

// Dependencies
import asyncHooks from 'async_hooks';
import fs from 'fs';

// Target execution context 
const targetExecutionContext = false;

// Write an arbitrary async function
const whatTimeIsIt = function(callback) {
    setInterval(function() {
        fs.writeSync(1, `When the setInterval runs, the execution context is ${asyncHooks.executionAsyncId()}\n`);
        callback(Date.now());
    }, 1000);
};

// Call that function
whatTimeIsIt(function(time) {
    fs.writeSync(1, `The time is ${time}\n`);
});

// Hooks
const hooks = {
    init(asyncId, type, triggerAsyncId, resource) {
        fs.writeSync(1, `Hook Init ${asyncId}\n`)
    },
    before(asyncId) {
        fs.writeSync(1, `Hook before ${asyncId}\n`)
    },
    after(asyncId) {
        fs.writeSync(1, `Hook After ${asyncId}\n`)
    },
    destroy(asyncId) {
        fs.writeSync(1, `Hook Destroy ${asyncId}\n`)
    },
    promiseResolve(asyncId) {
        fs.writeSync(1, `Hook promiseResolve ${asyncId}\n`)
    }
};

// Create a new AsyncHooks instance
const asyncHook = asyncHooks.createHook(hooks);
asyncHook.enable();