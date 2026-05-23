[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/hungthai1401-bruno-mcp-badge.png)](https://mseep.ai/app/hungthai1401-bruno-mcp)

# Bruno MCP Server
<a href="https://glama.ai/mcp/servers/@hungthai1401/bruno-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@hungthai1401/bruno-mcp/badge" alt="Bruno MCP server" />
</a>

[![Trust Score](https://archestra.ai/mcp-catalog/api/badge/quality/hungthai1401/bruno-mcp)](https://archestra.ai/mcp-catalog/hungthai1401__bruno-mcp)
[![smithery badge](https://smithery.ai/badge/@hungthai1401/bruno-mcp)](https://smithery.ai/server/@hungthai1401/bruno-mcp)

An MCP (Model Context Protocol) server that enables running Bruno collections. This server allows LLMs to execute API tests using Bruno and get detailed results through a standardized interface.

## Features

* Run Bruno collections using the Bruno CLI
* Support for environment files
* Support for environment variables as key-value pairs or `name=value` strings
* Detailed test results including:
  * Overall success/failure status
  * Test summary (total, passed, failed)
  * Detailed failure information
  * Execution timings

## Installation

### Installing via Smithery

To install Bruno MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@hungthai1401/bruno-mcp):

```bash
npx -y @smithery/cli install @hungthai1401/bruno-mcp --client claude
```

### Manual Installation
```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### Bruno CLI

Bruno Desktop is used to create and edit Bruno collections. Bruno CLI provides the `bru` command for running those collections from a terminal, CI job, or MCP server.

Install Bruno CLI globally if you want to run `bru` yourself:

```bash
npm install -g @usebruno/cli
```

Verify the installation:

```bash
bru --version
```

This MCP server also depends on `@usebruno/cli` locally, so a global Bruno CLI installation is optional when running this project with `npm ci` and `npm run build`.

### Local npx Service

To run this repository as a local MCP server through `npx`, build it first:

```bash
cd /path/bruno-mcp
npm ci
npm run build
```

Then configure your MCP client to run the local package path:

```json
{
  "mcpServers": {
    "bruno-runner-local": {
      "command": "npx",
      "args": [
        "-y",
        "/path/bruno-mcp"
      ]
    }
  }
}
```

You can also register the package as a local command:

```bash
cd /path/bruno-mcp
npm ci
npm run build
npm link
```

Then configure the MCP client to use the linked package:

```json
{
  "mcpServers": {
    "bruno-runner-local": {
      "command": "npx",
      "args": [
        "--no-install",
        "bruno-mcp"
      ]
    }
  }
}
```

Using the local package path is recommended because it does not depend on global `npm link` state.

## Configuration

Add the server to your Claude desktop configuration file at `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bruno-runner": {
      "command": "npx",
      "args": ["-y", "bruno-mcp"],
    }
  }
}
```

## Available Tools

### run-collection

Runs a Bruno collection and returns the test results.

**Parameters:**

* `collection` (required): Path to the Bruno collection
* `environment` (optional): Bruno environment name
* `variables` (optional): Environment variables as key-value pairs, or as `name=value` strings

**Example Parameters:**

```json
{
  "collection": "/path/to/collection/request.bru",
  "environment": "local",
  "variables": {
    "baseUrl": "https://api.example.com",
    "token": "secret-token"
  }
}
```

**Example Response:**

```json
{
  "success": true,
  "summary": {
    "total": 5,
    "failed": 0,
    "passed": 5
  },
  "failures": [],
  "timings": {
    "started": "2024-03-14T10:00:00.000Z",
    "completed": "2024-03-14T10:00:01.000Z",
    "duration": 1000
  }
}
```

### Example Usage in Claude

You can use the server in Claude by asking it to run a Bruno collection:

"Run the Bruno collection at /path/to/collection.bru and tell me if all tests passed"

Claude will:
1. Use the run-collection tool
2. Analyze the test results
3. Provide a human-friendly summary of the execution

## Development

### Project Structure

```
src/
  ├── index.ts           # Entry point
  ├── server.ts          # MCP Server implementation
  ├── runner.ts          # Bruno runner implementation
  └── types.ts           # Type definitions
```

### Running Tests

```bash
# Run tests
npm test

# Run tests with coverage
npm test:coverage
```

### Building

```bash
# Build the project
npm run build

# Clean build artifacts
npm run clean
```

## License

MIT 
