import { AnsiCode, colors, type DividerOptions, type TextOptions } from '../type/text';
import { textWidth, truncate, wrap } from './text-layout';

export class Ui {
    private readonly lines: string[] = [];

    constructor(public readonly width: number, public readonly height = 24) { }

    /** Formats text with renderer styling without adding it to the frame. */
    style(value: string, { tone = 'default' }: TextOptions = {}): string {
        return `${colors[tone]}${value}${AnsiCode.reset}`;
    }

    text(value: string, { tone = 'default' }: TextOptions = {}): void {
        const sourceLines = value.split('\n');
        for (const sourceLine of sourceLines) {
            for (const line of wrap(sourceLine, this.width)) {
                this.lines.push(`${colors[tone]}${line}${AnsiCode.reset}`);
            }
        }
    }

    blank(): void {
        this.lines.push('');
    }

    columns(left: string, right: string, { tone = 'default' }: TextOptions = {}): void {
        const rightText = truncate(right, Math.max(0, this.width - 1));
        const leftWidth = Math.max(0, this.width - textWidth(rightText) - 1);
        const leftText = truncate(left, leftWidth);
        const gap = Math.max(0, this.width - textWidth(leftText) - textWidth(rightText));
        const line = `${leftText}${' '.repeat(gap)}${rightText}`;
        this.lines.push(`${colors[tone]}${line}${AnsiCode.reset}`);
    }

    divider({ character = '-', tone = 'default' }: DividerOptions = {}): void {
        const token = Array.from(character)[0] ?? '-';
        this.lines.push(`${colors[tone]}${token.repeat(this.width)}${AnsiCode.reset}`);
    }

    header(lines: string[]): void {
        const border = '#'.repeat(this.width);
        this.lines.push(border);
        for (const line of lines) {
            const innerWidth = Math.max(0, this.width - 2);
            const truncated = truncate(line, innerWidth);
            const content = truncated + ' '.repeat(Math.max(0, innerWidth - textWidth(truncated)));
            this.lines.push(`#${content}#`);
        }
        this.lines.push(border);
    }

    /** @internal Serializes a UI instance for terminal output. */
    static renderFrame(ui: Ui): string {
        return `${ui.lines.join('\n')}\n`;
    }
}
