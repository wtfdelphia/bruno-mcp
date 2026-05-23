import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from 'zod';
import { createRequire } from 'module';
import { BrunoRunner } from './runner.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { RunCollectionSchema } from './types.js';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json') as { version: string };

export class BrunoServer {
  private server: Server;
  private runner: BrunoRunner;

  constructor() {
    this.server = new Server(
      {
        name: "bruno-runner",
        version: packageJson.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    this.runner = new BrunoRunner();
    this.setupTools();
  }

  private setupTools(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "run-collection",
          description: "Run a Bruno Collection using Bruno CLI",
          inputSchema: zodToJsonSchema(RunCollectionSchema)
        }
      ]
    }));
    
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      if (name !== "run-collection") {
        throw new Error(`Unknown tool: ${request.params.name}`);
      }
      
      try {
        const result = await this.runner.runCollection(RunCollectionSchema.parse(args));
        return {
          content: [{
              type: "text",
              text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(
            `Invalid arguments: ${error.errors
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join(", ")}`
          ); 
        }
        throw error;
      }
    });
  }

  async start(): Promise<Server> {
    // This will be connected in index.ts
    return Promise.resolve(this.server);
  }
} 
