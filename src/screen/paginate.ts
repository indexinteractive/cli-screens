import { defineScreen, type Screen } from './screen';
import { alignText, normalizeText, renderText, type TextContent } from '../renderer/text-content';
import { wrap } from '../renderer/text-layout';

export interface PaginateOptions {
    title?: TextContent;
    text: TextContent;
    initialPage?: number;
    hint?: string;
    cancelKeys?: readonly ('escape' | 'backspace')[];
}

/**
 * Displays long text one terminal-sized page at a time.
 */
export function paginate<Context = any>(options: PaginateOptions | TextContent): Screen<Context, void> {
    const settings = (typeof options === 'string' || 'value' in options)
        ? { text: options }
        : options;

    const body = normalizeText(settings.text);
    let currentPage = Math.max(0, Math.floor(settings.initialPage ?? 0));
    let pageCount = 1;

    return defineScreen<Context>({
        render({ ui }) {
            const titleRows = settings.title
                ? wrapLines(normalizeText(settings.title).value, ui.width).length + 1
                : 0;

            // Reserve one blank line and one line for the page indicator.
            const rowsPerPage = Math.max(1, ui.height - titleRows - 2);
            const lines = wrapLines(body.value, ui.width);
            pageCount = Math.max(1, Math.ceil(lines.length / rowsPerPage));
            currentPage = Math.min(currentPage, pageCount - 1);

            if (settings.title) {
                renderText(ui, settings.title, { tone: 'accent' });
                ui.blank();
            }

            const start = currentPage * rowsPerPage;
            const visibleLines = lines.slice(start, start + rowsPerPage);

            for (const line of visibleLines) {
                ui.text(alignText(line, body.align, ui.width), { tone: body.tone });
            }

            ui.blank();
            ui.columns(`Page ${currentPage + 1} of ${pageCount}`, settings.hint ?? '←/→ page · Esc return', { tone: 'muted' });
        },

        key(event, { navigation, requestRender }) {
            const cancelKeys = settings.cancelKeys ?? ['escape', 'backspace'];
            if (cancelKeys.includes(event.key as 'escape' | 'backspace')) {
                navigation.back();
                return;
            }

            const direction = event.key === 'right' || event.key === 'down'
                ? 1
                : event.key === 'left' || event.key === 'up'
                    ? -1
                    : 0;

            const nextPage = Math.max(0, Math.min(pageCount - 1, currentPage + direction));
            if (nextPage !== currentPage) {
                currentPage = nextPage;
                requestRender();
            }
        },
    });
}

function wrapLines(value: string, width: number): string[] {
    return value
        .split('\n')
        .flatMap(line => wrap(line, width));
}
