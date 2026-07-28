import { createCli, menu, message } from '@ind3x/cli-screens';

const app = createCli();

const mainMenu = menu({
    title: 'Main menu',
    backLabel: false,
    choices: [
        { label: 'Say hello', value: 'greet' },
        { label: 'Quit', value: 'quit' },
    ] as const, // defining the type as const allows onSelect() to infer the possible choices
    onSelect(action, { navigation }) {
        if (action === 'quit') {
            navigation.exit();
            return;
        }

        const messageScreen = message('Hello!');
        void navigation.push(messageScreen);
    },
});

await app.run(mainMenu);
