const Module = require('../web/scheme.js');

Module.onRuntimeInitialized = function() {
    const init_scheme = Module.cwrap('init_scheme', 'void', []);
    const exec_scheme = Module.cwrap('exec_scheme', 'string', ['string']);

    init_scheme();
    console.log("Initialized.");

    const res1 = exec_scheme("(+ 1 2)");
    console.log("Result 1: " + res1);
    if (res1 !== "3") {
        console.error("FAIL: (+ 1 2) should be 3");
        process.exit(1);
    }

    const res2 = exec_scheme("(define x 10) x");
    console.log("Result 2: " + JSON.stringify(res2));
    if (res2 !== "()\n10") {
        console.error("FAIL: (define x 10) x should be '()\\n10'");
        process.exit(1);
    }

    console.log("PASS");
    process.exit(0);
};
