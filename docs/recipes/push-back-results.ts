import { confirm, createCli, defineScreen } from '@ind3x/cli-screens';

const root = defineScreen<void, boolean>({
    async mount({ navigation, signal }) {
        const confirmScreen = confirm({
            message: 'Save your changes?',
            confirmLabel: 'Save',
            cancelLabel: 'Discard',
        });
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
