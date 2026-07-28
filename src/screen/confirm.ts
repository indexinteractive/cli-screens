import type { Screen, ScreenEnvironment } from './screen';
import { defineScreen } from './screen';
import { renderText, type TextContent } from '../renderer/text-content';
import { select } from './select';

export interface ConfirmOptions {
    title?: TextContent;
    message: TextContent;
    confirmLabel?: TextContent;
    cancelLabel?: TextContent;
    initialValue?: boolean;
}

/**
 * Asks the user to confirm or cancel an action.
 *
 * Escape and Backspace always return `false`.
 */
export function confirm<Context = any>(options: ConfirmOptions | TextContent): Screen<Context, boolean> {
    const settings = (typeof options === 'string' || 'value' in options)
        ? { message: options }
        : options;

    const selection = select<boolean, Context>({
        choices: [
            { label: settings.confirmLabel ?? 'Yes', value: true },
            { label: settings.cancelLabel ?? 'No', value: false },
        ],
        initialIndex: (settings.initialValue ?? true) ? 0 : 1,
        cancelKeys: [],
    });

    return defineScreen<Context, boolean>({
        render(environment) {
            if (settings.title) {
                renderText(environment.ui, settings.title, { tone: 'accent' });
                environment.ui.blank();
            }

            renderText(environment.ui, settings.message);
            environment.ui.blank();
            selection.render(environment);
        },
        key(event, environment) {
            if (event.key === 'escape' || event.key === 'backspace') {
                environment.navigation.back(false);
                return;
            }

            selection.key?.(event, environment as ScreenEnvironment<Context, boolean>);
        },
    });
}
