const axios = require('axios');
const listEndpoints = require('express-list-endpoints');

class AutoDocer {
    constructor(config = {}) {
        this.config = {
            projectName: config.title || 'Untitled API',
            aggregatorUrl: config.aggregatorUrl || 'http://localhost:8080/api/docs', // Default to your Go Backend
            debug: config.debug || false
        };
    }

    /**
     * Middleware to initialize scanning
     * @param {Object} app - Express App instance
     * @param {Object} options - Runtime options
     */
    init(app, options = {}) {
        this.config = { ...this.config, ...options };

        if (this.config.debug) console.log(`🚀 [AutoDocer] Initialized for: ${this.config.projectName}`);

        // Wait for routes to be registered, then scan
        setTimeout(() => {
            this.scanRoutes(app);
        }, 2000);

        // Return a pass-through middleware
        return (req, res, next) => next();
    }

    async scanRoutes(app) {
        try {
            if (this.config.debug) console.log('🕵️‍♂️ [AutoDocer] Scanning routes...');

            // 1. Get Endpoints
            const endpoints = listEndpoints(app);
            const paths = {};

            // 2. Format as OpenAPI Paths
            endpoints.forEach(endpoint => {
                endpoint.methods.forEach(method => {
                    const path = endpoint.path;
                    const verb = method.toLowerCase();
                    
                    if (!paths[path]) paths[path] = {};
                    
                    // Generate basic doc structure
                    paths[path][verb] = {
                        summary: `Auto-detected ${verb.toUpperCase()} ${path}`,
                        tags: [this.config.projectName],
                        responses: {
                            "200": { description: "Successful response" }
                        }
                    };
                });
            });

            // 3. Build Payload
            const payload = {
                serviceName: this.config.projectName,
                url: "http://localhost:3000", // In production, this should be dynamic or env var
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
            
            console.log(`✅ [AutoDocer] Documentation synced successfully!`);

        } catch (error) {
            if (this.config.debug) {
                console.error('❌ [AutoDocer] Sync Failed:', error.message);
                if (error.response) console.error('Response:', error.response.data);
            }
        }
    }

    // Helper for manual route documentation (Optional usage)
    doc(method, path, schema, handler) {
        return handler; 
    }
}

module.exports = new AutoDocer();