import { defineScreen, type Screen } from './screen';
import { normalizeText, renderText, type TextContent } from '../renderer/text-content';

export interface TextInputOptions {
    message?: TextContent;
    initialValue?: string;
    placeholder?: TextContent;

    /** Hides entered text using `*` when true or the provided string, without changing the returned value. */
    mask?: boolean | string;

    allowEmpty?: boolean;
    validate?: (value: string) => TextContent | undefined;
    cancelKeys?: readonly ('escape')[];
}

export function textInput(options: TextInputOptions = {}): Screen<any, string> {
    let value = options.initialValue ?? '';
    let cursor = Array.from(value).length;
    let error: TextContent | undefined;

    return defineScreen<any, string>({
        render({ ui }) {
            renderText(ui, options.message ?? 'Enter a value, then press Enter.');
            ui.blank();
            const mask = typeof options.mask === 'string' ? options.mask : '*';
            const characters = Array.from(value);

            const visibleCharacters = options.mask
                ? characters.map(() => mask)
                : characters;

            let input;

            if (visibleCharacters.length === 0) {
                input = normalizeText(options.placeholder ?? '│', { tone: 'muted' });
            } else {
                const beforeCursor = visibleCharacters.slice(0, cursor).join('');
                const afterCursor = visibleCharacters.slice(cursor).join('');
                input = {
                    value: `${beforeCursor}│${afterCursor}`,
                    align: 'left' as const,
                    tone: 'accent' as const,
                };
            }

            renderText(ui, {
                ...input,
                value: `> ${input.value}`,
            });

            if (error) {
                ui.blank();
                renderText(ui, error, { tone: 'accent' });
            }
        },

        key(event, { navigation, requestRender }) {
            if (event.key === 'escape' && (options.cancelKeys ?? ['escape']).includes('escape')) {
                navigation.back();
                return;
            }
            if (event.key === 'enter') {
                error = !options.allowEmpty && value.length === 0
                    ? 'A value is required.'
                    : options.validate?.(value);

                if (error) {
                    requestRender();
                }

                else {
                    navigation.back(value);
                }

                return;
            }
            if (event.key === 'backspace') {
                const characters = Array.from(value);
                if (cursor > 0) {
                    characters.splice(cursor - 1, 1);
                    cursor -= 1;
                    value = characters.join('');
                }

                error = undefined;
                requestRender();

                return;
            }
            if (event.key === 'left' || event.key === 'right') {
                const change = event.key === 'left' ? -1 : 1;

                cursor = Math.max(0, Math.min(Array.from(value).length, cursor + change));
                requestRender();

                return;
            }
            if (event.key === 'text' && !event.ctrl && !event.alt) {
                const characters = Array.from(value);
                const inserted = Array.from(event.text);

                characters.splice(cursor, 0, ...inserted);

                cursor += inserted.length;
                value = characters.join('');
                error = undefined;

                requestRender();
            }
        },
    });
}
