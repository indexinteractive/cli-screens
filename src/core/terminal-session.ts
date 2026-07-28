import { TerminalInput } from '../input/terminal-input';
import type { CliOutput } from '../type/cli-options';
import type { KeyEvent } from '../type/terminal-input';
import { AnsiCode } from '../type/text';

interface TerminalHandlers {
    key: (event: KeyEvent) => void;
    resize: () => void;
    sigint: () => void;
}

export class TerminalSession {
    private readonly input: TerminalInput;
    private readonly output: CliOutput;

    private handlers?: TerminalHandlers;

    constructor(input?: NodeJS.ReadStream, output: CliOutput = process.stdout) {
        this.input = new TerminalInput(input);
        this.output = output;
    }

    get width(): number {
        return Math.max(1, process.stdout.columns ?? 80);
    }

    get height(): number {
        return Math.max(1, process.stdout.rows ?? 24);
    }

    start(handlers: TerminalHandlers): void {
        this.handlers = handlers;
        this.output.write(AnsiCode.hideCursor);

        this.input.start(handlers.key);

        process.on('SIGINT', handlers.sigint);
        process.stdout.on('resize', handlers.resize);
    }

    writeFrame(frame: string): void {
        this.output.write(`${AnsiCode.clear}${AnsiCode.reset}${frame}`);
    }

    stop(): void {
        this.input.stop();

        if (this.handlers) {
            process.off('SIGINT', this.handlers.sigint);
            process.stdout.off('resize', this.handlers.resize);
            this.handlers = undefined;
        }

        this.output.write(`${AnsiCode.clear}${AnsiCode.reset}`);
        this.output.write(AnsiCode.showCursor);
        this.output.write(AnsiCode.reset);
    }
}
