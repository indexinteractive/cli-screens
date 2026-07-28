# @ind3x/cli-screens

A small, zero-dependency, typescript-first, screen stack library intended to mimick the flow of game screens in interactive CLI applications.

<video controls src="https://github.com/user-attachments/assets/7dbeb7e3-1fba-4b10-94ef-65da7c8e8496" title="Ind3x CLI Screens Demo"></video>

The library is architected around four core concepts:

- **Composition over inheritance:** build flows from factories, `sequence()`, and `withTask()`.
- **Flexibility:** pass typed context and results through navigation, and use `defineScreen()` for custom implementations.
- **Ease of use:** prefer small factory functions with useful defaults and no required inheritance.
- **Opinionated behavior:** screens render complete frames, keyboard hooks stay synchronous, asynchronous work belongs in `mount()` or `withTask()`, and an `AbortSignal` handles cancellation.

### Features

- **Stack based navigation:** push, pop, replace, reset, or exit screens while passing typed results back through promises.
- **Composable flows:** combine built in screens without custom implementations:
  - `confirm()` asks a yes-or-no question and returns a boolean.
  - `select()` presents typed choices and returns the selected value.
  - `menu()` presents choices with an optional Back action and selection callback.
  - `textInput()` collects, validates, and optionally masks text.
  - `message()` displays content until a configured key dismisses it.
  - `paginate()` displays long text in terminal-sized pages.
  - `spinner()` displays an animated status indicator.
  - `typewriter()` animates text and optionally dismisses itself when finished.
  - `sequence()` displays screens in order, including lazily created steps.
  - `withTask()` displays a screen while a typed asynchronous task runs.
- **Asynchronous tasks:** display a screen while background work runs.
- **Shared application context:** make application state available to every screen.
- **Custom screens:** implement your own lifecycle, rendering, and keyboard hooks.
- **Styled terminal output:** align text and apply tones to titles, hints, labels, descriptions, prompts, placeholders, and validation messages.
- **Responsive display:** automatically scroll long choice lists, redraw on size changes.

## Install

```sh
bun install @ind3x/cli-screens
```

## Quick Start

```ts
import { createCli, message, sequence, typewriter } from '@ind3x/cli-screens';

const app = createCli();

const start = sequence([
  typewriter({
    text: 'Loading...',
    charactersPerSecond: 5,
    autoDismiss: true
  }),
  message(`Hello, world!`),
]);

await app.run(start);
```

Other examples and use cases can be found in `docs/recipes/`:

- [Basic menu selection screen](docs/recipes/basic-menu-selection.ts)
- [Using a shared context](docs/recipes/shared-context.ts)
- [Menu screen from async data](docs/recipes/async-menu-data.ts)
- [Using `withTask()` hooks](docs/recipes/with-task.ts)
- [Paginating long text](docs/recipes/paginate.ts)
- [Displaying a spinner during a task](docs/recipes/spinner.ts)
- [Passing input forward to the next screen](docs/recipes/pass-input-forward.ts)
- [Retrieving results from `push()` and `back()`](docs/recipes/push-back-results.ts)

`run()` owns terminal setup and cleanup. Ctrl-C and `navigation.exit()` clear the final frame and restore the terminal before resolving the returned promise.

## Screen Navigation

- `await navigation.push(screen)` opens a child and resolves with the value it passes to `back()`.
- `navigation.back(value?)` closes the current screen. At the root, it exits.
- `navigation.replace(screen)` replaces the current screen. A caller awaiting the original screen receives the replacement screen's eventual result.
- `navigation.reset(screen)` atomically replaces the complete stack.
- `navigation.exit(value?)` exits the app and resolves `run()`.

Pass input forward through screen factory arguments, return results through `push()`/`back()`, and place application-wide services in the typed app context.

## Additional text styling

Display text can be decorated:

```ts
{
    value: 'Centered notice',
    align: 'center',
    tone: 'accent',
}
```

This applies to titles, hints, message text, selection labels and descriptions, text-input prompts and placeholders, validation messages, and typewriter text. Plain strings retain each component's opinionated default presentation.

