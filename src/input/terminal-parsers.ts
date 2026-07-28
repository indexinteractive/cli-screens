import type { KeyEvent, Modifiers } from '../type/terminal-input';
import {
    createNamedEvent,
    createTextEvent,
    type NamedKey,
} from './terminal-events';

export type ParsedInput = {
    event: KeyEvent;
    consumed: number;
};

const controlKeys: Record<string, NamedKey> = {
    '\r': 'enter',
    '\n': 'enter',
    '\t': 'tab',
    '\x7f': 'backspace',
    '\b': 'backspace',
};

const arrowKeys = {
    A: 'up',
    B: 'down',
    C: 'right',
    D: 'left',
} as const;

export function parseInput(value: string): ParsedInput | undefined {
    const character = Array.from(value)[0];
    if (!character) {
        return;
    }

    const controlKey = controlKeys[character];
    if (controlKey) {
        return parsed(createNamedEvent(controlKey, character));
    }

    if (character === '\x1b') {
        return parseEscapeSequence(value);
    }

    const code = character.charCodeAt(0);

    if (code >= 0x01 && code <= 0x1a) {
        return parsed(createTextEvent(String.fromCharCode(code + 0x60), character, { ctrl: true }));
    }

    return charIsPrintable(character)
        ? parsed(createTextEvent(character, character))
        : parsed(createNamedEvent('unknown', character));
}

function parseEscapeSequence(value: string): ParsedInput | undefined {
    if (value.length === 1) {
        return;
    }

    const prefix = value.charAt(1);
    if (prefix !== '[' && prefix !== 'O') {
        const character = Array.from(value.slice(1))[0];

        if (!character) {
            return;
        }

        if (character === '\x1b') {
            return parsed(createNamedEvent('escape', '\x1b'));
        }

        const sequence = value.slice(0, 1 + character.length);

        return charIsPrintable(character)
            ? parsed(createTextEvent(character, sequence, { alt: true }))
            : parsed(createNamedEvent('unknown', sequence, { alt: true }));
    }

    const match = /^\x1b(?:O(.)|\[([0-9;]*)([A-Za-z~]))/.exec(value);
    if (!match) {
        return;
    }

    const sequence = match[0];
    const final = match[1] ?? match[3] ?? '';
    const key = arrowKeys[final as keyof typeof arrowKeys] ?? 'unknown';
    const modifiers = prefix === '['
        ? parseCsiModifiers(match[2] ?? '')
        : {};

    return parsed(createNamedEvent(key, sequence, modifiers));
}

function parseCsiModifiers(params: string): Partial<Modifiers> {
    const modifier = Number(params.split(';').filter(Boolean).at(-1));
    const mask = modifier >= 2 && modifier <= 8 ? modifier - 1 : 0;

    return {
        shift: (mask & 1) !== 0,
        alt: (mask & 2) !== 0,
        ctrl: (mask & 4) !== 0,
    };
}

function parsed(event: KeyEvent): ParsedInput {
    return { event, consumed: event.sequence.length };
}

/** Checks whether a character can be emitted as terminal text. */
function charIsPrintable(character: string): boolean {
    const code = character.charCodeAt(0);
    return code >= 0x20 && code !== 0x7f;
}
