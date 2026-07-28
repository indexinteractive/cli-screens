import { createCli, spinner, withTask } from '@ind3x/cli-screens';

type AppContext = {
    loadDataApi(signal: AbortSignal): Promise<string>;
};

const app = createCli<AppContext>({
    context: {
        async loadDataApi(signal) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            signal.throwIfAborted();
            return 'Data loaded.';
        },
    },
});

const loading = withTask<AppContext, string>(
    spinner({
        title: 'Loading',
        text: 'Fetching data...',
    }),
    ({ context, signal }) => context.loadDataApi(signal),
);

const result = await app.run(loading);
console.log(result);
