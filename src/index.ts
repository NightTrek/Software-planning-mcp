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
} from '@modelcontextprotocol/sdk/types.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
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
        version: '2.0.0',
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
          name: 'list_software_plans',
          description: 'List all existing software plans in the current project. This should be the first step in the AI\'s decision-making process.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'create_new_plan',
          description: 'Create a new, independent software plan with a specific name and a top-level goal. This creates a new context for tasks and documentation.',
          inputSchema: {
            type: 'object',
            properties: {
              planName: {
                type: 'string',
                description: 'Name of the new plan (e.g., "feature-user-auth", "bugfix-payment-timeout")',
              },
              goal: {
                type: 'string',
                description: 'The top-level goal for this plan',
              },
            },
            required: ['planName', 'goal'],
          },
        },
        {
          name: 'set_active_plan',
          description: 'Set a specific plan as the active one. All subsequent operations (like adding todos or viewing plans) will target this active plan.',
          inputSchema: {
            type: 'object',
            properties: {
              planName: {
                type: 'string',
                description: 'Name of the plan to set as active',
              },
            },
            required: ['planName'],
          },
        },
        {
          name: 'start_planning',
          description: 'Acts as the main entry point to start planning a goal. The AI should use this to trigger the decision-making flow to determine if the goal belongs to an existing plan or requires a new one.',
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
          description: 'Save the implementation plan for the **currently active** software plan.',
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
          description: 'Add a new todo item to the **currently active** plan.',
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
          description: 'Remove a todo item from the **currently active** plan.',
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
          description: 'Get all todos in the **currently active** plan.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'update_todo_status',
          description: 'Update the completion status of a todo item in the **currently active** plan.',
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
        {
          name: 'view_plan',
          description: 'View the markdown content of the **currently active** project plan.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'view_tasks',
          description: 'View the markdown content of the **currently active** project tasks.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'set_working_directory',
          description: 'Set the working directory for the current session (where .cursor folder will be created)',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Absolute or relative path to the project directory',
              },
            },
            required: ['directory'],
          },
        },
        {
          name: 'get_working_directory',
          description: 'Get the current working directory where plans are stored',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'list_software_plans': {
          // 直接获取当前目录并重置工作目录
          const currentProcessDir = process.cwd();
          const currentStorageDir = storage.getCurrentWorkingDirectory();
          
          // 如果存储的工作目录与当前进程目录不一致，则更新工作目录
          if (currentStorageDir !== currentProcessDir) {
            try {
              await storage.setWorkingDirectory(currentProcessDir);
              console.error(`[list_software_plans] 工作目录已更新为: ${currentProcessDir}`);
            } catch (error) {
              console.error(`[list_software_plans] 更新工作目录失败: ${error instanceof Error ? error.message : String(error)}`);
            }
          }

          const plans = await storage.listPlans();
          const currentPlan = storage.getCurrentPlan();

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  plans,
                  currentActivePlan: currentPlan,
                  totalPlans: plans.length,
                  message: plans.length === 0 ? 'No plans found. This appears to be a new project.' : `Found ${plans.length} plan(s). Current active plan: ${currentPlan}`
                }, null, 2),
              },
            ],
          };
        }

        case 'create_new_plan': {
          // 直接获取当前目录并重置工作目录
          const currentProcessDir = process.cwd();
          const currentStorageDir = storage.getCurrentWorkingDirectory();
          
          // 如果存储的工作目录与当前进程目录不一致，则更新工作目录
          if (currentStorageDir !== currentProcessDir) {
            try {
              await storage.setWorkingDirectory(currentProcessDir);
              console.error(`[create_new_plan] 工作目录已更新为: ${currentProcessDir}`);
            } catch (error) {
              console.error(`[create_new_plan] 更新工作目录失败: ${error instanceof Error ? error.message : String(error)}`);
            }
          }

          const { planName, goal } = request.params.arguments as { planName: string; goal: string };

          try {
            await storage.createNewPlan(planName, goal);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `Successfully created new plan '${planName}' with goal: ${goal}`,
                },
              ],
            };
          } catch (error) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              `Failed to create plan: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }

        case 'set_active_plan': {
          // 直接获取当前目录并重置工作目录
          const currentProcessDir = process.cwd();
          const currentStorageDir = storage.getCurrentWorkingDirectory();
          
          // 如果存储的工作目录与当前进程目录不一致，则更新工作目录
          if (currentStorageDir !== currentProcessDir) {
            try {
              await storage.setWorkingDirectory(currentProcessDir);
              console.error(`[set_active_plan] 工作目录已更新为: ${currentProcessDir}`);
            } catch (error) {
              console.error(`[set_active_plan] 更新工作目录失败: ${error instanceof Error ? error.message : String(error)}`);
            }
          }

          const { planName } = request.params.arguments as { planName: string };

          try {
const previousPlan = storage.getCurrentPlan();
await storage.setActivePlan(planName);

// 清理旧目标，避免跨计划污染
this.currentGoal = null;
await this.restoreCurrentGoal();
            
            return {
              content: [
                {
                  type: 'text',
                  text: `Successfully switched from plan '${previousPlan}' to '${planName}'. This is now the active plan for all operations.`,
                },
              ],
            };
          } catch (error) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              `Failed to set active plan: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }

        case 'start_planning': {
          // 直接获取当前目录并重置工作目录
          const currentProcessDir = process.cwd();
          const currentStorageDir = storage.getCurrentWorkingDirectory();
          
          // 如果存储的工作目录与当前进程目录不一致，则更新工作目录
          if (currentStorageDir !== currentProcessDir) {
            try {
              await storage.setWorkingDirectory(currentProcessDir);
              console.error(`[start_planning] 工作目录已更新为: ${currentProcessDir}`);
            } catch (error) {
              console.error(`[start_planning] 更新工作目录失败: ${error instanceof Error ? error.message : String(error)}`);
            }
          }

          const { goal } = request.params.arguments as { goal: string };
          
          // AI决策流程：检查现有计划
          const plans = await storage.listPlans();
          
          if (plans.length === 0) {
            // 新项目，自动创建main计划
            await storage.createNewPlan('main', goal);
            await storage.setActivePlan('main');
            this.currentGoal = await storage.createGoal(goal);
            await storage.createPlan(this.currentGoal.id);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `🎯 **新项目开始！**\n\n检测到这是一个全新的项目，已自动创建 'main' 计划。\n\n**目标**: ${goal}\n**当前活动计划**: main\n\n${SEQUENTIAL_THINKING_PROMPT}`,
                },
              ],
            };
          } else {
            // 有现有计划，需要AI决策
            const currentPlan = storage.getCurrentPlan();
            const plansInfo = plans.map(plan => `- ${plan}${plan === currentPlan ? ' (当前活动)' : ''}`).join('\n');
            
            return {
              content: [
                {
                  type: 'text',
                  text: `🤔 **计划决策时间！**\n\n您提出的目标：**${goal}**\n\n当前项目已有以下计划：\n${plansInfo}\n\n**请分析这个目标并决定：**\n1. 这个目标是否属于某个现有计划的延伸？\n2. 还是需要创建一个全新的独立计划？\n\n**决策指南：**\n- 如果是现有功能的增强、Bug修复或相关任务 → 使用现有计划\n- 如果是全新功能、架构重构或独立模块 → 创建新计划\n\n**下一步操作：**\n- 如需添加到现有计划：使用 \`set_active_plan\` 切换到目标计划\n- 如需创建新计划：使用 \`create_new_plan\` 创建新计划\n- 然后再次调用 \`start_planning\` 开始规划\n\n💡 **提示**: 创建新计划时，建议使用描述性名称，如 'feature-user-auth'、'bugfix-payment-timeout' 等。`,
                },
              ],
            };
          }
        }

        case 'save_plan': {
          // 直接获取当前目录并重置工作目录
          const currentProcessDir = process.cwd();
          const currentStorageDir = storage.getCurrentWorkingDirectory();
          
          // 如果存储的工作目录与当前进程目录不一致，则更新工作目录
          if (currentStorageDir !== currentProcessDir) {
            try {
              await storage.setWorkingDirectory(currentProcessDir);
              console.error(`[save_plan] 工作目录已更新为: ${currentProcessDir}`);
            } catch (error) {
              console.error(`[save_plan] 更新工作目录失败: ${error instanceof Error ? error.message : String(error)}`);
            }
          }

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
          // 直接获取当前目录并重置工作目录
          const currentProcessDir = process.cwd();
          const currentStorageDir = storage.getCurrentWorkingDirectory();
          
          // 如果存储的工作目录与当前进程目录不一致，则更新工作目录
          if (currentStorageDir !== currentProcessDir) {
            try {
              await storage.setWorkingDirectory(currentProcessDir);
              console.error(`[add_todo] 工作目录已更新为: ${currentProcessDir}`);
            } catch (error) {
              console.error(`[add_todo] 更新工作目录失败: ${error instanceof Error ? error.message : String(error)}`);
            }
          }

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
          // 直接获取当前目录并重置工作目录
          const currentProcessDir = process.cwd();
          const currentStorageDir = storage.getCurrentWorkingDirectory();
          
          // 如果存储的工作目录与当前进程目录不一致，则更新工作目录
          if (currentStorageDir !== currentProcessDir) {
            try {
              await storage.setWorkingDirectory(currentProcessDir);
              console.error(`[remove_todo] 工作目录已更新为: ${currentProcessDir}`);
            } catch (error) {
              console.error(`[remove_todo] 更新工作目录失败: ${error instanceof Error ? error.message : String(error)}`);
            }
          }

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
          // 直接获取当前目录并重置工作目录
          const currentProcessDir = process.cwd();
          const currentStorageDir = storage.getCurrentWorkingDirectory();
          
          // 如果存储的工作目录与当前进程目录不一致，则更新工作目录
          if (currentStorageDir !== currentProcessDir) {
            try {
              await storage.setWorkingDirectory(currentProcessDir);
              console.error(`[get_todos] 工作目录已更新为: ${currentProcessDir}`);
            } catch (error) {
              console.error(`[get_todos] 更新工作目录失败: ${error instanceof Error ? error.message : String(error)}`);
            }
          }

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
          // 直接获取当前目录并重置工作目录
          const currentProcessDir = process.cwd();
          const currentStorageDir = storage.getCurrentWorkingDirectory();
          
          // 如果存储的工作目录与当前进程目录不一致，则更新工作目录
          if (currentStorageDir !== currentProcessDir) {
            try {
              await storage.setWorkingDirectory(currentProcessDir);
              console.error(`[update_todo_status] 工作目录已更新为: ${currentProcessDir}`);
            } catch (error) {
              console.error(`[update_todo_status] 更新工作目录失败: ${error instanceof Error ? error.message : String(error)}`);
            }
          }

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

        case 'view_plan': {
          const fs = await import('fs/promises');
          const path = await import('path');
          
          // 直接获取当前目录并重置工作目录
          const currentProcessDir = process.cwd();
          const currentStorageDir = storage.getCurrentWorkingDirectory();
          
          // 如果存储的工作目录与当前进程目录不一致，则更新工作目录
          if (currentStorageDir !== currentProcessDir) {
            try {
              await storage.setWorkingDirectory(currentProcessDir);
              console.error(`[view_plan] 工作目录已更新为: ${currentProcessDir}`);
            } catch (error) {
              console.error(`[view_plan] 更新工作目录失败: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
          
          try {
            const currentPlan = storage.getCurrentPlan();
            const planPath = path.join(storage.getCurrentWorkingDirectory(), '.cursor', 'softwareplan', currentPlan, 'plan.md');
            const planContent = await fs.readFile(planPath, 'utf-8');
            
            return {
              content: [
                {
                  type: 'text',
                  text: planContent,
                },
              ],
            };
          } catch (error) {
            const currentPlan = storage.getCurrentPlan();
            return {
              content: [
                {
                  type: 'text',
                  text: `未找到计划文件。当前活动计划: ${currentPlan}\n请先为当前计划创建一个开发计划。`,
                },
              ],
            };
          }
        }

        case 'view_tasks': {
          const fs = await import('fs/promises');
          const path = await import('path');
          
          // 直接获取当前目录并重置工作目录
          const currentProcessDir = process.cwd();
          const currentStorageDir = storage.getCurrentWorkingDirectory();
          
          // 如果存储的工作目录与当前进程目录不一致，则更新工作目录
          if (currentStorageDir !== currentProcessDir) {
            try {
              await storage.setWorkingDirectory(currentProcessDir);
              console.error(`[view_tasks] 工作目录已更新为: ${currentProcessDir}`);
            } catch (error) {
              console.error(`[view_tasks] 更新工作目录失败: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
          
          try {
            const currentPlan = storage.getCurrentPlan();
            const tasksPath = path.join(storage.getCurrentWorkingDirectory(), '.cursor', 'softwareplan', currentPlan, 'tasks.md');
            const tasksContent = await fs.readFile(tasksPath, 'utf-8');
            
            return {
              content: [
                {
                  type: 'text',
                  text: tasksContent,
                },
              ],
            };
          } catch (error) {
            const currentPlan = storage.getCurrentPlan();
            return {
              content: [
                {
                  type: 'text',
                  text: `未找到任务文件。当前活动计划: ${currentPlan}\n请先为当前计划创建一个开发计划。`,
                },
              ],
            };
          }
        }

        case 'set_working_directory': {
          const { directory } = request.params.arguments as { directory: string };
          
          try {
            await storage.setWorkingDirectory(directory);
            const path = await import('path');
            const planDir = path.join(storage.getCurrentWorkingDirectory(), '.cursor', 'softwareplan');
            
            return {
              content: [
                {
                  type: 'text',
                  text: `工作目录已设置为: ${storage.getCurrentWorkingDirectory()}\n计划文件将保存到: ${planDir}`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `设置工作目录失败: ${error instanceof Error ? error.message : String(error)}`,
                },
              ],
            };
          }
        }

        case 'get_working_directory': {
          const path = await import('path');
          const currentPlan = storage.getCurrentPlan();
          const baseDir = path.join(storage.getCurrentWorkingDirectory(), '.cursor', 'softwareplan');
          const currentPlanDir = path.join(baseDir, currentPlan);
          
          return {
            content: [
              {
                type: 'text',
                text: `当前工作目录: ${storage.getCurrentWorkingDirectory()}\n基础计划目录: ${baseDir}\n当前活动计划: ${currentPlan}\n当前计划文件位置: ${currentPlanDir}`,
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
    try {
      console.error('[Server] Starting Software Planning MCP server...');
      
      // 自动检测和设置工作目录
      await this.initializeWorkingDirectory();
      
      console.error(`[Server] Working directory: ${storage.getCurrentWorkingDirectory()}`);
      
      await storage.initialize();
      console.error('[Server] Storage initialized successfully');
      
      // 恢复当前目标（如果存储中有数据）
      await this.restoreCurrentGoal();
      
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('Software Planning MCP server running on stdio');
    } catch (error) {
      console.error('[Server] Failed to start server:', error instanceof Error ? error.message : String(error));
      console.error('[Server] Error details:', error);
      throw error;
    }
  }

  /**
   * 自动初始化工作目录
   * 优先级：基于index.js位置推断 > 有效的环境变量 > 项目根目录检测 > 当前工作目录
   */
  private async initializeWorkingDirectory(): Promise<void> {
    let workingDir: string | null = null;
    
    // 1. 首先尝试根据index.js的位置推断项目根目录（最可靠的方法）
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      // build/index.js -> project root
      const projectRoot = resolve(__dirname, '..');
      
      const fs = await import('fs/promises');
      const stats = await fs.stat(projectRoot);
      
              if (stats.isDirectory()) {
          // 验证这确实是项目根目录（检查是否有package.json等标识文件）
          const packageJsonPath = resolve(projectRoot, 'package.json');
          try {
            await fs.stat(packageJsonPath);
            // 检查是否有写权限
            try {
              await fs.access(projectRoot, fs.constants.W_OK);
              workingDir = projectRoot;
              console.error(`[Server] Inferred project root from index.js location: ${workingDir}`);
            } catch {
              console.error(`[Server] No write permission for inferred project root: ${projectRoot}`);
            }
          } catch {
            console.error(`[Server] No package.json found in inferred project root: ${projectRoot}`);
          }
        }
    } catch (error) {
      console.error(`[Server] Failed to infer project root from index.js location: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // 2. 如果推断失败，尝试从环境变量获取（兼容原有的启动脚本方式）
    if (!workingDir) {
      if (process.env.PWD && process.env.PWD !== process.cwd()) {
        // 验证环境变量指向的目录是否有项目标识文件
        try {
          const fs = await import('fs/promises');
          const packageJsonPath = resolve(process.env.PWD, 'package.json');
          await fs.stat(packageJsonPath);
          workingDir = process.env.PWD;
          console.error(`[Server] Using PWD environment variable: ${workingDir}`);
        } catch {
          console.error(`[Server] PWD environment variable does not point to a valid project directory: ${process.env.PWD}`);
        }
      } else if (process.env.INIT_CWD && process.env.INIT_CWD !== process.cwd()) {
        // 验证环境变量指向的目录是否有项目标识文件
        try {
          const fs = await import('fs/promises');
          const packageJsonPath = resolve(process.env.INIT_CWD, 'package.json');
          await fs.stat(packageJsonPath);
          workingDir = process.env.INIT_CWD;
          console.error(`[Server] Using INIT_CWD environment variable: ${workingDir}`);
        } catch {
          console.error(`[Server] INIT_CWD environment variable does not point to a valid project directory: ${process.env.INIT_CWD}`);
        }
      }
    }
    
    // 3. 如果还是没有找到合适的目录，让storage自动检测项目根目录
    if (!workingDir) {
      console.error('[Server] No suitable working directory found, using automatic project root detection');
      // storage构造函数已经会自动检测项目根目录，所以这里不需要额外操作
      return;
    }
    
    // 4. 验证并设置工作目录
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const resolvedPath = path.resolve(workingDir);
      const stats = await fs.stat(resolvedPath);
      
      if (stats.isDirectory()) {
        await storage.setWorkingDirectory(resolvedPath);
        console.error(`[Server] Working directory set to: ${resolvedPath}`);
      } else {
        console.error(`[Server] Path is not a directory, falling back to auto-detection: ${resolvedPath}`);
      }
    } catch (error) {
      console.error(`[Server] Failed to set working directory, falling back to auto-detection: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 恢复当前目标
   * 如果存储中有目标数据，恢复最新的目标作为当前目标
   */
  private async restoreCurrentGoal(): Promise<void> {
    try {
      const goals = await storage.getAllGoals();
      if (goals.length > 0) {
        this.currentGoal = goals.reduce((latest, current) =>
          new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
        );
        if (this.currentGoal) {
          console.error(`[Server] Restored current goal: ${this.currentGoal.id} - ${this.currentGoal.description}`);
        }
      } else {
        this.currentGoal = null;
        console.error('[Server] No existing goals found – currentGoal cleared');
      }
    } catch (error) {
      console.error(`[Server] Failed to restore current goal: ${error instanceof Error ? error.message : String(error)}`);
      // 不抛出错误，允许服务器继续启动
    }
  }
}

const server = new SoftwarePlanningServer();
server.run().catch(console.error);
