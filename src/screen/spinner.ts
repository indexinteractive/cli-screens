import { defineScreen, type Screen } from './screen';
import { alignText, normalizeText, renderText, type TextContent } from '../renderer/text-content';

const defaultFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const;

export interface SpinnerOptions {
    title?: TextContent;
    text?: TextContent;
    frames?: readonly string[];
    intervalMs?: number;
}

/**
 * Displays an animated status indicator.
 *
 * Use with `withTask()` when the spinner should remain visible for the
 * lifetime of asynchronous work.
 */
export function spinner(options: SpinnerOptions | TextContent = {}): Screen<any, void> {
    const settings = (typeof options === 'string' || 'value' in options)
        ? { text: options }
        : options;

    const body = normalizeText(settings.text ?? 'Working...');
    const frames = settings.frames && settings.frames.length > 0
        ? settings.frames
        : defaultFrames;
    const intervalMs = Math.max(1, settings.intervalMs ?? 80);

    let frameIndex = 0;
    let timer: ReturnType<typeof setInterval> | undefined;

    return defineScreen({
        mount({ requestRender, signal }) {
            timer = setInterval(() => {
                frameIndex = (frameIndex + 1) % frames.length;
                requestRender();
            }, intervalMs);

            signal.addEventListener('abort', () => {
                if (timer) {
                    clearInterval(timer);
                }

                timer = undefined;
            }, { once: true });
        },

        render({ ui }) {
            if (settings.title) {
                renderText(ui, settings.title, { tone: 'accent' });
                ui.blank();
            }

            const frame = frames[frameIndex] ?? '';
            const text = `${frame} ${body.value}`;
            ui.text(alignText(text, body.align, ui.width), { tone: body.tone });
        },
    });
}
