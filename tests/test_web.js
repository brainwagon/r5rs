const Module = require('../web/scheme.js');

Module.onRuntimeInitialized = function() {
    const init_scheme = Module.cwrap('init_scheme', 'void', []);
    const exec_scheme = Module.cwrap('exec_scheme', 'string', ['string']);
    const get_output = Module.cwrap('get_output', 'string', []);

    init_scheme();
    console.log("Initialized.");

    const res1 = exec_scheme("(+ 1 2)");
    console.log("Result 1: " + res1);
    if (res1.trim() !== "3") {
        console.error("FAIL: (+ 1 2) should be 3");
        process.exit(1);
    }

    const res2 = exec_scheme("(display \"hello\")");
    const out2 = get_output();
    console.log("Result 2: " + res2);
    console.log("Output 2: " + out2);
    if (out2 !== "hello") {
        console.error("FAIL: (display \"hello\") output should be 'hello'");
        process.exit(1);
    }

    console.log("PASS");
    process.exit(0);
};
