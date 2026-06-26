const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'LeaderApp API',
      version: '1.0.0',
      description: 'Authentication flow documentation using Swagger',
    },
  },
  apis: ['./routes/*.js'], // Adjust path to where your route handlers are
};

const swaggerSpec = swaggerJSDoc(options);

function setupSwagger(app) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = setupSwagger;
