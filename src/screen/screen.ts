import type { Ui } from '../renderer/ui';
import type { KeyEvent } from '../type/terminal-input';

declare const screenResult: unique symbol;

export interface Navigation<Context, CurrentResult = void> {
    push<Result>(screen: Screen<Context, Result>): Promise<Result | undefined>;
    back(result?: CurrentResult): void;
    replace<Result>(screen: Screen<Context, Result>): void;
    reset<Result>(screen: Screen<Context, Result>): void;
    exit(result?: unknown): void;
}

export interface ScreenEnvironment<Context, Result = void> {
    readonly context: Readonly<Context>;
    readonly navigation: Navigation<Context, Result>;
    readonly signal: AbortSignal;
    requestRender(): void;
}

export interface RenderEnvironment<Context, Result = void>
    extends ScreenEnvironment<Context, Result> {
    readonly ui: Ui;
}

export interface Screen<Context = any, Result = void> {
    /** @internal Carries the result type without affecting runtime values. */
    readonly [screenResult]?: Result;

    /**
     * Called once when this screen is pushed to the stack.
     *
     * Use this hook to start requests, timers, subscriptions, or other side
     * effects. The first render occurs immediately after this hook is invoked;
     * the runtime does not wait for a returned promise before rendering. Call
     * `requestRender()` when asynchronous state changes should be displayed.
     */
    mount?(environment: ScreenEnvironment<Context, Result>): void | Promise<void>;

    /**
     * Called when the screen needs to draw its complete frame.
     *
     * Occurs immediately after `mount()` is invoked.
     * Further renders occur after navigation transitions, calls to `requestRender()`,
     * and terminal resize events.
     *
     * Rendering should be synchronous and free of side effects. Use `mount()`
     * or `key()` for work that changes state, then call `requestRender()`.
     */
    render(environment: RenderEnvironment<Context, Result>): void;

    /**
     * Called when the active screen receives a keyboard event.
     *
     * Only the screen at the top of the stack receives input. Ctrl-C is handled
     * by the app runtime and is not forwarded. This hook is synchronous so
     * input ordering and navigation remain predictable. Start asynchronous work
     * in a screen pushed from this hook, or explicitly start a detached task.
     */
    key?(event: KeyEvent, environment: ScreenEnvironment<Context, Result>): void;

    /**
     * Called immediately before another screen is pushed above this screen.
     *
     * This hook runs for `navigation.push()` only. It does not run when the
     * screen is replaced, reset, popped, or removed during app shutdown. The
     * screen remains mounted but stops receiving renders and input until it is
     * resumed.
     */
    suspend?(environment: ScreenEnvironment<Context, Result>): void;

    /**
     * Called when a child screen is popped and this screen becomes active again.
     *
     * This follows `navigation.back()` from the child, including when that
     * child was replaced before eventually going back. It is not called while
     * intermediate screens are removed by `replace()`, `reset()`, or app exit.
     * A render occurs immediately after this hook.
     */
    resume?(environment: ScreenEnvironment<Context, Result>): void;

    /**
     * Called once just before this screen is permanently discarded.
     *
     * This occurs on `navigation.back()`, `replace()`, `reset()`, app exit,
     * `dispose()`, or fatal runtime error. Its abort signal is aborted before
     * this hook runs, so asynchronous work can observe cancellation. During a
     * reset or app shutdown, screens are unmounted from the top of the stack
     * downward.
     *
     * The runtime invokes this synchronous hook only once. Cancel asynchronous
     * work through the abort signal; do not start cleanup that must be awaited.
     */
    unmount?(environment: ScreenEnvironment<Context, Result>): void;
}

/**
 * Allows a custom screen to be implemented with its own context,
 * result value, lifecycle hooks, renderer, and navigation methods.
 *
 * `defineScreen` does not add runtime behavior.
 * Use `mount` for side effects, `render` to draw
 * the current frame, and `key` to respond to input. A screen can return a value
 * to its parent with `navigation.back(result)`.
 *
 * @example
 * ```ts
 * type AppContext = { version: string };
 *
 * const aboutScreen = defineScreen<AppContext, string>({
 *     render({ context, ui }) {
 *         ui.text(`Version ${context.version}`);
 *         ui.text('Press Enter to continue');
 *     },
 *
 *     key(event, { navigation }) {
 *         if (event.key === 'enter') {
 *             navigation.back('dismissed');
 *         }
 *     },
 * });
 *
 * const result = await navigation.push(aboutScreen);
 * // result is string | undefined
 * ```
 */
export function defineScreen<Context = any, Result = void>(screen: Screen<Context, Result>): Screen<Context, Result> {
    return screen;
}
