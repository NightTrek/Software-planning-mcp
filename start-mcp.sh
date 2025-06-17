#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Set the working directory to the script directory
cd "$SCRIPT_DIR"

# Set environment variables to help the MCP server find the correct directory
export PWD="$SCRIPT_DIR"
export INIT_CWD="$SCRIPT_DIR"

# Start the MCP server
exec node "$SCRIPT_DIR/build/index.js" "$@" 