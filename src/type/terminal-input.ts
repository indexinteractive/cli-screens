export type Modifiers = {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
};

export type KeyEvent = Modifiers & { sequence: string } & (
    | { key: 'text'; text: string }
    | { key: 'up' | 'down' | 'left' | 'right' | 'enter' | 'backspace' | 'escape' | 'tab' | 'unknown' }
);
