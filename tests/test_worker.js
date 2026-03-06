// tests/test_worker.js - Verification for SchemeClient and WebWorker interaction
const { Worker, isMainThread, parentPort } = require('worker_threads');
const fs = require('fs');
const path = require('path');

// Since we are in Node.js, we need to adapt the browser-style Worker
if (isMainThread) {
    // Mock for the browser's SchemeClient environment
    class NodeSchemeClient {
        constructor(workerPath) {
            this.worker = new Worker(workerPath);
            this.pendingRequests = new Map();
            this.nextId = 0;

            this.worker.on('message', (data) => {
                const { type, payload, id } = data;
                if (this.pendingRequests.has(id)) {
                    const { resolve, reject } = this.pendingRequests.get(id);
                    this.pendingRequests.delete(id);
                    if (type === 'RESULT') {
                        resolve(payload);
                    } else {
                        reject(payload);
                    }
                }
            });

            this.worker.on('error', (e) => {
                console.error('Worker error:', e);
            });
        }

        execute(code) {
            return new Promise((resolve, reject) => {
                const id = this.nextId++;
                this.pendingRequests.set(id, { resolve, reject });
                this.worker.postMessage({ type: 'EXEC', payload: code, id: id });
            });
        }

        terminate() {
            return this.worker.terminate();
        }
    }

    async function runTest() {
        console.log("Starting WebWorker interaction test...");
        const client = new NodeSchemeClient(path.join(__dirname, 'test_worker.js'));

        try {
            const res1 = await client.execute("(+ 1 2)");
            console.log("Result 1: " + JSON.stringify(res1));
            if (res1.result.trim() !== "3") throw new Error("FAIL: (+ 1 2) should be 3");

            const res2 = await client.execute("(display \"hello\")");
            console.log("Result 2: " + JSON.stringify(res2));
            if (res2.output !== "hello") throw new Error("FAIL: (display \"hello\") output should be 'hello'");

            console.log("PASS");
            await client.terminate();
            process.exit(0);
        } catch (err) {
            console.error("Test failed:", err);
            await client.terminate();
            process.exit(1);
        }
    }

    runTest();
} else {
    // Mock for the browser's web_worker.js environment in Node.js worker_threads
    const Module = require('../web/scheme.js');

    // Emulate importScripts behavior (minimal)
    global.Module = Module;

    let initPromise = new Promise((resolve) => {
        Module.onRuntimeInitialized = () => {
            const init_scheme = Module.cwrap('init_scheme', 'void', []);
            init_scheme();
            resolve();
        };
    });

    const exec_scheme = Module.cwrap('exec_scheme', 'string', ['string']);
    const get_output = Module.cwrap('get_output', 'string', []);

    parentPort.on('message', async (data) => {
        const { type, payload, id } = data;
        
        await initPromise;

        if (type === 'EXEC') {
            try {
                const result = exec_scheme(payload);
                const output = get_output();
                parentPort.postMessage({ type: 'RESULT', payload: { result, output }, id: id });
            } catch (err) {
                parentPort.postMessage({ type: 'ERROR', payload: err.toString(), id: id });
            }
        }
    });
}
