import { createCli, defineScreen, type Screen } from '@ind3x/cli-screens';

// the 2nd type argument is for the expected return type
function confirmation(): Screen<void, boolean> {
    return defineScreen({
        render({ ui }) {
            ui.text('Save your changes?');
            ui.text('Enter to confirm (true), Esc to cancel (false)', { tone: 'muted' });
        },
        key(event, { navigation }) {
            if (event.key === 'enter') {
                navigation.back(true);
            }
            if (event.key === 'escape') {
                navigation.back(false);
            }
        },
    });
}

const root = defineScreen<void, boolean>({
    async mount({ navigation, signal }) {
        const confirmScreen = confirmation();
        const confirmed = await navigation.push(confirmScreen);

        if (!signal.aborted) {
            navigation.back(confirmed ?? false);
        }
    },
    render() {
        // The confirmation screen pushed during mount owns the visible frame.
    },
});

const app = createCli<void, boolean>();
const confirmed = await app.run(root);

console.log('confirmation result:', confirmed);
