export type TextColor =
    | 'black'
    | 'red'
    | 'green'
    | 'yellow'
    | 'blue'
    | 'magenta'
    | 'cyan'
    | 'white'
    | 'brightBlack'
    | 'brightRed'
    | 'brightGreen'
    | 'brightYellow'
    | 'brightBlue'
    | 'brightMagenta'
    | 'brightCyan'
    | 'brightWhite';

export const colors: Record<TextTone, string> = {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    brightBlack: '\x1b[90m',
    brightRed: '\x1b[91m',
    brightGreen: '\x1b[92m',
    brightYellow: '\x1b[93m',
    brightBlue: '\x1b[94m',
    brightMagenta: '\x1b[95m',
    brightCyan: '\x1b[96m',
    brightWhite: '\x1b[97m',
    accent: '\x1b[34m',
    muted: '\x1b[2m',
    default: '\x1b[0m',
};


export type TextTone = TextColor | 'accent' | 'muted' | 'default';

export interface TextOptions {
    tone?: TextTone;
}

export interface DividerOptions extends TextOptions {
    character?: string;
}

export const AnsiCode = {
    reset: '\x1b[0m',
    clear: '\x1b[H\x1b[2J',
    hideCursor: '\x1b[?25l',
    showCursor: '\x1b[?25h',
} as const;
