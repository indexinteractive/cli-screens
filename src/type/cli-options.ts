export interface CliOutput {
    write(value: string): unknown;
}

export interface CliOptions<Context> {
    context: Context;
    input?: NodeJS.ReadStream;
    output?: CliOutput;
    onError?: (error: unknown) => void;
}
