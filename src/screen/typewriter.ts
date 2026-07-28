import { defineScreen, type Screen } from './screen';
import { alignmentPadding, alignText, normalizeText, type TextAlignment, type TextContent } from '../renderer/text-content';

export interface TypewriterOptions {
    /** Optional heading displayed above the animated text. */
    title?: TextContent;
    text: TextContent;
    charactersPerSecond?: number;
    /** Automatically closes the screen when typing completes. Defaults to `false`. */
    autoDismiss?: boolean;
}

export function typewriter(options: TypewriterOptions): Screen<any, void> {
    const title = options.title === undefined
        ? undefined
        : normalizeText(options.title);

    const body = normalizeText(options.text);
    const characters = Array.from(body.value);
    const speed = Math.max(1, options.charactersPerSecond ?? 30);

    let visibleCount = 0;
    let timer: ReturnType<typeof setInterval> | undefined;

    return defineScreen<any, void>({
        mount({ requestRender, navigation, signal }) {
            if (characters.length === 0) {
                if (options.autoDismiss) {
                    navigation.back();
                }

                return;
            }

            const delay = Math.max(1, Math.round(1000 / speed));

            timer = setInterval(() => {
                visibleCount = Math.min(characters.length, visibleCount + 1);
                requestRender();
                if (visibleCount === characters.length && timer) {
                    clearInterval(timer);
                    timer = undefined;

                    if (options.autoDismiss) {
                        navigation.back();
                    }
                }
            }, delay);
            signal.addEventListener('abort', () => {
                if (timer) {
                    clearInterval(timer);
                }

                timer = undefined;
            }, { once: true });
        },

        render({ ui }) {
            if (title) {
                const titleContent = alignText(title.value, title.align, ui.width);
                ui.text(titleContent, { tone: title.tone });
                ui.blank();
            }

            const bodyContent = alignAnimatedText(body.value, visibleCount, body.align, ui.width);
            ui.text(bodyContent, { tone: body.tone });

            if (visibleCount === characters.length && !options.autoDismiss) {
                ui.blank();

                const dismissText = alignText('Press Enter to return.', body.align, ui.width);
                ui.text(dismissText);
            }
        },

        key(event, { navigation, requestRender }) {
            if (options.autoDismiss) {
                return;
            }

            if (visibleCount < characters.length) {
                visibleCount = characters.length;

                if (timer) {
                    clearInterval(timer);
                }

                timer = undefined;
                requestRender();

                return;
            }
            if (visibleCount === characters.length && (event.key === 'enter' || event.key === 'escape' || event.key === 'backspace')) {
                navigation.back();
            }
        },
    });
}

function alignAnimatedText(completeText: string, visibleCount: number, alignment: TextAlignment, width: number): string {
    const completeLines = completeText.split('\n');

    const visibleLines = Array.from(completeText)
        .slice(0, visibleCount)
        .join('')
        .split('\n');

    return visibleLines.map((line, index) => {
        const completeLine = completeLines[index] ?? '';
        return `${alignmentPadding(completeLine, alignment, width)}${line}`;
    }).join('\n');
}
