# Software Planning Tool - Operations Runbook

**Version**: 0.1.0
**Last Updated**: 2025-11-10
**Maintainer**: Engineering Team

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation & Setup](#installation--setup)
3. [Building the Project](#building-the-project)
4. [Running the Server](#running-the-server)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Common Issues & Troubleshooting](#common-issues--troubleshooting)
8. [Monitoring & Logs](#monitoring--logs)
9. [Data Management](#data-management)
10. [Deployment](#deployment)
11. [Maintenance](#maintenance)

---

## Prerequisites

### Required Software

| Software | Minimum Version | Recommended | Verification Command |
|----------|----------------|-------------|---------------------|
| Node.js | v14.17.0 | v20.x or v22.x | `node --version` |
| npm | v6.x | v10.x | `npm --version` |
| pnpm | v8.x | v8.x | `pnpm --version` |
| Git | v2.x | Latest | `git --version` |

### System Requirements

- **OS**: Linux, macOS, Windows (WSL recommended for Windows)
- **RAM**: Minimum 512MB, Recommended 1GB+
- **Disk**: 100MB for application + storage space for data
- **Permissions**: Read/write access to user home directory

### Installing Prerequisites

```bash
# Install Node.js (via nvm recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22

# Install pnpm globally
npm install -g pnpm

# Verify installations
node --version    # Should show v22.x.x
pnpm --version    # Should show 8.x.x or higher
```

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Software-planning-mcp.git
cd Software-planning-mcp
```

### 2. Install Dependencies

```bash
# Install all project dependencies
pnpm install

# This will:
# - Install @modelcontextprotocol/sdk v0.6.0
# - Install TypeScript v5.3.3
# - Install @types/node v20.x
# - Run the 'prepare' script which builds the project
```

**Expected Output**:
```
Lockfile is up to date, resolution step is skipped
Packages: +17
dependencies:
+ @modelcontextprotocol/sdk 0.6.0
devDependencies:
+ @types/node 20.17.11
+ typescript 5.7.2

> software-planning-tool@0.1.0 prepare
> npm run build

> software-planning-tool@0.1.0 build
> tsc && node -e "require('fs').chmodSync('build/index.js', '755')"

Done in 4.6s
```

### 3. Verify Installation

```bash
# Check that build directory was created
ls -la build/

# Should show:
# -rwxr-xr-x  index.js
# -rw-r--r--  prompts.js
# -rw-r--r--  storage.js
# -rw-r--r--  types.js

# Verify the entrypoint is executable
./build/index.js --help 2>&1 || echo "Server starts via stdio (no CLI help)"
```

---

## Building the Project

### Standard Build

```bash
pnpm run build
```

**What this does**:
1. Compiles TypeScript files from `src/` to JavaScript in `build/`
2. Sets executable permission on `build/index.js` (755)
3. Generates source maps

### Watch Mode (Development)

```bash
pnpm run watch
```

**Use when**: Actively developing and want automatic rebuilds on file changes.

### Clean Build

```bash
# Remove build artifacts
rm -rf build/

# Rebuild from scratch
pnpm run build
```

### Build Troubleshooting

#### Error: `Cannot find module @modelcontextprotocol/sdk`

```bash
# Solution: Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### Error: `tsc: command not found`

```bash
# Solution: TypeScript not installed
pnpm add -D typescript
```

#### Error: `Permission denied: build/index.js`

```bash
# Solution: Fix permissions
chmod +x build/index.js
```

---

## Running the Server

### Local Development Run

```bash
node build/index.js
```

**Expected Output**:
```
Software Planning MCP server running on stdio
```

**Note**: The server runs on stdio and communicates via JSON-RPC. It does not provide an HTTP endpoint.

### Using MCP Inspector (Interactive Testing)

```bash
pnpm run inspector
```

**What this does**:
- Launches the MCP Inspector web interface
- Allows interactive testing of all MCP tools
- Useful for manual validation

### Running in Background

```bash
# Not recommended for stdio-based MCP servers
# Use process managers for production deployments
```

### Integration with MCP Clients

#### Claude Desktop

1. Edit MCP settings (typically at `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "software-planning-tool": {
      "command": "node",
      "args": [
        "/absolute/path/to/Software-planning-mcp/build/index.js"
      ],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

2. Restart Claude Desktop
3. Verify server appears in MCP server list

#### VS Code (Cline/Claude Dev)

1. Edit settings at `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "software-planning-tool": {
      "command": "node",
      "args": [
        "/absolute/path/to/Software-planning-mcp/build/index.js"
      ]
    }
  }
}
```

2. Restart VS Code or reload Cline extension

---

## Configuration

### Environment Variables

Create `.env` file (optional):

```bash
cp .env.example .env
```

**Available Variables**:

| Variable | Default | Description | Example |
|----------|---------|-------------|---------|
| `STORAGE_PATH` | `~/.software-planning-tool` | Storage directory path | `/tmp/storage` |
| `LOG_LEVEL` | `info` | Logging verbosity (future) | `debug`, `info`, `warn`, `error` |

**Note**: Currently no environment variables are required. Storage path is hardcoded (see FX-013 in FIX_QUEUE.json for making it configurable).

### Storage Location

**Default**: `~/.software-planning-tool/data.json`

**Contents**:
```json
{
  "goals": {
    "1730000000": {
      "id": "1730000000",
      "description": "Build dashboard",
      "createdAt": "2025-11-10T16:00:00.000Z"
    }
  },
  "plans": {
    "1730000000": {
      "goalId": "1730000000",
      "todos": [...],
      "updatedAt": "2025-11-10T16:05:00.000Z"
    }
  }
}
```

### Customizing Storage Path (Manual)

Currently requires code change (see FX-013). Workaround:

```bash
# Create custom storage directory
mkdir -p /custom/path/storage

# Symlink to default location
ln -sf /custom/path/storage ~/.software-planning-tool
```

---

## Testing

### Current State

⚠️ **No tests currently exist** (see FX-012 in FIX_QUEUE.json)

### Future Test Commands (After implementing FX-012)

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# UI mode
pnpm test:ui
```

### Manual Testing Checklist

Until automated tests are implemented, use this checklist:

#### ✅ Start Planning
```bash
# Start MCP Inspector: pnpm run inspector
# Execute: start_planning
# Input: { "goal": "Build a todo app" }
# Expected: Returns sequential thinking prompt
# Verify: ~/.software-planning-tool/data.json contains new goal
```

#### ✅ Add Todo
```bash
# Execute: add_todo
# Input: {
#   "title": "Set up database",
#   "description": "Install and configure PostgreSQL",
#   "complexity": 5,
#   "codeExample": "npm install pg"
# }
# Expected: Returns new todo with ID
# Verify: Todo appears in data.json
```

#### ✅ Get Todos
```bash
# Execute: get_todos
# Expected: Returns array of all todos for current goal
```

#### ✅ Update Todo Status
```bash
# Execute: update_todo_status
# Input: { "todoId": "<id>", "isComplete": true }
# Expected: Returns updated todo
# Verify: isComplete=true in data.json
```

#### ✅ Remove Todo
```bash
# Execute: remove_todo
# Input: { "todoId": "<id>" }
# Expected: Success message
# Verify: Todo removed from data.json
```

#### ✅ Save Plan
```bash
# Execute: save_plan
# Input: { "plan": "1. Setup\nComplexity: 3\n\n2. Build\nComplexity: 7" }
# Expected: "Successfully saved N todos"
# Verify: Parsed todos appear in data.json
```

---

## Common Issues & Troubleshooting

### Issue: Server starts but client can't connect

**Symptoms**:
```
Software Planning MCP server running on stdio
```
But MCP client shows "Server not responding"

**Diagnosis**:
1. Check client configuration path is absolute
2. Verify `build/index.js` is executable (`ls -la build/index.js`)
3. Check client logs for error messages

**Solution**:
```bash
# 1. Verify build is current
pnpm run build

# 2. Check permissions
chmod +x build/index.js

# 3. Test manually
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"0.1.0","clientInfo":{"name":"test","version":"1.0"}}}' | node build/index.js
```

### Issue: "No active goal" errors

**Symptoms**:
All tool calls except `start_planning` fail with "No active goal"

**Cause**:
- Server was restarted (currentGoal is volatile)
- Never called `start_planning` in current session

**Solution**:
```bash
# Always start with start_planning
# Call it at beginning of each session
```

### Issue: Storage file corrupted

**Symptoms**:
```
[MCP Error] SyntaxError: Unexpected token in JSON
```

**Diagnosis**:
```bash
cat ~/.software-planning-tool/data.json | jq .
# If error: JSON is malformed
```

**Solution**:
```bash
# Backup corrupted file
mv ~/.software-planning-tool/data.json ~/.software-planning-tool/data.json.backup

# Server will create new file on next start
node build/index.js
```

### Issue: Disk full / Permission denied

**Symptoms**:
```
Error: ENOSPC: no space left on device
Error: EACCES: permission denied
```

**Diagnosis**:
```bash
# Check disk space
df -h ~

# Check directory permissions
ls -la ~/.software-planning-tool
```

**Solution**:
```bash
# For disk space: Clean up or use alternate location
# For permissions:
chmod 755 ~/.software-planning-tool
chmod 644 ~/.software-planning-tool/data.json
```

### Issue: Build fails with TypeScript errors

**Symptoms**:
```
error TS2307: Cannot find module '@modelcontextprotocol/sdk'
```

**Solution**:
```bash
# Clean and reinstall
rm -rf node_modules build pnpm-lock.yaml
pnpm install
```

### Issue: Rapid operations create duplicate IDs

**Symptoms**:
Multiple goals or todos have same ID

**Cause**:
Date.now() collision (see FX-001 in FIX_QUEUE.json)

**Workaround**:
Add small delay between operations (100ms)

**Permanent Fix**:
Implement FX-001 (use crypto.randomUUID())

---

## Monitoring & Logs

### Current Logging

**Output**: All logs go to **stderr** (not stdout, to avoid interfering with stdio protocol)

**Log Locations**:
- **Development**: Terminal stderr
- **Production**: Redirect stderr to file

**Example**:
```bash
# Capture logs to file
node build/index.js 2>> /var/log/software-planning-tool.log
```

### Log Messages

| Message | Level | Meaning |
|---------|-------|---------|
| `Software Planning MCP server running on stdio` | INFO | Server started successfully |
| `[MCP Error]` | ERROR | MCP protocol error occurred |
| (Other logs minimal in v0.1.0) | | See FX-010 for enhanced logging |

### Future Observability (After FX-010)

- Structured JSON logs
- Operation audit trail
- Performance metrics
- Error tracking with stack traces

---

## Data Management

### Backup

```bash
# Manual backup
cp ~/.software-planning-tool/data.json \
   ~/.software-planning-tool/data.json.backup.$(date +%Y%m%d_%H%M%S)

# Automated backup (add to cron)
0 2 * * * cp ~/.software-planning-tool/data.json ~/.software-planning-tool/data.json.backup.$(date +\%Y\%m\%d)
```

### Restore

```bash
# Restore from backup
cp ~/.software-planning-tool/data.json.backup.20251110 \
   ~/.software-planning-tool/data.json
```

### Migration

When upgrading versions, check for schema changes:

```bash
# Check current schema version (no version field in v0.1.0)
jq '.version // "0.1.0"' ~/.software-planning-tool/data.json

# Future migrations will be documented here
```

### Data Export

```bash
# Export all data
jq . ~/.software-planning-tool/data.json > export.json

# Export specific goal
jq '.goals["<goal-id>"]' ~/.software-planning-tool/data.json > goal.json
```

### Data Cleanup

```bash
# Remove old goals (manual - no automated cleanup)
# Edit data.json and remove entries, or reset:

# Nuclear option: Delete all data
rm -rf ~/.software-planning-tool
# Server will recreate on next start
```

---

## Deployment

### Local Deployment (Single User)

```bash
# 1. Build
pnpm run build

# 2. Configure MCP client (see Running the Server)

# 3. Start client (Claude Desktop, VS Code, etc.)
```

### Docker Deployment

```bash
# Build Docker image
docker build -t software-planning-tool:latest .

# Run container
docker run -it --rm \
  -v ~/.software-planning-tool:/root/.software-planning-tool \
  software-planning-tool:latest
```

**Dockerfile** (already exists in repo):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
RUN chmod +x build/index.js
EXPOSE 3000
ENTRYPOINT ["node", "build/index.js"]
```

### Multi-User Deployment

⚠️ **Not currently supported**. Issues:
- Shared storage file (no concurrency control - see FX-008)
- Volatile currentGoal state (see FX-004)
- No authentication/authorization

**Recommendation**: Deploy separate instances per user with isolated storage.

---

## Maintenance

### Updating Dependencies

```bash
# Check for outdated packages
pnpm outdated

# Update all dependencies
pnpm update

# Update specific package
pnpm update @modelcontextprotocol/sdk

# Rebuild after updates
pnpm run build
```

### Security Updates

```bash
# Check for security vulnerabilities
pnpm audit

# Fix automatically where possible
pnpm audit --fix

# Review and update manually
pnpm update
```

### Version Upgrades

When upgrading to new versions:

1. **Backup data**:
   ```bash
   cp -r ~/.software-planning-tool ~/.software-planning-tool.backup
   ```

2. **Pull changes**:
   ```bash
   git pull origin main
   ```

3. **Reinstall dependencies**:
   ```bash
   pnpm install
   ```

4. **Rebuild**:
   ```bash
   pnpm run build
   ```

5. **Test**:
   ```bash
   # Manual smoke test or automated tests
   ```

6. **Check for schema migrations** (see CHANGELOG.md for migration notes)

### Health Checks

```bash
# Test server responds
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js | jq .

# Expected: List of tools returned
```

### Performance Monitoring

**Current**: No built-in metrics

**Manual checks**:
```bash
# Storage file size
du -h ~/.software-planning-tool/data.json

# If > 10MB, consider cleanup

# Memory usage (while running)
ps aux | grep "node.*index.js"
```

---

## Emergency Procedures

### Server Unresponsive

1. Kill process: `pkill -f "node.*index.js"`
2. Check logs for errors
3. Verify storage file integrity: `jq . ~/.software-planning-tool/data.json`
4. Restart server

### Data Corruption

1. Stop server
2. Backup current (corrupted) file
3. Restore from latest backup OR delete and recreate
4. Restart server
5. Verify data integrity

### Storage Full

1. Check disk space: `df -h ~`
2. Clean up old backups
3. Archive/export old goals
4. Or change storage path (requires code change - see FX-013)

---

## Support & Resources

- **GitHub Issues**: https://github.com/yourusername/Software-planning-mcp/issues
- **MCP Documentation**: https://modelcontextprotocol.io/docs
- **Fix Queue**: See `FIX_QUEUE.json` for known issues and fixes
- **Code Review Notes**: See inline comments in `src/*.ts`

---

## Quick Reference Card

```bash
# Setup
pnpm install && pnpm run build

# Run
node build/index.js

# Test (manual)
pnpm run inspector

# Logs
node build/index.js 2>&1 | tee server.log

# Backup
cp ~/.software-planning-tool/data.json backup.json

# Reset
rm -rf ~/.software-planning-tool
```

---

**Document Version**: 1.0
**Compatibility**: Software Planning Tool v0.1.0
**Last Verified**: 2025-11-10
