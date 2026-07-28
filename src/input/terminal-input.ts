import { StringDecoder } from 'node:string_decoder';
import type { KeyEvent } from '../type/terminal-input';
import { createNamedEvent } from './terminal-events';
import { parseInput } from './terminal-parsers';

const ESCAPE_DELAY_MS = 25;

export class TerminalInput {
    private onKey?: (event: KeyEvent) => void;
    private pending = '';
    private pendingEscapeTimeout?: ReturnType<typeof setTimeout>;
    private wasRaw = false;
    private wasFlowing = false;
    private decoder = new StringDecoder('utf8');

    constructor(private readonly input: NodeJS.ReadStream = process.stdin) { }

    start(onKey: (event: KeyEvent) => void): void {
        if (this.onKey) {
            return;
        }

        this.onKey = onKey;
        this.decoder = new StringDecoder('utf8');
        this.wasFlowing = this.input.readableFlowing === true;

        if (this.input.isTTY) {
            this.wasRaw = !!this.input.isRaw;
            this.input.setRawMode(true);
        }

        this.input.resume();
        this.input.on('data', this.handleData);
    }

    stop(): void {
        if (!this.onKey) {
            return;
        }

        this.input.off('data', this.handleData);

        if (this.input.isTTY) {
            this.input.setRawMode(this.wasRaw);
        }

        if (this.wasFlowing) {
            this.input.resume();
        } else {
            this.input.pause();
        }

        this.onKey = undefined;
        this.pending = '';
        this.clearEscapeTimeout();
    }

    private handleData = (chunk: Buffer | Uint8Array): void => {
        this.pending += this.decoder.write(Buffer.from(chunk));
        this.clearEscapeTimeout();

        while (this.pending) {
            const parsed = parseInput(this.pending);
            if (!parsed) {
                if (this.pending === '\x1b') {
                    this.waitForStandaloneEscape();
                }
                return;
            }

            this.pending = this.pending.slice(parsed.consumed);
            this.onKey?.(parsed.event);
        }
    };

    /** `\x1b` is both the Escape key and the start of terminal key sequences, so wait briefly to distinguish them. */
    private waitForStandaloneEscape(): void {
        this.pendingEscapeTimeout = setTimeout(() => {
            this.pendingEscapeTimeout = undefined;

            if (this.pending !== '\x1b') {
                return;
            }

            this.pending = '';

            if (this.onKey) {
                const namedEvent = createNamedEvent('escape', '\x1b');
                this.onKey(namedEvent);
            }
        }, ESCAPE_DELAY_MS);
    }

    private clearEscapeTimeout(): void {
        if (this.pendingEscapeTimeout === undefined) {
            return;
        }

        clearTimeout(this.pendingEscapeTimeout);
        this.pendingEscapeTimeout = undefined;
    }
}
