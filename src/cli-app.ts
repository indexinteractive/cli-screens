import { ScreenStackApp } from './core/screen-stack-app';
import { CliOptions } from './type/cli-options';

export function createCli<Context = void, ExitResult = unknown>(options?: CliOptions<Context>): ScreenStackApp<Context, ExitResult> {
    const resolvedOptions = options ?? { context: undefined as Context };
    return new ScreenStackApp(resolvedOptions);
}
