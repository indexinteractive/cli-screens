import { createCli, message, withTask } from '@ind3x/cli-screens';

type AppContext = {
    saveApi(signal: AbortSignal): Promise<string>;
};

const app = createCli<AppContext>({
    context: {
        async saveApi(signal) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            signal.throwIfAborted();
            return 'Finished.';
        },
    },
});

const saving = withTask<AppContext, string>(
    message({
        title: 'Saving',
        text: 'Writing asynchronous data...',
    }),
    async ({ context, signal }) => {
        return context.saveApi(signal);
    },
);

const receipt = await app.run(saving);
console.log(receipt);
