const axios = require('axios');
const listEndpoints = require('express-list-endpoints');

class AutoDocer {
    constructor() {
        // Default Configuration
        this.config = {
            projectName: 'Untitled API',
            // Users can override this to point to your hosted APISpace later
            aggregatorUrl: 'http://localhost:8080/api/docs', 
            debug: false
        };
    }

    /**
     * Initialize the AutoDocer Middleware
     * @param {Object} app - The Express App instance
     * @param {Object} options - Configuration options { projectName, aggregatorUrl, debug }
     */
    init(app, options = {}) {
        this.config = { ...this.config, ...options };

        if (this.config.debug) {
            console.log(`🚀 [AutoDocer] Initialized for: ${this.config.projectName}`);
        }

        // Wait a moment for all routes to be registered, then scan
        setTimeout(() => {
            this._scanAndSend(app);
        }, 2000);

        // Return a pass-through middleware (standard practice)
        return (req, res, next) => next();
    }

    async _scanAndSend(app) {
        try {
            if (this.config.debug) console.log('🕵️‍♂️ [AutoDocer] Scanning routes...');

            // 1. Get Endpoints securely using the helper library
            const endpoints = listEndpoints(app);
            const paths = {};

            // 2. Format endpoints into OpenAPI structure
            endpoints.forEach(endpoint => {
                endpoint.methods.forEach(method => {
                    const path = endpoint.path;
                    const verb = method.toLowerCase();
                    
                    if (!paths[path]) paths[path] = {};
                    
                    paths[path][verb] = {
                        summary: `Auto-detected ${verb.toUpperCase()} ${path}`,
                        tags: [this.config.projectName],
                        responses: {
                            "200": { description: "Successful response" }
                        }
                    };
                });
            });

            // 3. Build the Payload for your Backend
            const payload = {
                serviceName: this.config.projectName,
                url: "http://localhost:3000", // In a future update, detect this dynamically
                spec: {
                    openapi: "3.0.0",
                    info: { 
                        title: this.config.projectName, 
                        version: "1.0.0" 
                    },
                    paths: paths
                }
            };

            // 4. Send to APISpace Backend
            if (this.config.debug) console.log(`📤 Sending docs to ${this.config.aggregatorUrl}...`);
            
            await axios.post(this.config.aggregatorUrl, payload);
            
            console.log(`✅ [AutoDocer] Docs synced for "${this.config.projectName}"`);

        } catch (error) {
            if (this.config.debug) {
                console.error('❌ [AutoDocer] Sync Failed:', error.message);
                if (error.code === 'ECONNREFUSED') {
                    console.error('   -> Check if your APISpace backend is running.');
                }
            }
        }
    }
}

module.exports = new AutoDocer();
