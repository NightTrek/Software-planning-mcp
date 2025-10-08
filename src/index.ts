#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
  ListResourceTemplatesRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { storage } from './storage.js';
import { SEQUENTIAL_THINKING_PROMPT, formatPlanAsTodos } from './prompts.js';
import { Goal, Todo } from './types.js';

class SoftwarePlanningServer {
  private server: Server;
  private currentGoal: Goal | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'software-planning-tool',
        version: '0.1.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupResourceHandlers();
    this.setupToolHandlers();

    this.server.onerror = (error) => console.error('[MCP Error]', error);
  }

  private setupResourceHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'planning://current-goal',
          name: 'Current Goal',
          description: 'The current software development goal being planned',
          mimeType: 'application/json',
        },
        {
          uri: 'planning://implementation-plan',
          name: 'Implementation Plan',
          description: 'The current implementation plan with todos',
          mimeType: 'application/json',
        },
      ],
    }));

    this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
      resourceTemplates: [],
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      switch (request.params.uri) {
        case 'planning://current-goal': {
          if (!this.currentGoal) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'No active goal. Start a new planning session first.'
            );
          }
          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: 'application/json',
                text: JSON.stringify(this.currentGoal, null, 2),
              },
            ],
          };
        }
        case 'planning://implementation-plan': {
          if (!this.currentGoal) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'No active goal. Start a new planning session first.'
            );
          }
          const plan = await storage.getPlan(this.currentGoal.id);
          if (!plan) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'No implementation plan found for current goal.'
            );
          }
          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: 'application/json',
                text: JSON.stringify(plan, null, 2),
              },
            ],
          };
        }
        default:
          throw new McpError(
            ErrorCode.InvalidRequest,
            `Unknown resource URI: ${request.params.uri}`
          );
      }
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'start_planning',
          description: 'Start a new planning session with a goal',
          inputSchema: {
            type: 'object',
            properties: {
              goal: {
                type: 'string',
                description: 'The software development goal to plan',
              },
            },
            required: ['goal'],
          },
        },
        {
          name: 'save_plan',
          description: 'Save the current implementation plan',
          inputSchema: {
            type: 'object',
            properties: {
              plan: {
                type: 'string',
                description: 'The implementation plan text to save',
              },
            },
            required: ['plan'],
          },
        },
        {
          name: 'add_todo',
          description: 'Add a new todo item to the current plan',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Title of the todo item',
              },
              description: {
                type: 'string',
                description: 'Detailed description of the todo item',
              },
              complexity: {
                type: 'number',
                description: 'Complexity score (0-10)',
                minimum: 0,
                maximum: 10,
              },
              codeExample: {
                type: 'string',
                description: 'Optional code example',
              },
            },
            required: ['title', 'description', 'complexity'],
          },
        },
        {
          name: 'remove_todo',
          description: 'Remove a todo item from the current plan',
          inputSchema: {
            type: 'object',
            properties: {
              todoId: {
                type: 'string',
                description: 'ID of the todo item to remove',
              },
            },
            required: ['todoId'],
          },
        },
        {
          name: 'get_todos',
          description: 'Get all todos in the current plan',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'update_todo_status',
          description: 'Update the completion status of a todo item',
          inputSchema: {
            type: 'object',
            properties: {
              todoId: {
                type: 'string',
                description: 'ID of the todo item',
              },
              isComplete: {
                type: 'boolean',
                description: 'New completion status',
              },
            },
            required: ['todoId', 'isComplete'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'start_planning': {
          const { goal } = request.params.arguments as { goal: string };
          this.currentGoal = await storage.createGoal(goal);
          await storage.createPlan(this.currentGoal.id);

          return {
            content: [
              {
                type: 'text',
                text: SEQUENTIAL_THINKING_PROMPT,
              },
            ],
          };
        }

        case 'save_plan': {
          if (!this.currentGoal) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              'No active goal. Start a new planning session first.'
            );
          }

          const { plan } = request.params.arguments as { plan: string };
          const todos = formatPlanAsTodos(plan);

          for (const todo of todos) {
            await storage.addTodo(this.currentGoal.id, todo);
          }

          return {
            content: [
              {
                type: 'text',
                text: `Successfully saved ${todos.length} todo items to the implementation plan.`,
              },
            ],
          };
        }

        case 'add_todo': {
          if (!this.currentGoal) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              'No active goal. Start a new planning session first.'
            );
          }

          const todo = request.params.arguments as Omit<
            Todo,
            'id' | 'isComplete' | 'createdAt' | 'updatedAt'
          >;
          const newTodo = await storage.addTodo(this.currentGoal.id, todo);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(newTodo, null, 2),
              },
            ],
          };
        }

        case 'remove_todo': {
          if (!this.currentGoal) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              'No active goal. Start a new planning session first.'
            );
          }

          const { todoId } = request.params.arguments as { todoId: string };
          await storage.removeTodo(this.currentGoal.id, todoId);

          return {
            content: [
              {
                type: 'text',
                text: `Successfully removed todo ${todoId}`,
              },
            ],
          };
        }

        case 'get_todos': {
          if (!this.currentGoal) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              'No active goal. Start a new planning session first.'
            );
          }

          const todos = await storage.getTodos(this.currentGoal.id);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(todos, null, 2),
              },
            ],
          };
        }

        case 'update_todo_status': {
          if (!this.currentGoal) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              'No active goal. Start a new planning session first.'
            );
          }

          const { todoId, isComplete } = request.params.arguments as {
            todoId: string;
            isComplete: boolean;
          };
          const updatedTodo = await storage.updateTodoStatus(
            this.currentGoal.id,
            todoId,
            isComplete
          );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(updatedTodo, null, 2),
              },
            ],
          };
        }

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  async run() {
    await storage.initialize();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Software Planning MCP server running on stdio');
  }
}

const server = new SoftwarePlanningServer();
server.run().catch(console.error);
