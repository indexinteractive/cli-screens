import { createCli, defineScreen, menu, message, type Screen } from '@ind3x/cli-screens';

const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';

type Post = {
    userId: number;
    id: number;
    title: string;
    body: string;
};

type AppContext = {
    postsApi: {
        getPosts(signal: AbortSignal): Promise<Post[]>;
    };
};

function postMenu(posts: Post[]): Screen<AppContext> {
    return menu<Post, AppContext>({
        title: 'Choose a post',
        backLabel: false,
        choices: posts.map(post => ({
            label: post.title,
            description: `Post ${post.id} by user ${post.userId}`,
            value: post,
        })),
        onSelect(post, { navigation }) {
            const postScreen = message({
                title: post.title,
                text: post.body,
                hint: 'Return ↵',
            });

            void navigation.push(postScreen);
        },
    });
}

const start = defineScreen<AppContext>({
    async mount({ context, navigation, signal }) {
        const posts = await context.postsApi.getPosts(signal);

        if (!signal.aborted) {
            const menuScreen = postMenu(posts);
            navigation.replace(menuScreen);
        }
    },
    render({ ui }) {
        ui.text('Loading posts...');
    },
});

const app = createCli<AppContext>({
    context: {
        postsApi: {
            async getPosts(signal) {
                const response = await fetch(POSTS_URL, { signal });

                if (!response.ok) {
                    throw new Error(`Could not load posts: ${response.status}`);
                }

                const posts = await response.json() as Post[];
                return posts;
            },
        },
    },
});

await app.run(start);
