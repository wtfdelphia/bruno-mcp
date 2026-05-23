import { z } from 'zod';
export interface BrunoRunResult {
    success: boolean;
    summary: {
        total: number;
        failed: number;
        passed: number;
    };
    failures: Array<{
        name: string;
        message: string;
    }>;
    timings: {
        started: string;
        completed: string;
        duration: number;
    };
}
export declare const RunCollectionSchema: z.ZodObject<{
    collection: z.ZodString;
    environment: z.ZodOptional<z.ZodString>;
    variables: z.ZodOptional<z.ZodUnion<[z.ZodRecord<z.ZodString, z.ZodString>, z.ZodArray<z.ZodString, "many">]>>;
}, "strip", z.ZodTypeAny, {
    collection: string;
    environment?: string | undefined;
    variables?: Record<string, string> | string[] | undefined;
}, {
    collection: string;
    environment?: string | undefined;
    variables?: Record<string, string> | string[] | undefined;
}>;
export type RunCollectionParams = z.infer<typeof RunCollectionSchema>;
