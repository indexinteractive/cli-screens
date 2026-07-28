import { Ui } from '../renderer/ui';
import type { Navigation, RenderEnvironment, Screen, ScreenEnvironment } from '../screen/screen';
import type { CliOptions } from '../type/cli-options';
import { KeyEvent } from '../type/terminal-input';
import { TerminalSession } from './terminal-session';

interface Frame<Context> {
    screen: Screen<Context, any>;
    controller: AbortController;
    environment: ScreenEnvironment<Context, any>;
    resolve?: (result: any) => void;
}

interface RunCompletion {
    /** Finishes run() successfully when the app exits. */
    resolve: (result: unknown) => void;
    /** Finishes run() with an error when the app fails. */
    reject: (error: unknown) => void;
}

type RunOutcome = { result: unknown } | { error: unknown };

export class ScreenStackApp<Context, ExitResult> {
    private readonly options: CliOptions<Context>;

    /** Screen stack ordered from the root to the current screen. */
    private readonly frameStack: Frame<Context>[] = [];
    private readonly terminal: TerminalSession;

    private runCompletion?: RunCompletion;
    private isRendering = false;
    private hasRenderRequest = false;

    /** Delays rendering until the current group of screen updates is finished. */
    private renderBatchDepth = 0;

    constructor(userOptions: CliOptions<Context>) {
        this.options = userOptions;
        this.terminal = new TerminalSession(userOptions.input, userOptions.output);
    }

    get isRunning(): boolean {
        return this.runCompletion !== undefined;
    }

    async run<Result = ExitResult>(root: Screen<Context, Result>): Promise<Result | undefined> {
        if (this.runCompletion) {
            throw new Error('This CLI app is already running.');
        }

        const completion = new Promise<Result | undefined>((resolve, reject) => {
            this.runCompletion = {
                resolve: resolve as (result: unknown) => void,
                reject,
            };
        });

        try {
            this.terminal.start({
                key: this.handleKey,
                resize: this.handleResize,
                sigint: this.handleSigint,
            });
            this.batchRender(() => this.mount(root));
        } catch (error) {
            this.stop({ error });
        }

        return completion;
    }

    dispose(): void {
        this.stop({ result: undefined });
    }

    private currentFrame(): Frame<Context> | undefined {
        return this.frameStack.at(-1);
    }

    private createFrame(screen: Screen, resolve?: (result: any) => void): Frame<Context> {
        const controller = new AbortController();
        let frame: Frame<Context>;

        const navigation: Navigation<Context, any> = {
            push: screen => this.pushFrame(frame, screen),
            back: result => this.back(frame, result),
            replace: screen => this.replace(frame, screen),
            reset: screen => this.reset(frame, screen),
            exit: result => this.exit(frame, result),
        };

        frame = {
            screen,
            controller,
            environment: {
                context: this.options.context,
                navigation,
                signal: controller.signal,
                requestRender: () => this.requestRender(frame),
            },
            resolve,
        };
        return frame;
    }

    /** Adds a screen to the stack and starts its lifecycle. */
    private mount(screen: Screen<Context, any>, resolve?: (result: any) => void): Frame<Context> {
        const frame = this.createFrame(screen, resolve);
        this.frameStack.push(frame);
        this.runLifecycleHook(frame, frame.screen.mount);
        return frame;
    }

    private requestRender(frame: Frame<Context>): void {
        if (!frame.controller.signal.aborted && frame === this.currentFrame()) {
            this.render();
        }
    }

    private pushFrame<Result>(expected: Frame<Context>, screen: Screen<Context, Result>): Promise<Result | undefined> {
        const parent = this.currentFrame();

        if (!this.isRunning || !parent || expected !== parent) {
            return Promise.resolve(undefined);
        }

        return this.batchRender(() => {
            this.runLifecycleHook(parent, parent.screen.suspend);
            return new Promise<Result | undefined>(resolve => {
                this.mount(screen, resolve);
            });
        });
    }

    private back<Result>(expected: Frame<Context>, result?: Result): void {
        if (!this.runCompletion || expected !== this.currentFrame()) {
            return;
        }

        if (this.frameStack.length === 1) {
            this.stop({ result });
            return;
        }

        this.batchRender(() => {
            const closed = this.frameStack.pop()!;
            this.unmount(closed);
            closed.resolve?.(result);
            const parent = this.currentFrame();
            if (parent) {
                this.runLifecycleHook(parent, parent.screen.resume);
            }
        });
    }

    private replace<Result>(expected: Frame<Context>, screen: Screen<Context, Result>): void {
        const current = this.currentFrame();
        if (!this.runCompletion || expected !== current) {
            return;
        }

        this.batchRender(() => {
            const closed = this.frameStack.pop()!;
            this.unmount(closed);
            this.mount(screen, closed.resolve);
        });
    }

