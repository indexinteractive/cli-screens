import { defineScreen, type RenderEnvironment, type Screen, type ScreenEnvironment } from './screen';
import type { TextContent } from '../renderer/text-content';
import { select, type Choice, type SelectOptions } from './select';

/** Uses a private Symbol so no consumer-provided choice value will be the same as this back action. */
const backAction = Symbol('back');

export interface MenuOptions<Value, Context = any> extends Omit<SelectOptions<Value>, 'choices'> {
    choices: readonly Choice<Value>[];
    /** Label for the selectable back action. Set to false to hide it. */
    backLabel?: TextContent | false;
    onSelect(value: Value, environment: ScreenEnvironment<Context, void>): void;
}

export function menu<Value, Context = any>(options: MenuOptions<Value, Context>): Screen<Context, void> {
    const choices: readonly Choice<Value | typeof backAction>[] = options.backLabel === false
        ? options.choices
        : [
            ...options.choices,
            { label: options.backLabel ?? 'Back', value: backAction },
        ];

    const selection = select<Value | typeof backAction, Context>({
        ...options,
        choices,
    });

    return defineScreen<Context, void>({
        render(environment) {
            selection.render(environment as unknown as RenderEnvironment<Context, Value | typeof backAction>);
        },
        key(event, environment) {
            let selected: Value | typeof backAction | undefined;
            const proxy = {
                ...environment,
                navigation: {
                    ...environment.navigation,
                    back(value?: Value | typeof backAction) {
                        if (value !== undefined) {
                            selected = value;
                        } else {
                            environment.navigation.back();
                        }
                    },
                },
            };

            selection.key?.(
                event,
                proxy as unknown as ScreenEnvironment<Context, Value | typeof backAction>,
            );

            if (selected === backAction) {
                environment.navigation.back();
            } else if (selected !== undefined) {
                options.onSelect(selected, environment);
            }
        },
    });
}

export type { Choice };
