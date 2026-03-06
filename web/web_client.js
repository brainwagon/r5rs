// web_client.js - Main thread client for the Scheme Web Worker

class SchemeClient {
    constructor(workerPath = 'web_worker.js') {
        this.worker = new Worker(workerPath);
        this.pendingRequests = new Map();
        this.nextId = 0;

        this.worker.onmessage = (e) => {
            const { type, payload, id } = e.data;
            if (this.pendingRequests.has(id)) {
                const { resolve, reject } = this.pendingRequests.get(id);
                this.pendingRequests.delete(id);
                if (type === 'RESULT') {
                    resolve(payload);
                } else {
                    reject(payload);
                }
            }
        };

        this.worker.onerror = (e) => {
            console.error('Worker error:', e);
        };
    }

    execute(code) {
        return new Promise((resolve, reject) => {
            const id = this.nextId++;
            this.pendingRequests.set(id, { resolve, reject });
            this.worker.postMessage({ type: 'EXEC', payload: code, id: id });
        });
    }
}

// Export for use in index.html or other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SchemeClient;
}
