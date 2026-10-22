const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: object) => ({ 'application/json': { schema } });
const id = { name: 'id', in: 'path', required: true, schema: { type: 'string' } };
const statuses = ['FREE', 'ASSIGNED', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const metadata = {
  title: { type: 'string', minLength: 3, maxLength: 150 },
  description: { type: 'string', minLength: 10, maxLength: 10000 },
  priority: { type: 'string', enum: priorities },
  deadline: { type: 'string', format: 'date-time', nullable: true },
  tags: {
    type: 'array',
    maxItems: 10,
    items: { type: 'string', minLength: 1, maxLength: 32 },
    description: 'Trimmed, lowercased, and deduplicated',
  },
};
const taskEnvelope = (name = 'Task') => ({
  type: 'object',
  properties: { success: { type: 'boolean' }, data: ref(name) },
});
function action(
  summary: string,
  body?: object,
  response: object = taskEnvelope(),
  parameters: object[] = [id],
  status = '200',
) {
  return {
    summary,
    tags: ['Tasks'],
    security: [{ sessionCookie: [] }],
    parameters,
    ...(body && { requestBody: { required: true, content: json(body) } }),
    responses: {
      [status]: { description: 'Success', content: json(response) },
      '400': { description: 'Invalid input or ineligible assignee' },
      '401': { description: 'Session required' },
      '403': { description: 'Forbidden team scope, ownership, or self-review' },
      '404': { description: 'Task, team, or assignee not found' },
      '409': {
        description: 'Invalid lifecycle state or concurrent modification; refetch before retrying',
      },
    },
  };
}
export const taskPaths = {
  '/tasks': {
    get: action(
      'List visible tasks with pagination and board filters',
      undefined,
      {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          count: { type: 'integer', description: 'Number of records in this page' },
          data: { type: 'array', items: ref('Task') },
          pagination: ref('Pagination'),
        },
      },
      [
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
        ...['teamId', 'assigneeId', 'search', 'tag'].map((name) => ({
          name,
          in: 'query',
          schema: { type: 'string' },
        })),
        { name: 'status', in: 'query', schema: { type: 'string', enum: statuses } },
        { name: 'priority', in: 'query', schema: { type: 'string', enum: priorities } },
        { name: 'scope', in: 'query', schema: { type: 'string', enum: ['TEAM', 'WHOLE_CLUB'] } },
      ],
    ),
    post: action(
      'Create a task in an authorized team or club scope',
      {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'description'],
        properties: {
          ...metadata,
          scope: { type: 'string', enum: ['TEAM', 'WHOLE_CLUB'] },
          teamId: { type: 'string', nullable: true },
          assigneeId: { type: 'string', nullable: true },
        },
      },
      taskEnvelope(),
      [],
      '201',
    ),
  },
  '/tasks/{id}': {
    get: action(
      'Read task details, submission attempts, and activity',
      undefined,
      taskEnvelope('TaskDetail'),
    ),
    patch: action('Edit metadata while Free, Assigned, or In Progress', {
      type: 'object',
      additionalProperties: false,
      minProperties: 1,
      properties: metadata,
    }),
    delete: action('Soft-delete a task while Free, Assigned, or In Progress'),
  },
  '/tasks/{id}/assign': {
    post: action('Assign/reassign an eligible user, or unassign with null', {
      type: 'object',
      additionalProperties: false,
      required: ['assigneeId'],
      properties: { assigneeId: { type: 'string', nullable: true } },
    }),
  },
  '/tasks/{id}/claim': { post: action('Claim a Free task atomically') },
  '/tasks/{id}/start': { post: action('Start an Assigned task as its assignee') },
  '/tasks/{id}/submit': {
    post: action('Submit in-progress work with a PR URL or note', {
      type: 'object',
      additionalProperties: false,
      anyOf: [{ required: ['prUrl'] }, { required: ['note'] }],
      properties: {
        prUrl: {
          type: 'string',
          format: 'uri',
          description:
            'HTTPS github.com/<owner>/<repo>/pull/<number>; query and fragment are removed',
        },
        note: { type: 'string', minLength: 1, maxLength: 2000 },
      },
    }),
  },
  '/tasks/{id}/review': {
    post: action('Approve or send back work; self-review forbidden', {
      type: 'object',
      additionalProperties: false,
      required: ['outcome'],
      properties: {
        outcome: { type: 'string', enum: ['APPROVED', 'SENT_BACK'] },
        reviewComment: { type: 'string', minLength: 1, maxLength: 2000 },
      },
      oneOf: [
        { properties: { outcome: { enum: ['APPROVED'] } } },
        { properties: { outcome: { enum: ['SENT_BACK'] } }, required: ['reviewComment'] },
      ],
    }),
  },
};

export const taskSchemas = {
  Task: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      ...metadata,
      status: { type: 'string', enum: statuses },
      scope: { type: 'string', enum: ['TEAM', 'WHOLE_CLUB'] },
      teamId: { type: 'string', nullable: true },
      creatorId: { type: 'string' },
      assigneeId: { type: 'string', nullable: true },
      completedById: { type: 'string', nullable: true },
      approvedById: { type: 'string', nullable: true },
      completedAt: { type: 'string', format: 'date-time', nullable: true },
      isOnTime: { type: 'boolean', nullable: true },
      isDeleted: { type: 'boolean' },
      deletedAt: { type: 'string', format: 'date-time', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      team: {
        type: 'object',
        nullable: true,
        properties: { id: { type: 'string' }, name: { type: 'string' }, slug: { type: 'string' } },
      },
      creator: ref('TaskUser'),
      assignee: { allOf: [ref('TaskUser')], nullable: true },
      submissions: {
        type: 'array',
        items: ref('TaskSubmission'),
        description: 'Latest attempt in list/mutation responses; all attempts in detail',
      },
    },
  },
  TaskUser: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
      githubUsername: { type: 'string', nullable: true },
    },
  },
  TaskSubmission: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      taskId: { type: 'string' },
      memberId: { type: 'string' },
      note: { type: 'string', nullable: true },
      prUrl: { type: 'string', nullable: true },
      submittedAt: { type: 'string', format: 'date-time' },
      reviewerId: { type: 'string', nullable: true },
      outcome: { type: 'string', enum: ['APPROVED', 'SENT_BACK'], nullable: true },
      reviewComment: { type: 'string', nullable: true },
      reviewedAt: { type: 'string', format: 'date-time', nullable: true },
    },
  },
  TaskDetail: {
    allOf: [
      ref('Task'),
      {
        type: 'object',
        properties: {
          completedBy: { allOf: [ref('TaskUser')], nullable: true },
          approvedBy: { allOf: [ref('TaskUser')], nullable: true },
          activities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                taskId: { type: 'string' },
                actorId: { type: 'string' },
                action: { type: 'string' },
                oldValue: { type: 'string', nullable: true },
                newValue: { type: 'string', nullable: true },
                details: { type: 'object', nullable: true, additionalProperties: true },
                timestamp: { type: 'string', format: 'date-time' },
                actor: {
                  type: 'object',
                  properties: { id: { type: 'string' }, name: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    ],
  },
};
