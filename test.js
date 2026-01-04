const express = require('express');
const Joi = require('joi');
const AutoDocer = require('./index');

const app = express();
app.use(express.json());

// 1. Initialize AutoDoc
const autodoc = new AutoDocer({ title: 'Node Production API', version: '2.5.0' });

// 2. Define a Schema
const UserSchema = Joi.object({
    username: Joi.string().required(),
    age: Joi.number().integer(),
    email: Joi.string().email()
});

// 3. Register a Route using the Library
app.post('/users', autodoc.doc('POST', '/users', {
    summary: 'Create a new user',
    body: UserSchema
}, (req, res) => {
    res.json({ status: 'User Created', id: 123 });
}));

// 4. Expose the Spec
app.get('/autodoc/openapi.json', (req, res) => autodoc.serveEndpoint(req, res));

app.listen(3000, () => {
    console.log('Node Test running on port 3000');

    // NEW: Register with the phone book!
    autodoc.register('node-service', 'http://localhost:3000');
});