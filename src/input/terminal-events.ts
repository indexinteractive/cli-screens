import type { KeyEvent, Modifiers } from '../type/terminal-input';

export type NamedKey = Exclude<KeyEvent['key'], 'text'>;

const noModifiers: Modifiers = {
    ctrl: false,
    shift: false,
    alt: false,
};

export function createNamedEvent(key: NamedKey, sequence: string, modifiers: Partial<Modifiers> = {}): KeyEvent {
    return { key, ...noModifiers, ...modifiers, sequence };
}

export function createTextEvent(text: string, sequence: string, modifiers: Partial<Modifiers> = {}): KeyEvent {
    return { key: 'text', text, ...noModifiers, ...modifiers, sequence };
}
