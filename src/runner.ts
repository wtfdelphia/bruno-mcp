import { BrunoRunResult, RunCollectionParams } from './types.js';
import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { withReportFile } from './utils.js';
import { dirname, basename } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export interface BrunoRunnerOptions {
  bruPath?: string;
}

interface BrunoReportEntry {
  summary: {
    totalRequests?: number;
    failedRequests?: number;
    passedRequests?: number;
  };
  results?: Array<{
    suitename?: string;
    error?: string;
  }>;
}

export class BrunoRunner {
  private readonly bruPath?: string;

  constructor(options: BrunoRunnerOptions = {}) {
    this.bruPath = options.bruPath;
  }

  async runCollection(params: RunCollectionParams): Promise<BrunoRunResult> {
    const startTime = new Date();
    
    return withReportFile('bruno-run-', '.json', async (outputFile) => {
      // Get collection directory and name
      const collectionDir = dirname(params.collection);
      const collectionName = basename(params.collection);

      // Build the Bruno CLI arguments without shell interpolation.
      const args: string[] = ['run', collectionName];

      // Add environment if specified
      if (params.environment) {
        args.push('--env', params.environment);
      }

      // Add environment variables if specified
      const variables = this.formatVariables(params.variables);
      if (variables.length > 0) {
        for (const variable of variables) {
          args.push('--env-var', variable);
        }
      }

      // Add output file
      args.push('--reporter-json', outputFile);

      // Skip all headers
      args.push('--reporter-skip-all-headers');

      await this.executeBru(args, collectionDir, outputFile);

      // Read the results from the output file
      const resultJson = await readFile(outputFile, 'utf-8');
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      const jsonResult = this.parseReport(resultJson);

      const { summary, results = [] } = jsonResult;
      const isSuccess = summary.failedRequests === 0;

      // Transform CLI results into our standard format
      return {
        success: isSuccess,
        summary: {
          total: summary.totalRequests || 0,
          failed: summary.failedRequests || 0,
          passed: summary.passedRequests || 0
        },
        failures: isSuccess ? [] : results.filter((result) => result.error).map((failure) => ({
          name: failure.suitename || 'Unknown Test',
          message: failure.error || 'Unknown error'
        })),
        timings: {
          started: startTime.toISOString(),
          completed: endTime.toISOString(),
          duration
        }
      };
    });
  }

  private executeBru(args: string[], cwd: string, outputFile: string): Promise<void> {
    const command = this.bruPath ?? process.execPath;
    const commandArgs = this.bruPath ? args : [this.resolveBruBin(), ...args];

    console.error('Running Bruno collection:', basename(args[1] ?? 'collection'));

    return new Promise((resolve, reject) => {
      const child = spawn(command, commandArgs, {
        cwd,
        shell: false,
        env: process.env
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr?.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('error', reject);

      child.on('close', (code) => {
        if (code === 0 || existsSync(outputFile)) {
          resolve();
          return;
        }

        const output = stderr.trim() || stdout.trim() || 'Unknown error';
        reject(new Error(`Bruno CLI failed with exit code ${code}: ${output}`));
      });
    });
  }

  private resolveBruBin(): string {
    return require.resolve('@usebruno/cli/bin/bru.js');
  }

  private formatVariables(variables: RunCollectionParams['variables']): string[] {
    if (!variables) {
      return [];
    }

    if (Array.isArray(variables)) {
      return variables;
    }

    return Object.entries(variables).map(([key, value]) => `${key}=${value}`);
  }

  private parseReport(resultJson: string): BrunoReportEntry {
    let parsed: unknown;

    try {
      parsed = JSON.parse(resultJson);
    } catch (error) {
      throw new Error(`Unexpected Bruno JSON report format: ${(error as Error).message}`);
    }

    if (!Array.isArray(parsed) || parsed.length === 0 || !this.isReportEntry(parsed[0])) {
      throw new Error('Unexpected Bruno JSON report format');
    }

    return parsed[0];
  }

  private isReportEntry(value: unknown): value is BrunoReportEntry {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const summary = (value as { summary?: unknown }).summary;
    return !!summary && typeof summary === 'object';
  }
} 
