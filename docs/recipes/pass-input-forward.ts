import { createCli, defineScreen, menu, type Screen, type TextColor } from '@ind3x/cli-screens';

type Person = {
    first: string;
    last: string;
    role: string;
    color: TextColor;
};

const people: readonly Person[] = [
    { first: 'Edward', last: 'Elric', role: 'State Alchemist', color: 'red' },
    { first: 'Alphonse', last: 'Elric', role: 'Alchemist', color: 'cyan' },
    { first: 'Winry', last: 'Rockbell', role: 'Automail mechanic', color: 'yellow' },
    { first: 'Roy', last: 'Mustang', role: 'State Alchemist', color: 'blue' },
];

function personDetails(person: Person): Screen<void> {
    return defineScreen({
        render({ ui }) {
            ui.text(`${person.first} ${person.last}`, { tone: 'accent' });
            ui.blank();
            ui.text(`Name: ${person.first} ${person.last}`);
            ui.text(`Role: ${person.role}`, { tone: person.color });
            ui.blank();
            ui.text('Press any key to go back ↵', { tone: 'muted' });
        },
        key(_event, { navigation }) {
            navigation.back();
        },
    });
}

const peopleDirectory = menu<Person, void>({
    title: 'People',
    backLabel: false,
    choices: people.map(person => ({
        label: `${person.first} ${person.last}`,
        description: person.role,
        value: person,
    })),
    onSelect(person, { navigation }) {
        const nextScreen = personDetails(person);
        void navigation.push(nextScreen);
    },
});

const app = createCli();
await app.run(peopleDirectory);
