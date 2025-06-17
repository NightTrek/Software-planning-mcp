# Software Planning Tool 🚀
[![smithery badge](https://smithery.ai/badge/@NightTrek/Software-planning-mcp)](https://smithery.ai/server/@NightTrek/Software-planning-mcp)

A Model Context Protocol (MCP) server designed to facilitate software development planning through an interactive, structured approach. This tool helps break down complex software projects into manageable tasks, track implementation progress, and maintain detailed development plans.

> **🎯 Cursor Integration**: This version includes enhanced support for Cursor IDE with project-specific storage, automatic project detection, and working directory management features.

<a href="https://glama.ai/mcp/servers/a35c7qc7ie">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/a35c7qc7ie/badge" alt="Software Planning Tool MCP server" />
</a>

## Features ✨

- **Interactive Planning Sessions**: Start and manage development planning sessions
- **Project-Specific Storage**: Each project maintains its own independent planning data
- **Automatic Project Detection**: Automatically detects project root directories
- **Working Directory Management**: Set and manage working directories for different projects
- **Todo Management**: Create, update, and track development tasks
- **Complexity Scoring**: Assign complexity scores to tasks for better estimation
- **Code Examples**: Include relevant code snippets in task descriptions
- **Implementation Plans**: Save and manage detailed implementation plans
- **Markdown Export**: Automatically generates human-readable plan and task files

## Installation 🛠️

### Installing via Smithery

To install Software Planning Tool for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@NightTrek/Software-planning-mcp):

```bash
npx -y @smithery/cli install @NightTrek/Software-planning-mcp --client claude
```

### Manual Installation
1. Clone the repository
2. Install dependencies:
```bash
pnpm install
```
3. Build the project:
```bash
pnpm run build
```
4. Add to your Cursor MCP configuration (typically located at `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "software-planning-tool": {
      "command": "node",
      "args": ["/absolute/path/to/cloned/software-planning-tool/build/index.js"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Replace `/absolute/path/to/cloned/software-planning-tool` with the actual path where you cloned this repository.

**✨ Features**: The tool automatically detects project directories and handles Windows path formats correctly, making it cross-platform compatible without requiring additional startup scripts.

## How It Works 🔄

### Project-Specific Storage
- Each project gets its own `.cursor` folder containing planning data
- Plans are automatically saved to the current project directory
- Supports multiple projects with independent planning sessions

### Automatic Project Detection
The tool automatically detects project root directories by looking for common indicators:
- `.git` directory
- `package.json` file
- `.cursor` directory
- `tsconfig.json` file
- `pyproject.toml` file
- `Cargo.toml` file
- `go.mod` file

### File Structure
When you use the tool in a project, it creates:
```
your-project/
├── .cursor/
│   ├── softwareplan/
│       ├── data.json      # Structured data for AI consumption
│       ├── plan.md        # Human-readable project plan
│       └── tasks.md       # Human-readable task list
└── ... (your project files)
```

## Available Tools 🔧

### Working Directory Management

#### get_working_directory
Get the current working directory where plans are stored.
```typescript
// No parameters required
```

#### set_working_directory
Set the working directory for the current session.
```typescript
{
  directory: string  // Absolute or relative path to the project directory
}
```

### Planning Tools

#### start_planning
Start a new planning session with a specific goal.
```typescript
{
  goal: string  // The software development goal to plan
}
```

#### save_plan
Save the current implementation plan.
```typescript
{
  plan: string  // The implementation plan text
}
```

### Todo Management

#### add_todo
Add a new todo item to the current plan.
```typescript
{
  title: string,         // Title of the todo item
  description: string,   // Detailed description
  complexity: number,    // Complexity score (0-10)
  codeExample?: string  // Optional code example
}
```

#### get_todos
Retrieve all todos in the current plan.
```typescript
// No parameters required
```

#### update_todo_status
Update the completion status of a todo item.
```typescript
{
  todoId: string,     // ID of the todo item
  isComplete: boolean // New completion status
}
```

#### remove_todo
Remove a todo item from the current plan.
```typescript
{
  todoId: string  // ID of the todo item to remove
}
```

### View Tools

#### view_plan
View the current project plan in markdown format.
```typescript
// No parameters required
```

#### view_tasks
View the current project tasks in markdown format.
```typescript
// No parameters required
```

## Example Usage 📝

### Basic Workflow

1. **Check current working directory**:
```typescript
await client.callTool("software-planning-tool", "get_working_directory", {});
```

2. **Set working directory (if needed)**:
```typescript
await client.callTool("software-planning-tool", "set_working_directory", {
  directory: "/path/to/your/project"
});
```

3. **Start a planning session**:
```typescript
await client.callTool("software-planning-tool", "start_planning", {
  goal: "Create a React-based dashboard application"
});
```

4. **Add todo items**:
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

5. **Update todo status**:
```typescript
await client.callTool("software-planning-tool", "update_todo_status", {
  todoId: todo.id,
  isComplete: true
});
```

6. **View generated files**:
```typescript
// View the plan
await client.callTool("software-planning-tool", "view_plan", {});

// View the tasks
await client.callTool("software-planning-tool", "view_tasks", {});
```

### Multi-Project Usage

The tool supports working with multiple projects simultaneously:

```typescript
// Switch to project A
await client.callTool("software-planning-tool", "set_working_directory", {
  directory: "/path/to/project-a"
});
await client.callTool("software-planning-tool", "start_planning", {
  goal: "Build a web API"
});

// Switch to project B
await client.callTool("software-planning-tool", "set_working_directory", {
  directory: "/path/to/project-b"
});
await client.callTool("software-planning-tool", "start_planning", {
  goal: "Create a mobile app"
});
```

Each project maintains its own independent planning data.

## Development 🔨

### Project Structure
```
software-planning-tool/
  ├── src/
  │   ├── index.ts        # Main server implementation
  │   ├── prompts.ts      # Planning prompts and templates
  │   ├── storage.ts      # Data persistence and directory management
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

## Troubleshooting 🔧

### Common Issues

1. **Plans not saving to the correct directory**:
   - Use `get_working_directory` to check the current directory
   - Use `set_working_directory` to change to your project directory
   - The tool now automatically detects project directories and provides helpful guidance

2. **Permission errors**:
   - Ensure the tool has write permissions to your project directory
   - Check that the `.cursor` folder can be created

3. **Multiple projects interfering**:
   - Each project should have its own `.cursor` folder
   - Use `set_working_directory` to switch between projects

## License 📄

MIT

---

Made with ❤️ using the Model Context Protocol