Alongside the semantic `default`, `accent`, and `muted` tones, the standard ANSI foreground colors are available: `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, and their `brightBlack` through `brightWhite` variants.

### Select

```ts
const port = await navigation.push(
  select<T>({
    title: "Port",
    choices: [
      { label: "Development", value: 3000 },
      { label: "Production", value: 8080 },
    ],
  }),
);
```

`select<T>()` returns the choice value as `T`. Choices may include a `description` or be `disabled`. Long lists automatically scroll to keep the selected choice visible, using the terminal height and indicators for choices above or below the viewport. Set `maxVisible` to impose a smaller item limit.

`menu()` adds a selectable `Back` action after its choices. Set `backLabel` to rename it or `backLabel: false` to hide it, such as on a root menu that already has an explicit exit action. Escape and Backspace also continue to navigate back.

### Confirm

```ts
const approved = await navigation.push(
  confirm({
    message: "Save your changes?",
    confirmLabel: "Save",
    cancelLabel: "Discard",
    initialValue: true,
  }),
);
```

`confirm()` returns `true` or `false`. Escape and Backspace return `false`.

### Text input

```ts
const token = await navigation.push(
  textInput({
    message: "API token",
    mask: true,
    validate: (value) => (value.length < 10 ? "Token is too short" : undefined),
  }),
);
```

Escape cancels and produces `undefined`.

### Message

```ts
await navigation.push(
  message({
    title: "Saved",
    text: "Configuration written.",
    dismissKeys: ["any"],
  }),
);
```

### Paginate

```ts
await navigation.push(
  paginate({
    title: "Release notes",
    text: releaseNotes,
  }),
);
```

`paginate()` wraps text to the terminal width and divides it according to the available terminal height. Use the arrow keys to change pages and Escape or Backspace to return.

### Spinner

```ts
const loading = withTask(
  spinner({ text: "Loading users..." }),
  ({ signal }) => api.loadUsers({ signal }),
);
```

`spinner()` is a visual primitive and does not manage asynchronous work itself. Compose it with `withTask()` so the task owns the screen's lifetime.

### Typewriter

```ts
await navigation.push(
  typewriter({
    title: {
      value: "Introduction",
      align: "center",
      tone: "accent",
    },
    text: {
      value: "Your adventure begins...",
      align: "left",
    },
    charactersPerSecond: 30,
    autoDismiss: true,
  }),
);
```

Animated text is positioned using its completed width, so it does not shift while characters appear.

By default, typing can be completed early with a key press and the screen then prompts for dismissal. Set `autoDismiss: true` to ignore input and close the screen automatically as soon as typing finishes.

### Sequence

Use `sequence()` to display several screens in order without writing a custom controller screen:

```ts
await app.run(
  sequence([typewriter({ text: "Welcome to Ind3x" }), () => gameMenuScreen()]),
);
```

Each screen advances when it navigates back. A function creates its screen only when that step begins. Exiting the app or removing the sequence prevents later factories from running.

### With task

Use `withTask()` to display any screen while a typed asynchronous task runs:

```ts
const loading = withTask<AppContext, User[]>(
  typewriter({ text: "Loading users..." }),
  async ({ context, signal }) => {
    return context.api.loadUsers({ signal });
  },
);

const users = await navigation.push(loading);
```

The task owns the decorated screen's lifetime. The visual screen may push a temporary child, but it cannot pop, replace, reset, or exit the decorated flow. Its asynchronous `mount()` work does not delay the task. Successful completion closes the decorator with the task result. Removing the decorator aborts the signal passed to the task. Task and visual-mount errors use the app's normal `onError` behavior or reject `app.run()`.

## Custom screens

Use `defineScreen()` to get contextual typing without inheritance:

```ts
import { defineScreen, type Screen } from "@ind3x/cli-screens";

type AppContext = {
  api: ApiClient;
};

const loadingScreen: Screen<AppContext> = defineScreen<AppContext>({
  async mount({ context, navigation, signal }) {
    const games = await context.api.games({ signal });
    if (!signal.aborted) navigation.replace(gameList({ games }));
  },

  render({ ui }) {
    ui.text("Loading...", { tone: "muted" });
  },

  key(event, { navigation }) {
    if (event.key === "escape") navigation.back();
  },
});
```

Rendering should be side-effect free. Start requests and timers in `mount()`, store local state in the factory closure, and call `requestRender()` to request a new frame. Each screen receives an `AbortSignal` that is aborted on unmount.

A custom class may implement the structural `Screen<Context, Result>` interface, but no base class is required.

## Development

```sh
bun install
bun run test
```

`bun run test` builds the JavaScript and bundled TypeScript declarations, then runs the unit tests. `bun pm pack --dry-run` shows the files that will be included in a release.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow.
