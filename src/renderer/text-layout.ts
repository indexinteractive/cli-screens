const ansiPattern = /\x1b\[[0-?]*[ -/]*[@-~]/g;

function characterWidth(character: string): number {
    const code = character.codePointAt(0) ?? 0;
    if (
        code === 0
        || code < 32
        || (code >= 0x7f && code < 0xa0)
        || /\p{Mark}/u.test(character)
        || code === 0x200d
        || (code >= 0xfe00 && code <= 0xfe0f)
    ) {
        return 0;
    }
    return isWide(code) ? 2 : 1;
}

export function textWidth(value: string): number {
    return Array
        .from(value.replace(ansiPattern, ''))
        .reduce((width, character) => width + characterWidth(character), 0);
}

export function truncate(value: string, width: number): string {
    if (width <= 0) {
        return '';
    }

    let output = '';
    let currentWidth = 0;
    let offset = 0;

    while (offset < value.length) {
        const ansi = value.slice(offset).match(/^\x1b\[[0-?]*[ -/]*[@-~]/)?.[0];

        if (ansi) {
            output += ansi;
            offset += ansi.length;
            continue;
        }

        const character = Array.from(value.slice(offset))[0] ?? '';
        const nextWidth = characterWidth(character);

        if (currentWidth + nextWidth > width) {
            break;
        }

        output += character;
        currentWidth += nextWidth;
        offset += character.length;
    }

    return output;
}

export function wrap(value: string, width: number): string[] {
    if (width <= 0) {
        return [''];
    }

    if (textWidth(value) <= width) {
        return [value];
    }

    const lines: string[] = [];
    let remaining = value;
    while (remaining.length > 0) {
        const line = truncate(remaining, width);

        if (!line) {
            break;
        }

        lines.push(line);
        remaining = remaining.slice(line.length);
    }

    return lines.length > 0 ? lines : [''];
}

function isWide(code: number): boolean {
    return (
        code >= 0x1100 && (
            code <= 0x115f
            || code === 0x2329
            || code === 0x232a
            || (code >= 0x2e80 && code <= 0xa4cf && code !== 0x303f)
            || (code >= 0xac00 && code <= 0xd7a3)
            || (code >= 0xf900 && code <= 0xfaff)
            || (code >= 0xfe10 && code <= 0xfe19)
            || (code >= 0xfe30 && code <= 0xfe6f)
            || (code >= 0xff00 && code <= 0xff60)
            || (code >= 0xffe0 && code <= 0xffe6)
            || (code >= 0x1f300 && code <= 0x1faff)
            || (code >= 0x20000 && code <= 0x3fffd)
        )
    );
}
