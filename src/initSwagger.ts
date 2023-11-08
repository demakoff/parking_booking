import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const initSwagger = (app) => {
    const options = {
        definition: {
          openapi: "3.1.0",
          info: {
            title: "DDemakov Home assignment booking API",
            version: "0.0.1",
            description: "Parking spots booking REST API for (DBird)",
          },
          servers: [
            {
              url: "http://localhost:3000",
            },
          ],
        },
        apis: ["./src/routes/*"],
      };
      
      const specs = swaggerJsdoc(options);
      app.use(
        "/api-docs",
        express.static('node_modules/swagger-ui-dist/', {index: false}),
        swaggerUi.serve,
        swaggerUi.setup(specs)
      );
}

export default initSwagger;