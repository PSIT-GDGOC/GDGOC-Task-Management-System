const reference = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: object) => ({ 'application/json': { schema } });
const pathParameter = (name: string) => ({
  name,
  in: 'path',
  required: true,
  schema: { type: 'string' },
});
const paginationParameters = [
  {
    name: 'page',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: 100000, default: 1 },
  },
  {
    name: 'limit',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
  },
];
const envelope = (name: string) => ({
  type: 'object',
  properties: { success: { type: 'boolean' }, data: reference(name) },
});
const paginated = (name: string) => ({
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: { type: 'array', items: reference(name) },
    pagination: reference('Pagination'),
  },
});
function operation(
  summary: string,
  responseSchema: object,
  parameters: object[] = [],
  body?: object,
  status = '200',
) {
  return {
    summary,
    tags: ['Users and teams'],
    security: [{ sessionCookie: [] }],
    parameters,
    ...(body && { requestBody: { required: true, content: json(body) } }),
    responses: {
      [status]: { description: 'Success', content: json(responseSchema) },
      '400': { description: 'Invalid request' },
      '401': { description: 'Session required' },
      '403': { description: 'Insufficient role or team permissions' },
      '404': { description: 'Record not found' },
      '409': { description: 'Conflicting data or active task assignments' },
    },
  };
}
const teamInput = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 2, maxLength: 80 },
    slug: { type: 'string', minLength: 2, maxLength: 80, pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
    description: { type: 'string', nullable: true, maxLength: 1000 },
  },
};

export const directoryPaths = {
  '/users/me': {
    get: operation('Read own profile and memberships', envelope('UserProfile')),
    patch: operation('Update own position or GitHub username', envelope('UserProfile'), [], {
      type: 'object',
      minProperties: 1,
      additionalProperties: false,
      properties: {
        position: { type: 'string', nullable: true, minLength: 1, maxLength: 100 },
        githubUsername: {
          type: 'string',
          nullable: true,
          maxLength: 39,
          pattern: '^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$',
        },
      },
    }),
  },
  '/users': {
    get: operation('List members within managed team scope', paginated('UserProfile'), [
      ...paginationParameters,
      ...['search', 'teamId'].map((name) => ({ name, in: 'query', schema: { type: 'string' } })),
      {
        name: 'role',
        in: 'query',
        schema: { type: 'string', enum: ['USER', 'ADMIN', 'PRESIDENT', 'SYSTEM_OWNER'] },
      },
      { name: 'isActive', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
    ]),
  },
  '/users/{userId}/status': {
    patch: operation(
      'Activate/deactivate an ordinary member or admin (club managers)',
      envelope('UserProfile'),
      [pathParameter('userId')],
      {
        type: 'object',
        additionalProperties: false,
        required: ['isActive'],
        properties: { isActive: { type: 'boolean' } },
      },
    ),
  },
  '/teams': {
    get: operation(
      'List team summaries (any signed-in user)',
      paginated('Team'),
      paginationParameters,
    ),
    post: operation(
      'Create a team (club managers)',
      envelope('Team'),
      [],
      { ...teamInput, required: ['name', 'slug'] },
      '201',
    ),
  },
  '/teams/{teamId}': {
    get: operation('Read a team summary', envelope('Team'), [pathParameter('teamId')]),
    patch: operation('Edit a team (club managers)', envelope('Team'), [pathParameter('teamId')], {
      ...teamInput,
      minProperties: 1,
    }),
  },
  '/teams/{teamId}/members': {
    get: operation(
      'Read own team roster or any roster as a club manager',
      paginated('RosterMembership'),
      [pathParameter('teamId'), ...paginationParameters],
    ),
  },
  '/teams/{teamId}/members/{userId}': {
    put: operation(
      'Add a member or set head status (head appointments require club manager)',
      envelope('RosterMembership'),
      [pathParameter('teamId'), pathParameter('userId')],
      {
        type: 'object',
        additionalProperties: false,
        properties: { isTeamHead: { type: 'boolean' } },
      },
    ),
    delete: operation(
      'Remove a membership after reassigning active team tasks',
      { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
      [pathParameter('teamId'), pathParameter('userId')],
    ),
  },
};

export const directorySchemas = {
  Pagination: {
    type: 'object',
    properties: Object.fromEntries(
      ['page', 'limit', 'total', 'totalPages'].map((name) => [name, { type: 'integer' }]),
    ),
  },
  UserSummary: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      email: { type: 'string', format: 'email' },
      name: { type: 'string' },
      avatarUrl: { type: 'string', nullable: true },
      role: { type: 'string', enum: ['USER', 'ADMIN', 'PRESIDENT', 'SYSTEM_OWNER'] },
      position: { type: 'string', nullable: true },
      githubUsername: { type: 'string', nullable: true },
      isActive: { type: 'boolean' },
    },
  },
  UserProfile: {
    allOf: [
      reference('UserSummary'),
      {
        type: 'object',
        properties: {
          teamMemberships: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                teamId: { type: 'string' },
                isTeamHead: { type: 'boolean' },
                joinedAt: { type: 'string', format: 'date-time' },
                team: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    slug: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
  Team: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      slug: { type: 'string' },
      description: { type: 'string', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  RosterMembership: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      userId: { type: 'string' },
      teamId: { type: 'string' },
      isTeamHead: { type: 'boolean' },
      joinedAt: { type: 'string', format: 'date-time' },
      user: reference('UserSummary'),
    },
  },
};
