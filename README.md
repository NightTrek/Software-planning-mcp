# Software Planning Tool 🚀 (Deprecated)

> [!WARNING]
> **Deprecated and no longer maintained.** The source and manual installation instructions remain available for reference.

[![smithery badge](https://smithery.ai/badge/@NightTrek/Software-planning-mcp)](https://smithery.ai/server/@NightTrek/Software-planning-mcp)

A Model Context Protocol (MCP) server designed to facilitate software development planning through an interactive, structured approach. This tool helps break down complex software projects into manageable tasks, track implementation progress, and maintain detailed development plans.

<a href="https://glama.ai/mcp/servers/a35c7qc7ie">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/a35c7qc7ie/badge" alt="Software Planning Tool MCP server" />
</a>

## Features ✨

- **Interactive Planning Sessions**: Start and manage development planning sessions
- **Todo Management**: Create, update, and track development tasks
- **Complexity Scoring**: Assign complexity scores to tasks for better estimation
- **Code Examples**: Include relevant code snippets in task descriptions
- **Implementation Plans**: Save and manage detailed implementation plans

## Installation 🛠️

For existing users who still need to run this unmaintained project, use the manual/local setup below rather than Smithery.

### Manual / Local Installation
1. Clone the repository
2. Install dependencies:
```bash
pnpm install
```
3. Build the project:
```bash
pnpm run build
```
4. Add to your MCP settings configuration (typically located at `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`):
```json
{
  "mcpServers": {
    "software-planning-tool": {
      "command": "node",
      "args": [
        "/path/to/software-planning-tool/build/index.js"
      ],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### Smithery installation notice

The previous Smithery CLI installation route is no longer recommended. Smithery is [shutting down its connection management services](https://www.smithery.ai/future) on **October 31, 2026** and deprecating its current CLI and SDK versions. Smithery remains a public, non-proxied MCP registry; use the manual/local setup above instead of the former Smithery install command.

## Available Tools 🔧

### start_planning
Start a new planning session with a specific goal.
```typescript
{
  goal: string  // The software development goal to plan
}
```

### add_todo
Add a new todo item to the current plan.
```typescript
{
  title: string,         // Title of the todo item
  description: string,   // Detailed description
  complexity: number,    // Complexity score (0-10)
  codeExample?: string  // Optional code example
}
```

### get_todos
Retrieve all todos in the current plan.
```typescript
// No parameters required
```

### update_todo_status
Update the completion status of a todo item.
```typescript
{
  todoId: string,     // ID of the todo item
  isComplete: boolean // New completion status
}
```

### save_plan
Save the current implementation plan.
```typescript
{
  plan: string  // The implementation plan text
}
```

### remove_todo
Remove a todo item from the current plan.
```typescript
{
  todoId: string  // ID of the todo item to remove
}
```

## Example Usage 📝

Here's a complete example of using the software planning tool:

1. Start a planning session:
```typescript
await client.callTool("software-planning-tool", "start_planning", {
  goal: "Create a React-based dashboard application"
});
```

2. Add a todo item:
```typescript
const todo = await client.callTool("software-planning-tool", "add_todo", {
  title: "Set up project structure",
  description: "Initialize React project with necessary dependencies",
  complexity: 3,
  codeExample: `
npx create-react-app dashboard
cd dashboard
npm install @material-ui/core @material-ui/icons
  `
});
```

3. Update todo status:
```typescript
await client.callTool("software-planning-tool", "update_todo_status", {
  todoId: todo.id,
  isComplete: true
});
```

4. Save the implementation plan:
```typescript
await client.callTool("software-planning-tool", "save_plan", {
  plan: `
# Dashboard Implementation Plan

## Phase 1: Setup (Complexity: 3)
- Initialize React project
- Install dependencies
- Set up routing

## Phase 2: Core Features (Complexity: 5)
- Implement authentication
- Create dashboard layout
- Add data visualization components
  `
});
```

## Development 🔨

### Project Structure
```
software-planning-tool/
  ├── src/
  │   ├── index.ts        # Main server implementation
  │   ├── prompts.ts      # Planning prompts and templates
  │   ├── storage.ts      # Data persistence
  │   └── types.ts        # TypeScript type definitions
  ├── build/              # Compiled JavaScript
  ├── package.json
  └── tsconfig.json
```

### Building
```bash
pnpm run build
```

### Testing
Test all features using the MCP inspector:
```bash
pnpm run inspector
```

## License 📄

MIT

---

Made with ❤️ using the Model Context Protocol