import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { directoryPaths, directorySchemas } from '../config/directory.openapi';

const router = Router();

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'GDGOC Club Task Management API',
    version: '1.0.0',
    description: 'REST API contract for the GDGOC Club Task Management System',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Base',
    },
  ],
  components: {
    securitySchemes: { sessionCookie: { type: 'apiKey', in: 'cookie', name: 'gdgoc.sid' } },
    schemas: directorySchemas,
  },
  paths: {
    ...directoryPaths,
    '/health': {
      get: {
        summary: 'Health check endpoint',
        responses: {
          '200': { description: 'Server is healthy' },
        },
      },
    },
    '/tasks': {
      get: {
        summary: 'List tasks within the authenticated user team scope',
        security: [{ sessionCookie: [] }],
        parameters: [
          { name: 'teamId', in: 'query', schema: { type: 'string' } },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['FREE', 'ASSIGNED', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
            },
          },
          { name: 'scope', in: 'query', schema: { type: 'string', enum: ['TEAM', 'WHOLE_CLUB'] } },
        ],
        responses: {
          '200': { description: 'Array of tasks' },
        },
      },
      post: {
        summary: 'Create a new task (Admins/Heads)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
                  scope: { type: 'string', enum: ['TEAM', 'WHOLE_CLUB'] },
                  teamId: { type: 'string' },
                  deadline: { type: 'string', format: 'date-time' },
                  tags: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Task created successfully' },
          '400': { description: 'Validation error' },
          '401': { description: 'Authentication required' },
          '403': { description: 'Forbidden' },
        },
      },
    },
    '/tasks/{id}/claim': {
      post: {
        summary: 'Atomically claim a Free task',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Task claimed' },
          '403': { description: 'Team mismatch' },
          '409': { description: 'Conflict: Already claimed' },
        },
      },
    },
    '/tasks/{id}/submit': {
      post: {
        summary: 'Submit task for review (IN_PROGRESS -> IN_REVIEW)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['prUrl'],
                properties: {
                  prUrl: { type: 'string', format: 'uri' },
                  note: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Submitted for review' },
        },
      },
    },
    '/tasks/{id}/review': {
      post: {
        summary: 'Approve or send back work (Admins)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['outcome'],
                properties: {
                  outcome: { type: 'string', enum: ['APPROVED', 'SENT_BACK'] },
                  reviewComment: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Review recorded' },
        },
      },
    },
    '/webhooks/github': {
      post: {
        summary: 'GitHub PR Webhook endpoint (HMAC SHA-256 verified)',
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
