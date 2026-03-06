// web_worker.js - Host for the Scheme interpreter

// Initialize Module object BEFORE loading scheme.js
self.Module = {
    onRuntimeInitialized: () => {
        const init_scheme = Module.cwrap('init_scheme', 'void', []);
        init_scheme();
        self.workerReady = true;
        if (self.onWorkerReady) self.onWorkerReady();
    },
    print: (text) => {
        console.log('Wasm output:', text);
    },
    printErr: (text) => {
        console.error('Wasm error:', text);
    }
};

importScripts('scheme.js'); 

const initPromise = new Promise((resolve) => {
    if (self.workerReady) {
        resolve();
    } else {
        self.onWorkerReady = resolve;
    }
});

self.onmessage = async function(e) {
    const { type, payload, id } = e.data;
    
    await initPromise;

    if (type === 'EXEC') {
        try {
            // Re-wrap here to ensure Module is fully ready
            const exec_scheme = Module.cwrap('exec_scheme', 'string', ['string']);
            const result = exec_scheme(payload);
            self.postMessage({ type: 'RESULT', payload: result, id: id });
        } catch (err) {
            self.postMessage({ type: 'ERROR', payload: err.toString(), id: id });
        }
    }
};
