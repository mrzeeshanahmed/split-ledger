import swaggerJsdoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';

const options: Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Split Ledger API',
            version: '1.0.0',
            description: 'API documentation for the Split Ledger multi-tenant ledger and billing platform.',
            contact: {
                name: 'API Support',
                email: 'support@splitledger.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
            {
                url: 'https://api.splitledger.com',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Provide an access token to access protected endpoints. For programmatic access, you can also use an API key in the Authorization header: `Bearer <your_api_key>`.',
                },
            },
            parameters: {
                TenantIdHeader: {
                    in: 'header',
                    name: 'X-Tenant-ID',
                    schema: {
                        type: 'string',
                    },
                    required: true,
                    description: 'The Tenant ID or Subdomain for multi-tenant requests.',
                },
            },
            responses: {
                UnauthorizedError: {
                    description: 'Access token is missing or invalid',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    error: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'string', example: 'UNAUTHORIZED' },
                                            message: { type: 'string', example: 'Invalid or missing authentication token' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                NotFoundError: {
                    description: 'The requested resource was not found',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    error: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'string', example: 'NOT_FOUND' },
                                            message: { type: 'string', example: 'Resource not found' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                ValidationError: {
                    description: 'Invalid input parameters',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    error: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'string', example: 'VALIDATION_ERROR' },
                                            message: { type: 'string', example: 'Validation failed' },
                                            details: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        field: { type: 'string' },
                                                        message: { type: 'string' },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                TenantRequiredError: {
                    description: 'Tenant context is missing',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    error: {
                                        type: 'object',
                                        properties: {
                                            code: { type: 'string', example: 'TENANT_REQUIRED' },
                                            message: { type: 'string', example: 'Tenant identification is required' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // Path to the API docs
    apis: ['./src/routes/*.ts', './src/docs/*.yaml'], // Use yaml files or annotations in route files
};

export const swaggerSpec = swaggerJsdoc(options);
