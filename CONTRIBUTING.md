# Contributing

You've found your way to our cli screen library! Welcome :)

## Development

We use [Bun](https://bun.sh/docs) here, but everything will probably work with Node/npm just fine.

```sh
bun install
bun run test
```

The public API is intentionally small. This is intended to be a small but robust library.

We ask that you:

- Keep changes focused and don't blow over on scope
- Include tests where it makes sense
- Choose composing existing primitives over adding new abstractions

Before opening a pull request, run:

```sh
bun run test
bun pm pack --dry-run
```

Reminder: Do not commit generated `dist` files or `node_modules`.

Have fun!
