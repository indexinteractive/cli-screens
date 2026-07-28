import { defineScreen, type Navigation, type RenderEnvironment, type Screen, type ScreenEnvironment } from './screen';

export interface TaskEnvironment<Context> {
    readonly context: Readonly<Context>;
    readonly signal: AbortSignal;
}

export type ScreenTask<Context, Result> = (environment: TaskEnvironment<Context>) => Result | Promise<Result>;

/**
 * Displays a screen while an asynchronous task runs.
 *
 * The task controls the decorated screen's lifetime. Navigation that would
 * remove the visual screen is ignored; when the task completes, the decorator
 * navigates back with the task result. Removing the decorator aborts the signal
 * supplied to the task and unmounts the visual screen.
 *
 * @example
 * ```ts
 * const loading = withTask<AppContext, User[]>(
 *     typewriter({ text: 'Loading users...' }),
 *     async ({ context, signal }) => {
 *         return context.api.loadUsers({ signal });
 *     },
 * );
 *
 * const users = await navigation.push(loading);
 * ```
 */
export function withTask<Context = any, Result = void>(screen: Screen<Context, any>, task: ScreenTask<Context, Result>): Screen<Context, Result> {
    let screenEnvironment: ScreenEnvironment<Context, any> | undefined;

    return defineScreen<Context, Result>({
        async mount(environment) {
            screenEnvironment = decorateEnvironment(environment);

            const visualMount = Promise.resolve(screen.mount?.(screenEnvironment));
            const taskResult = Promise
                .resolve()
                .then(() => task({
                    context: environment.context,
                    signal: environment.signal,
                }));

            // Visual setup may be asynchronous, but it must not delay the work
            // being decorated. Visual mount errors still reach the runtime.
            const visualMountFailure = visualMount
                .then(() => new Promise<never>(() => { }), error => Promise.reject(error));

            const result = await Promise.race([taskResult, visualMountFailure]);

            if (!environment.signal.aborted) {
                environment.navigation.back(result);
            }
        },

        render(environment) {
            const decorated = screenEnvironment ?? decorateEnvironment(environment);
            const renderEnvironment: RenderEnvironment<Context, any> = {
                ...decorated,
                ui: environment.ui,
            };

            screen.render(renderEnvironment);
        },

        key(event) {
            if (screenEnvironment) {
                screen.key?.(event, screenEnvironment);
            }
        },

        suspend() {
            if (screenEnvironment) {
                screen.suspend?.(screenEnvironment);
            }
        },

        resume() {
            if (screenEnvironment) {
                screen.resume?.(screenEnvironment);
            }
        },

        unmount() {
            if (screenEnvironment) {
                screen.unmount?.(screenEnvironment);
            }
        },
    });
}

function decorateEnvironment<Context>(environment: ScreenEnvironment<Context, unknown>): ScreenEnvironment<Context, any> {
    // The methods below are empty because the task owns this screen's lifetime.
    const navigation: Navigation<Context, any> = {
        ...environment.navigation,
        back() { },
        replace() { },
        reset() { },
        exit() { },
    };

    return {
        ...environment,
        navigation,
    };
}
