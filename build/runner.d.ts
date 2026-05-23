import { BrunoRunResult, RunCollectionParams } from './types.js';
export interface BrunoRunnerOptions {
    bruPath?: string;
}
export declare class BrunoRunner {
    private readonly bruPath?;
    constructor(options?: BrunoRunnerOptions);
    runCollection(params: RunCollectionParams): Promise<BrunoRunResult>;
    private executeBru;
    private resolveBruBin;
    private formatVariables;
    private parseReport;
    private isReportEntry;
}
