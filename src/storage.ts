import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
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
    // FIXME [HIGH][CONFIDENCE: 90%][RELIABILITY, OBSERVABILITY]
    // What: Storage initialization failures are silently caught and ignored
    // Why: catch block doesn't distinguish between "file not found" (expected) vs I/O errors (critical)
    // Impact: Users unaware of permission errors, disk full, or corrupted data; silent failure
    // Fix: Check error type; log errors; throw on critical failures (permissions, disk full)
    // File: src/storage.ts:20-33
    // Patch:
    // + } catch (error: any) {
    // +   if (error.code === 'ENOENT') {
    // +     // File doesn't exist yet - expected on first run
    // +     await this.save();
    // +   } else {
    // +     console.error('Storage initialization failed:', error);
    // +     throw new Error(`Failed to initialize storage: ${error.message}`);
    // +   }
    // + }
    try {
      // Create data directory if it doesn't exist
      const dataDir = path.dirname(this.storagePath);
      await fs.mkdir(dataDir, { recursive: true });

      // Try to read existing data
      const data = await fs.readFile(this.storagePath, 'utf-8');
      this.data = JSON.parse(data);
    } catch (error) {
      // If file doesn't exist or can't be read, use default empty data
      await this.save();
    }
  }

  private async save(): Promise<void> {
    // FIXME [HIGH][CONFIDENCE: 90%][RELIABILITY]
    // What: File write failures are not caught or handled
    // Why: No try-catch or error propagation for writeFile operations
    // Impact: Silent data loss when disk full, permissions denied, or I/O errors occur
    // Fix: Wrap in try-catch, log errors, return boolean success indicator or throw
    // File: src/storage.ts:35-37
    // Patch:
    // + try {
    // +   await fs.writeFile(this.storagePath, JSON.stringify(this.data, null, 2));
    // + } catch (error: any) {
    // +   console.error('Failed to save storage:', error);
    // +   throw new Error(`Storage save failed: ${error.message}`);
    // + }
    await fs.writeFile(this.storagePath, JSON.stringify(this.data, null, 2));
  }

  async createGoal(description: string): Promise<Goal> {
    // FIXME [CRITICAL][CONFIDENCE: 95%][BUG, RELIABILITY]
    // What: Using Date.now().toString() for ID generation creates collision risk
    // Why: Multiple rapid calls in same millisecond generate identical IDs
    // Impact: Data corruption, overwriting existing goals, loss of user data
    // Fix: Use crypto.randomUUID() for cryptographically secure unique IDs
    // File: src/storage.ts:39-49
    // Provenance: SRC-001 (Node.js crypto.randomUUID())
    // Patch:
    // + import crypto from 'crypto';
    // - id: Date.now().toString(),
    // + id: crypto.randomUUID(),
    const goal: Goal = {
      id: Date.now().toString(),
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

    // FIXME [CRITICAL][CONFIDENCE: 95%][BUG, RELIABILITY]
    // What: Using Date.now().toString() for ID generation creates collision risk
    // Why: Multiple rapid calls in same millisecond generate identical IDs
    // Impact: Data corruption, overwriting existing todos, duplicate IDs in array
    // Fix: Use crypto.randomUUID() for cryptographically secure unique IDs
    // File: src/storage.ts:71-95
    // Provenance: SRC-001 (Node.js crypto.randomUUID())
    // Patch:
    // + import crypto from 'crypto';
    // - id: Date.now().toString(),
    // + id: crypto.randomUUID(),
    const todo: Todo = {
      id: Date.now().toString(),
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