    private reset(expected: Frame<Context>, screen: Screen<Context, any>): void {
        const current = this.currentFrame();
        if (!this.runCompletion || expected !== current) {
            return;
        }

        this.batchRender(() => {
            const oldFrames = this.frameStack.splice(0);

            for (const frame of oldFrames.reverse()) {
                this.unmount(frame);
                frame.resolve?.(undefined);
            }

            this.mount(screen);
        });
    }

    private exit(expected: Frame<Context>, result: unknown): void {
        const current = this.currentFrame();
        if (!this.runCompletion || expected !== current) {
            return;
        }

        this.stop({ result });
    }

    private render(): void {
        const frame = this.currentFrame();
        if (!this.runCompletion || !frame) {
            return;
        }

        if (this.isRendering || this.renderBatchDepth > 0) {
            this.hasRenderRequest = true;
            return;
        }

        this.isRendering = true;

        try {
            const ui = new Ui(this.terminal.width, this.terminal.height);
            const environment: RenderEnvironment<Context, any> = {
                ...frame.environment,
                ui,
            };

            frame.screen.render(environment);

            this.terminal.writeFrame(Ui.renderFrame(ui));
        } catch (error) {
            this.reportError(error);
        } finally {
            this.isRendering = false;
            if (this.hasRenderRequest) {
                this.hasRenderRequest = false;
                queueMicrotask(() => this.render());
            }
        }
    }

    /** Groups screen updates and renders once after they finish. */
    private batchRender<Value>(callback: () => Value): Value {
        this.renderBatchDepth += 1;
        try {
            return callback();
        } finally {
            this.renderBatchDepth -= 1;
            if (this.renderBatchDepth === 0 && this.runCompletion) {
                this.hasRenderRequest = false;
                this.render();
            }
        }
    }

    private handleKey = (event: KeyEvent): void => {
        if (!this.runCompletion) return;
        if (event.key === 'text' && event.ctrl && event.text === 'c') {
            this.stop({ result: undefined });
            return;
        }

        const frame = this.currentFrame();
        if (!frame?.screen.key) return;
        try {
            frame.screen.key(event, frame.environment);
        } catch (error) {
            this.reportError(error);
        }
    };

    private handleSigint = (): void => {
        this.stop({ result: undefined });
    };

    private handleResize = (): void => {
        this.render();
    };

    /** Just a wrapper around mount() suspend() resume() to make error calling easier */
    private runLifecycleHook(frame: Frame<Context>, hook: ((environment: ScreenEnvironment<Context, any>) => void | Promise<void>) | undefined): void {
        if (!hook) {
            return;
        }

        try {
            const pending = hook.call(frame.screen, frame.environment);
            if (pending) {
                Promise.resolve(pending).catch(error => this.reportError(error));
            }
        } catch (error) {
            this.reportError(error);
        }
    }

    private unmount(frame: Frame<Context>, duringCleanup = false): unknown | undefined {
        if (frame.controller.signal.aborted) {
            return;
        }

        frame.controller.abort();

        try {
            frame.screen.unmount?.call(frame.screen, frame.environment);
        } catch (error) {
            if (!duringCleanup) {
                this.reportError(error);
                return;
            }
            return this.reportCleanupError(error);
        }
    }

    private reportError(error: unknown): void {
        if (this.options.onError) {
            try {
                this.options.onError(error);
            } catch (handlerError) {
                this.stop({ error: handlerError });
            }
            return;
        }
        this.stop({ error });
    }

    private reportCleanupError(error: unknown): unknown | undefined {
        if (!this.options.onError) return error;
        try {
            this.options.onError(error);
        } catch (handlerError) {
            return handlerError;
        }
    }

    private stop(outcome: RunOutcome): void {
        const activeRun = this.runCompletion;
        if (!activeRun) {
            return;
        }

        this.runCompletion = undefined;

        const cleanupError = this.cleanupFrames();
        let terminalError: unknown | undefined;
        try {
            this.terminal.stop();
        } catch (error) {
            terminalError = error;
        }

        if ('error' in outcome) {
            activeRun.reject(outcome.error);
        }
        else if (cleanupError !== undefined) {
            activeRun.reject(cleanupError);
        }
        else if (terminalError !== undefined) {
            activeRun.reject(terminalError);
        }
        else {
            activeRun.resolve(outcome.result);
        }
    }

    private cleanupFrames(): unknown | undefined {
        let firstError: unknown | undefined;
        const oldFrames = this.frameStack.splice(0);

        for (const frame of oldFrames.reverse()) {
            const error = this.unmount(frame, true);
            firstError ??= error;
            frame.resolve?.(undefined);
        }

        return firstError;
    }
}
