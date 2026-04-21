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
      name: 'Public',
      description: 'Public read surfaces.',
    },
    {
      name: 'Ops',
      description: 'Internal cron and health-check endpoints.',
    },
  ],
  paths: {
    '/b/{slug}': {
      get: {
        tags: ['Public'],
        summary: 'Public pet profile page',
        description:
          'Returns the public HTML profile for a pet when `pets.is_public=true`. This is not a JSON API.',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              pattern: '^[a-z0-9][a-z0-9-]{2,29}$',
            },
          },
        ],
        responses: {
          '200': {
            description: 'HTML public profile page.',
            content: {
              'text/html': {
                schema: {
                  type: 'string',
                },
              },
            },
          },
          '404': {
            description: 'Pet does not exist or is not public.',
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
