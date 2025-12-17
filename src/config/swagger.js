const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vintage Clothing Platform API',
      version: '1.0.0',
      description: 'API для платформи продажу вінтажного одягу',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Введіть JWT токен'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['USER', 'SELLER', 'ADMIN'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            size: { type: 'string' },
            color: { type: 'string' },
            condition: { type: 'string', enum: ['NEW_WITH_TAGS', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'] },
            status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'SOLD', 'ARCHIVED'] }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
            hasNextPage: { type: 'boolean' },
            hasPrevPage: { type: 'boolean' }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Аутентифікація та авторизація' },
      { name: 'Users', description: 'Управління користувачами' },
      { name: 'Products', description: 'Управління товарами' },
      { name: 'Categories', description: 'Управління категоріями' },
      { name: 'Orders', description: 'Управління замовленнями' },
      { name: 'Reviews', description: 'Відгуки' },
      { name: 'Files', description: 'Завантаження файлів' }
    ]
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;