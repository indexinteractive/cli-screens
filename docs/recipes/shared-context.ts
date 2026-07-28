import { createCli, defineScreen, sequence, typewriter } from '@ind3x/cli-screens';

type AppContext = {
    applicationName: string;
    version: string;
};

const app = createCli<AppContext>({
    context: {
        applicationName: 'Quest',
        version: '1.0.0',
    },
});

const about = defineScreen<AppContext>({
    render({ context, ui }) {
        ui.text(context.applicationName, { tone: 'accent' });
        ui.text(`Version ${context.version}`);
        ui.blank();
        ui.text('Press Enter to exit.', { tone: 'muted' });
    },
    key(_event, { navigation }) {
        navigation.back();
    },
});

await app.run(sequence([
    about,
    typewriter({
        text: 'good bye 👋                 ',
        autoDismiss: true,
    })
]));
