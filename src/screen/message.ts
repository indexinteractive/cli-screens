import { defineScreen, type Screen } from './screen';
import { renderText, type TextContent } from '../renderer/text-content';
import type { KeyEvent } from '../type/terminal-input';

export type DismissKey = Exclude<KeyEvent['key'], 'text' | 'unknown'> | 'any';

export interface MessageOptions {
    title?: TextContent;
    text: TextContent;
    hint?: TextContent;
    dismissKeys?: readonly DismissKey[];
}

export function message(options: MessageOptions | TextContent): Screen<any, void> {
    const settings = (typeof options === 'string' || 'value' in options)
        ? { text: options }
        : options;

    const dismissKeys = settings.dismissKeys ?? ['enter', 'escape', 'backspace'];

    return defineScreen<any, void>({
        render({ ui }) {
            if (settings.title) {
                renderText(ui, settings.title, { tone: 'accent' });
                ui.blank();
            }

            renderText(ui, settings.text);
            ui.blank();
            renderText(ui, settings.hint ?? 'Press Enter to return.', { tone: 'muted' });
        },

        key(event, { navigation }) {
            if (dismissKeys.includes('any') || dismissKeys.includes(event.key as DismissKey)) {
                navigation.back();
            }
        },
    });
}
