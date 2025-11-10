import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { StorageData, Goal, ImplementationPlan, Todo } from './types.js';

export class Storage {
  private storagePath: string;
  private data: StorageData;

  constructor() {
    // Store data in user's home directory under .software-planning-tool
    // TODO [MEDIUM][CONFIDENCE: 100%][CONFIG]
    // What: Storage path is hardcoded to ~/.software-planning-tool
    // Why: No environment variable or configuration option exists
    // Impact: Cannot customize for testing, multi-tenant, or containerized environments
    // Fix: Read from env var STORAGE_PATH with fallback to default
    // File: src/storage.ts:10-18
    // Patch:
    // + const dataDir = process.env.STORAGE_PATH || path.join(os.homedir(), '.software-planning-tool');
    const dataDir = path.join(os.homedir(), '.software-planning-tool');
    this.storagePath = path.join(dataDir, 'data.json');
    this.data = {
      goals: {},
      plans: {},
    };
  }

  async initialize(): Promise<void> {
    // FIXED [HIGH][FX-INIT] - Added proper error handling for storage initialization
    // Distinguishes between expected errors (file not found) and critical failures (permissions, disk full, corrupted data)
    try {
      // Create data directory if it doesn't exist
      const dataDir = path.dirname(this.storagePath);
      await fs.mkdir(dataDir, { recursive: true });

      // Try to read existing data
      const data = await fs.readFile(this.storagePath, 'utf-8');
      this.data = JSON.parse(data);
    } catch (error: any) {
      // ENOENT means file doesn't exist yet - this is expected on first run
      if (error.code === 'ENOENT') {
        console.error('[Storage] No existing data file, creating new storage at:', this.storagePath);
        await this.save();
        return;
      }

      // EACCES means permission denied - critical error
      if (error.code === 'EACCES') {
        console.error('[Storage] Permission denied accessing storage:', this.storagePath);
        throw new Error(`Cannot access storage location: permission denied. Check permissions for ${this.storagePath}`);
      }

      // JSON parse error - corrupted data
      if (error instanceof SyntaxError) {
        console.error('[Storage] Corrupted storage file detected, backing up and creating new storage');
        const backupPath = `${this.storagePath}.backup.${Date.now()}`;
        try {
          await fs.rename(this.storagePath, backupPath);
          console.error(`[Storage] Backup created at: ${backupPath}`);
        } catch (backupError) {
          console.error('[Storage] Failed to create backup:', backupError);
        }
        await this.save();
        return;
      }

      // Other errors - log and re-throw
      console.error('[Storage] Initialization failed:', error);
      throw new Error(`Storage initialization failed: ${error.message}`);
    }
  }

  private async save(): Promise<void> {
    // FIXED [HIGH][FX-002] - Added error handling for file write operations
    // Catches and reports I/O errors (disk full, permissions, etc.) instead of failing silently
    try {
      await fs.writeFile(this.storagePath, JSON.stringify(this.data, null, 2));
    } catch (error: any) {
      console.error('[Storage] Failed to save:', error.message);
      throw new Error(`Storage save failed: ${error.message}`);
    }
  }

  async createGoal(description: string): Promise<Goal> {
    // FIXED [CRITICAL][FX-001] - Replaced Date.now() with crypto.randomUUID()
    // Using cryptographically secure UUID v4 to prevent ID collisions
    // Provenance: SRC-001 (Node.js crypto.randomUUID())
    const goal: Goal = {
      id: crypto.randomUUID(),
      description,
      createdAt: new Date().toISOString(),
    };

    this.data.goals[goal.id] = goal;
    await this.save();
    return goal;
  }

  async getGoal(id: string): Promise<Goal | null> {
    return this.data.goals[id] || null;
  }

  async createPlan(goalId: string): Promise<ImplementationPlan> {
    const plan: ImplementationPlan = {
      goalId,
      todos: [],
      updatedAt: new Date().toISOString(),
    };

    this.data.plans[goalId] = plan;
    await this.save();
    return plan;
  }

  async getPlan(goalId: string): Promise<ImplementationPlan | null> {
    return this.data.plans[goalId] || null;
  }

  async addTodo(
    goalId: string,
    { title, description, complexity, codeExample }: Omit<Todo, 'id' | 'isComplete' | 'createdAt' | 'updatedAt'>
  ): Promise<Todo> {
    const plan = await this.getPlan(goalId);
    if (!plan) {
      throw new Error(`No plan found for goal ${goalId}`);
    }

    // FIXED [CRITICAL][FX-001] - Replaced Date.now() with crypto.randomUUID()
    // Using cryptographically secure UUID v4 to prevent ID collisions
    // Provenance: SRC-001 (Node.js crypto.randomUUID())
    const todo: Todo = {
      id: crypto.randomUUID(),
      title,
      description,
      complexity,
      codeExample,
      isComplete: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    plan.todos.push(todo);
    plan.updatedAt = new Date().toISOString();
    await this.save();
    return todo;
  }

  async removeTodo(goalId: string, todoId: string): Promise<void> {
    const plan = await this.getPlan(goalId);
    if (!plan) {
      throw new Error(`No plan found for goal ${goalId}`);
    }

    plan.todos = plan.todos.filter((todo: Todo) => todo.id !== todoId);
    plan.updatedAt = new Date().toISOString();
    await this.save();
  }

  async updateTodoStatus(goalId: string, todoId: string, isComplete: boolean): Promise<Todo> {
    const plan = await this.getPlan(goalId);
    if (!plan) {
      throw new Error(`No plan found for goal ${goalId}`);
    }

    const todo = plan.todos.find((t: Todo) => t.id === todoId);
    if (!todo) {
      throw new Error(`No todo found with id ${todoId}`);
    }

    todo.isComplete = isComplete;
    todo.updatedAt = new Date().toISOString();
    plan.updatedAt = new Date().toISOString();
    await this.save();
    return todo;
  }

  async getTodos(goalId: string): Promise<Todo[]> {
    const plan = await this.getPlan(goalId);
    return plan?.todos || [];
  }
}

// TODO [MEDIUM][CONFIDENCE: 85%][TESTING, DESIGN]
// What: Global singleton prevents dependency injection and complicates testing
// Why: Exporting instance instead of class factory makes mocking difficult
// Impact: Tests interfere with each other; cannot isolate storage in unit tests
// Fix: Export class, instantiate in index.ts, pass as constructor dependency
// File: src/storage.ts:132
// Patch:
// - export const storage = new Storage();
// + // In index.ts:
// + const storage = new Storage();
// + const server = new SoftwarePlanningServer(storage);
export const storage = new Storage();
