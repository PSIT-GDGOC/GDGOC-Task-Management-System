import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { directoryPaths, directorySchemas } from '../config/directory.openapi';
import { taskPaths, taskSchemas } from '../config/task.openapi';

const router = Router();
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'GDGOC Club Task Management API',
    version: '1.0.0',
    description: 'REST API contract for the GDGOC Club Task Management System',
  },
  servers: [{ url: '/api/v1', description: 'API v1 Base' }],
  components: {
    securitySchemes: { sessionCookie: { type: 'apiKey', in: 'cookie', name: 'gdgoc.sid' } },
    schemas: { ...directorySchemas, ...taskSchemas },
  },
  paths: {
    ...directoryPaths,
    ...taskPaths,
    '/health': {
      get: {
        summary: 'Health check endpoint',
        servers: [{ url: '/' }],
        responses: { '200': { description: 'Server is healthy' } },
      },
    },
    '/webhooks/github': {
      post: {
        summary: 'GitHub PR webhook (HMAC SHA-256 verified)',
        responses: {
          '200': { description: 'Webhook processed' },
          '401': { description: 'Invalid signature' },
        },
      },
    },
  },
};
router.get('/openapi.json', (_req, res) => res.json(swaggerDocument));
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerDocument));
export default router;
