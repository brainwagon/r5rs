const Module = require('../web/scheme.js');

Module.onRuntimeInitialized = function() {
    const init_scheme = Module.cwrap('init_scheme', 'void', []);
    const exec_scheme = Module.cwrap('exec_scheme', 'string', ['string']);

    init_scheme();
    console.log("Initialized.");

    // Helper to run and check
    function test(name, code, expectedOutput) {
        console.log(`Running test: ${name}`);
        const output = exec_scheme(code);
        
        if (typeof output !== 'string' || output.trim() !== expectedOutput.trim()) {
            console.error(`  FAIL: Output mismatch. Expected:
---
${expectedOutput}
---
Got:
---
${output}
---`);
            process.exit(1);
        }
        console.log(`  PASS`);
    }

    // Basic arithmetic
    test("Addition", "(+ 1 2 3)", "6");
    
    // Prelude procedures
    test("Not", "(not #t)", "#f");
    test("Length", "(length '(1 2 3 4))", "4");
    
    // Output capture
    test("Display", "(display \"hello\")", "hello\n()");
    test("Newline", "(begin (display \"line1\") (newline) (display \"line2\"))", "line1\nline2\n()");

    // Definitions and Scoping
    test("Define and Ref", "(begin (define a 42) a)", "42");
    
    // Continuations
    test("Call/CC", "(+ 1 (call/cc (lambda (k) (k 10) 20)))", "11");

    // Error handling
    console.log("Running test: Error Handling");
    const errOutput = exec_scheme("(equal? 1)");
    if (typeof errOutput === 'string' && errOutput.includes("Error:")) {
        console.log("  PASS (Caught error)");
    } else {
        console.error(`  FAIL: Should have caught error for (equal? 1). Got: ${errOutput}`);
        process.exit(1);
    }

    console.log("ALL TESTS PASSED");
    process.exit(0);
};
