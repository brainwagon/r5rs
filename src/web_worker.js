// web_worker.js - Host for the Scheme interpreter

// In a real environment, this might be imported via importScripts if not using a bundler
// For now, we assume the build process might combine them or we use absolute paths in the final deployment.
// Since we used SINGLE_FILE=1, scheme.js contains everything.
importScripts('scheme.js'); 

let initPromise = new Promise((resolve) => {
    Module.onRuntimeInitialized = () => {
        const init_scheme = Module.cwrap('init_scheme', 'void', []);
        init_scheme();
        resolve();
    };
});

const exec_scheme = Module.cwrap('exec_scheme', 'string', ['string']);
const get_output = Module.cwrap('get_output', 'string', []);

self.onmessage = async function(e) {
    const { type, payload, id } = e.data;
    
    await initPromise;

    if (type === 'EXEC') {
        try {
            const result = exec_scheme(payload);
            const output = get_output();
            self.postMessage({ type: 'RESULT', payload: { result, output }, id: id });
        } catch (err) {
            self.postMessage({ type: 'ERROR', payload: err.toString(), id: id });
        }
    }
};
