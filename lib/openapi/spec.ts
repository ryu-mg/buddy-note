export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'buddy-note API',
    version: '0.1.0',
    description:
      'buddy-note internal Route Handler API. User-facing writes are mostly handled by Next.js Server Actions, so this spec focuses on public read and ops endpoints.',
  },
  servers: [
    {
      url: '/',
      description: 'Current origin',
    },
    {
      url: 'http://localhost:4000',
      description: 'Local development',
    },
  ],
  tags: [
    {
      name: 'Docs',
      description: 'Interactive API documentation.',
    },
    {
      name: 'Auth',
      description: 'Supabase auth redirect helpers.',
    },
    {
      name: 'Public',
      description: 'Public read surfaces.',
    },
    {
      name: 'Ops',
      description: 'Internal cron and health-check endpoints.',
    },
  ],
  paths: {
    '/api-docs': {
      get: {
        tags: ['Docs'],
        summary: 'Swagger UI',
        description: 'Returns the interactive Swagger UI HTML page.',
        responses: {
          '200': {
            description: 'Swagger UI HTML.',
            content: {
              'text/html': {
                schema: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
    '/api/openapi.json': {
      get: {
        tags: ['Docs'],
        summary: 'OpenAPI document',
        description: 'Returns the OpenAPI 3.1 JSON document used by `/api-docs`.',
        responses: {
          '200': {
            description: 'OpenAPI JSON document.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
        },
      },
    },
    '/auth/callback': {
      get: {
        tags: ['Auth'],
        summary: 'Supabase auth callback',
        description:
          'Exchanges a Supabase auth code for a session, then redirects new users to onboarding and returning users to home. On auth errors, redirects to login with an error query.',
        parameters: [
          {
            name: 'code',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
            },
          },
          {
            name: 'error_description',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '307': {
            description:
              'Redirects to `/`, `/onboarding`, or `/auth/login?error=...`.',
          },
        },
      },
    },
    '/auth/signout': {
      post: {
        tags: ['Auth'],
        summary: 'Sign out current session',
        description:
          'Signs out the current Supabase session when available, then redirects to `/`.',
        responses: {
          '303': {
            description: 'Redirects to `/` after signout.',
          },
        },
      },
    },
    '/api/memory/process': {
      post: {
        tags: ['Ops'],
        summary: 'Process memory update queue',
        description:
          'Internal worker endpoint called by Supabase pg_cron + pg_net. Drains `memory_update_queue` and updates `pet_memory_summary`.',
        security: [{ memoryWorkerBearer: [] }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
              },
              example: {},
            },
          },
        },
        responses: {
          '200': {
            description: 'Queue batch processed.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/MemoryProcessSuccess',
                },
              },
            },
          },
          '401': {
            description: 'Missing or invalid `MEMORY_WORKER_SECRET` bearer token.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '429': {
            description: 'Worker route rate limit exceeded.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '500': {
            description: 'Supabase env, RPC, or processing failure.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/cleanup/orphan-images': {
      get: {
        tags: ['Ops'],
        summary: 'Clean orphan diary share images',
        description:
          'Scans the public `diary-images` bucket and removes objects that are not referenced by `diaries.image_url_*`.',
        security: [{ cronBearer: [] }],
        parameters: [
          {
            name: 'dryRun',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['0', '1'],
              default: '0',
            },
            description: '`1` returns counts without deleting objects.',
          },
        ],
        responses: {
          '200': {
            description: 'Cleanup completed.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/OrphanCleanupSuccess',
                },
              },
            },
          },
          '401': {
            description:
              'Missing or invalid `DIARY_IMAGE_CLEANUP_SECRET` / `CRON_SECRET` bearer token.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '500': {
            description: 'Storage list/delete or database read failure.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '503': {
            description: 'Supabase service role env is missing.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Ops'],
        summary: 'Clean orphan diary share images',
        description:
          'Same behavior as GET. POST is supported for cron callers that prefer non-GET jobs.',
        security: [{ cronBearer: [] }],
        parameters: [
          {
            name: 'dryRun',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['0', '1'],
              default: '0',
            },
            description: '`1` returns counts without deleting objects.',
          },
        ],
        responses: {
          '200': {
            description: 'Cleanup completed.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/OrphanCleanupSuccess',
                },
              },
            },
          },
          '401': {
            description:
              'Missing or invalid `DIARY_IMAGE_CLEANUP_SECRET` / `CRON_SECRET` bearer token.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '500': {
            description: 'Storage list/delete or database read failure.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '503': {
            description: 'Supabase service role env is missing.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/health/llm': {
      get: {
        tags: ['Ops'],
        summary: 'Check Anthropic LLM health',
        description:
          'Pings the configured diary model. On failure, sends a Discord alert when `DISCORD_WEBHOOK_URL` is configured.',
        security: [{ cronBearer: [] }],
        responses: {
          '200': {
            description: 'LLM health check passed.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LlmHealthSuccess',
                },
              },
            },
          },
          '401': {
            description:
              'Missing or invalid `LLM_HEALTH_SECRET` / `CRON_SECRET` bearer token.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '502': {
            description: 'Anthropic request failed or returned an empty response.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LlmHealthFailure',
                },
              },
            },
          },
          '503': {
            description: '`ANTHROPIC_API_KEY` is missing.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LlmHealthFailure',
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Ops'],
        summary: 'Check Anthropic LLM health',
        description:
          'Same behavior as GET. POST is supported for cron callers that prefer non-GET jobs.',
        security: [{ cronBearer: [] }],
        responses: {
          '200': {
            description: 'LLM health check passed.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LlmHealthSuccess',
                },
              },
            },
          },
          '401': {
            description:
              'Missing or invalid `LLM_HEALTH_SECRET` / `CRON_SECRET` bearer token.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '502': {
            description: 'Anthropic request failed or returned an empty response.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LlmHealthFailure',
                },
              },
            },
          },
          '503': {
            description: '`ANTHROPIC_API_KEY` is missing.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LlmHealthFailure',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      memoryWorkerBearer: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'MEMORY_WORKER_SECRET',
      },
      cronBearer: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'CRON_SECRET',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        required: ['ok', 'error'],
        properties: {
          ok: {
            type: 'boolean',
            const: false,
          },
          error: {
            type: 'string',
          },
          detail: {
            type: 'string',
          },
        },
      },
      MemoryProcessSuccess: {
        type: 'object',
        required: ['ok', 'processed', 'succeeded', 'failed', 'skipped'],
        properties: {
          ok: {
            type: 'boolean',
            const: true,
          },
          processed: {
            type: 'integer',
            minimum: 0,
          },
          succeeded: {
            type: 'integer',
            minimum: 0,
          },
          failed: {
            type: 'integer',
            minimum: 0,
          },
          skipped: {
            type: 'integer',
            minimum: 0,
          },
        },
      },
      OrphanCleanupSuccess: {
        type: 'object',
        required: ['ok', 'dryRun', 'scanned', 'referenced', 'orphaned', 'removed'],
        properties: {
          ok: {
            type: 'boolean',
            const: true,
          },
          dryRun: {
            type: 'boolean',
          },
          scanned: {
            type: 'integer',
            minimum: 0,
          },
          referenced: {
            type: 'integer',
            minimum: 0,
          },
          orphaned: {
            type: 'integer',
            minimum: 0,
          },
          removed: {
            type: 'integer',
            minimum: 0,
          },
        },
      },
      LlmHealthSuccess: {
        type: 'object',
        required: ['ok', 'model', 'latencyMs', 'tokensInput', 'tokensOutput'],
        properties: {
          ok: {
            type: 'boolean',
            const: true,
          },
          model: {
            type: 'string',
          },
          latencyMs: {
            type: 'integer',
            minimum: 0,
          },
          tokensInput: {
            type: 'integer',
            minimum: 0,
          },
          tokensOutput: {
            type: 'integer',
            minimum: 0,
          },
        },
      },
      LlmHealthFailure: {
        type: 'object',
        required: ['ok', 'error', 'notified'],
        properties: {
          ok: {
            type: 'boolean',
            const: false,
          },
          error: {
            type: 'string',
          },
          model: {
            type: 'string',
          },
          latencyMs: {
            type: 'integer',
            minimum: 0,
          },
          notified: {
            type: 'boolean',
          },
        },
      },
    },
  },
} as const
