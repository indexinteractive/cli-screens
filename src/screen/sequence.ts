import { defineScreen, type Screen } from './screen';

/**
 * A screen to display in a sequence, or a factory that creates one when its
 * turn begins.
 */
export type ScreenSource<Context> = Screen<Context, any> | (() => Screen<Context, any>);

/**
 * Creates a screen that displays each supplied screen in order.
 *
 * A screen advances when it navigates back. Lazy factories are not invoked
 * until their turn begins. After the final screen navigates back, the sequence
 * also navigates back. If the sequence is unmounted or the app exits, no later
 * screens are created.
 *
 * @example
 * ```ts
 * await app.run(sequence([
 *     typewriter({ text: 'Welcome!' }),
 *     () => gameMenuScreen(),
 * ]));
 * ```
 */
export function sequence<Context = any>(sources: readonly ScreenSource<Context>[]): Screen<Context, void> {
    return defineScreen<Context>({
        async mount({ navigation, signal }) {
            for (const source of sources) {
                if (signal.aborted) {
                    return;
                }

                const screen = typeof source === 'function' ? source() : source;

                await navigation.push(screen);
            }

            if (!signal.aborted) {
                navigation.back();
            }
        },

        render() {
            // A child screen is pushed during mount and owns the visible frame.
        },
    });
}
