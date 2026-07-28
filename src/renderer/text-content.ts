import type { TextTone } from '../type/text';
import { textWidth } from './text-layout';
import type { Ui } from './ui';

export type TextAlignment = 'left' | 'center' | 'right';

export interface DecoratedText {
    value: string;
    align?: TextAlignment;
    tone?: TextTone;
}

/**
 * Text using default presentation, or text with explicit presentation options.
 */
export type TextContent = string | DecoratedText;

export function normalizeText(content: TextContent, defaults: Partial<Omit<DecoratedText, 'value'>> = {}): Required<DecoratedText> {
    return typeof content === 'string'
        ? { align: 'left', tone: 'default', ...defaults, value: content }
        : { align: 'left', tone: 'default', ...defaults, ...content };
}

/**
 * Renders plain or decorated text as a complete block.
 *
 * Defaults allow a component to retain its standard presentation while still
 * permitting a decorated value to override alignment or tone.
 */
export function renderText(ui: Ui, content: TextContent, defaults?: Partial<Omit<DecoratedText, 'value'>>): void {
    const { value, tone, align } = normalizeText(content, defaults);

    const aligned = alignText(value, align, ui.width);

    ui.text(aligned, { tone: tone });
}

export function alignText(value: string, alignment: TextAlignment, width: number): string {
    return value.split('\n')
        .map(line => `${alignmentPadding(line, alignment, width)}${line}`)
        .join('\n');
}

export function alignmentPadding(completeLine: string, alignment: TextAlignment, width: number): string {
    const available = Math.max(0, width - textWidth(completeLine));
    const padding = alignment === 'center'
        ? Math.floor(available / 2)
        : (alignment === 'right' ? available : 0);

    return ' '.repeat(padding);
}
