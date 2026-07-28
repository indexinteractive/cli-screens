import { defineScreen, type Screen } from './screen';
import { normalizeText, renderText, type TextContent } from '../renderer/text-content';

export interface Choice<Value> {
    label: TextContent;
    value: Value;
    description?: TextContent;
    disabled?: boolean;
}

export interface SelectOptions<Value> {
    title?: TextContent;
    choices: readonly Choice<Value>[];
    initialIndex?: number;
    loop?: boolean;
    subtitle?: TextContent;
    cancelKeys?: readonly ('escape' | 'backspace')[];
    /** Maximum number of choices shown at once, in addition to terminal limits. */
    maxVisible?: number;
}

export function select<Value, Context = any>(options: SelectOptions<Value>): Screen<Context, Value> {
    let selectedIndex = findEnabled(options.choices, options.initialIndex ?? 0, 1);
    let windowStart = 0;

    return defineScreen<Context, Value>({
        render({ ui }) {
            if (options.title) {
                renderText(ui, options.title, { tone: 'accent' });
                ui.blank();
            }

            const subtitleText = options.subtitle ?? 'Use ↑/↓ to move, Enter to select.';
            renderText(ui, subtitleText, { tone: 'muted' });
            ui.blank();

            const titleRows = options.title
                ? normalizeText(options.title).value.split('\n').length + 1
                : 0;

            const subtitleRows = normalizeText(subtitleText).value.split('\n').length + 1;

            const viewport = getViewport(options.choices, selectedIndex, windowStart, Math.max(1, ui.height - titleRows - subtitleRows), options.maxVisible);
            windowStart = viewport.start;

            if (viewport.start > 0) {
                ui.text(`  ↑ ${viewport.start} more`, { tone: 'muted' });
            }

            for (let index = viewport.start; index < viewport.end; index++) {
                const choice = options.choices[index]!;
                const marker = index === selectedIndex ? '> ' : '  ';
                const suffix = choice.disabled ? ' (unavailable)' : '';
                const label = normalizeText(choice.label);

                renderText(ui, {
                    value: `${marker}${label.value}${suffix}`,
                    align: label.align,
                    tone: index === selectedIndex
                        ? 'accent'
                        : choice.disabled
                            ? 'muted'
                            : label.tone,
                });

                if (choice.description) {
                    const description = normalizeText(choice.description, { tone: 'muted' });
                    renderText(ui, {
                        ...description,
                        value: `    ${description.value}`,
                    });
                }
            }

            const remaining = options.choices.length - viewport.end;
            if (remaining > 0) {
                ui.text(`  ↓ ${remaining} more`, { tone: 'muted' });
            }
        },

        key(event, { navigation, requestRender }) {
            const cancelKeys = options.cancelKeys ?? ['escape', 'backspace'];

            if (cancelKeys.includes(event.key as 'escape' | 'backspace')) {
                navigation.back();
                return;
            }

            if (event.key === 'enter') {
                const selected = options.choices[selectedIndex];

                if (selected && !selected.disabled) {
                    navigation.back(selected.value);
                }

                return;
            }

            const direction = event.key === 'up'
                ? -1
                : (event.key === 'down' ? 1 : 0);

            if (direction === 0 || options.choices.length === 0) {
                return;
            }

            const next = move(options.choices, selectedIndex, direction, options.loop ?? true);

            if (next !== selectedIndex) {
                selectedIndex = next;
                requestRender();
            }
        },
    });
}

function getViewport<Value>(choices: readonly Choice<Value>[], selectedIndex: number, requestedStart: number, availableRows: number, maxVisible = Number.POSITIVE_INFINITY): { start: number; end: number } {
    if (choices.length === 0) return { start: 0, end: 0 };

    let start = Math.max(0, Math.min(requestedStart, choices.length - 1));

    if (selectedIndex >= 0 && selectedIndex < start) {
        start = selectedIndex;
    }

    let end = viewportEnd(choices, start, availableRows, maxVisible);

    while (selectedIndex >= end && start < selectedIndex) {
        start += 1;
        end = viewportEnd(choices, start, availableRows, maxVisible);
    }

    return { start, end };
}

function viewportEnd<Value>(choices: readonly Choice<Value>[], start: number, availableRows: number, maxVisible: number): number {
    let rowsUsed = start > 0 ? 1 : 0;
    let end = start;
    let visibleCount = 0;
    const choiceLimit = Math.max(1, maxVisible);

    while (end < choices.length && visibleCount < choiceLimit) {
        const choiceRows = choices[end]?.description ? 2 : 1;
        const bottomIndicatorRows = end + 1 < choices.length ? 1 : 0;

        if (end > start && rowsUsed + choiceRows + bottomIndicatorRows > availableRows) {
            break;
        }

        rowsUsed += choiceRows;
        end += 1;
        visibleCount += 1;
    }

    return Math.max(start + 1, end);
}

function findEnabled<Value>(choices: readonly Choice<Value>[], requestedIndex: number, direction: 1 | -1): number {
    if (choices.length === 0) {
        return -1;
    }

    const start = Math.min(Math.max(0, requestedIndex), choices.length - 1);

    for (let offset = 0; offset < choices.length; offset++) {
        const index = (start + offset * direction + choices.length) % choices.length;
        if (!choices[index]?.disabled) {
            return index;
        }
    }

    return -1;
}

function move<Value>(choices: readonly Choice<Value>[], current: number, direction: 1 | -1, loop: boolean): number {
    if (current < 0) {
        return findEnabled(choices, 0, 1);
    }

    let index = current;

    for (let count = 0; count < choices.length; count++) {
        const candidate = index + direction;

        if (!loop && (candidate < 0 || candidate >= choices.length)) {
            return current;
        }

        index = (candidate + choices.length) % choices.length;

        if (!choices[index]?.disabled) {
            return index;
        }
    }

    return current;
}
