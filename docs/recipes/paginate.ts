import { createCli, paginate } from '@ind3x/cli-screens';

const script = `
Lock on to him, R2. Master, General Grievous's ship is directly ahead Master, General Grievous's ship is directly ahead the one crawling with vulture droids. I see it. Oh, this is going to be easy. Oddball, do you copy? Copy, Red Leader. Mark my position.

R2, switch on the com link. R2, can you hear me? R2? R2! R2! Stop. Stop. R2, we need to be going up. Hands up, Jedi. R2, do you copy? R2, do you hear me? R2, we need to be going up, not down.

I saw thousands of troops attack the Jedi temple. That's why I went looking for Yoda. Have we had any contact from the temple? Received a coded retreat message we have. It requests all Jedi to return to the temple.

Anakin has turned to the dark side. You're wrong. How could you even say that? I have seen a security hologram, of him, killing younglings. Not Anakin. He couldn't. He was deceived by a lie. We all were.

If into the security recordings you go, only pain will you find. I must know the truth, Master. It can't be. It can't be. You have done well, my new apprentice. Now, Lord Vader, go and bring peace to the Empire.

If so powerful you are, why leave? You will not stop me. Darth Vader will become more powerful than either of us. Faith in your new apprentice misplaced may be. As is your faith in the dark side of the Force.

R2, shut down the elevator. Too late. Jump! Let's see if we can fnd something in the hangar bay that's still flyable. R2, get down here.

Bad idea. I can't see a thing. My cockpit's fogging. They're all over me.

Obi-Wan was right. You've changed. I don't want to hear anymore about Obi-Wan. The Jedi turned against me.

Here. Take this and wait for orders. What's the situation, Captain? Two Jedi have landed in the main hangar bay. We're tracking them.

You will try. I hear a new apprentice you have, Emperor. Or should I call you Darth Sidious? Master Yoda. You survived.

You will die! He's a traitor! He is the traitor! I have the power to save the one you love. You must choose. Don't listen to him, Anakin! Don't let him kill me. I can't hold it any longer. I can't. I'm weak.

No. They are doing their job so we can do ours. Missiles. Pull up.

You stupid little astro droid. Oh, it's you. My eyes! My eyes! What was that all about? R2 has been No loose wire jokes. Did I say anything? He's trying. I didn't say anything. Chancellor. Are you all right? Count Dooku.

To be on the council at your age it's never happened before. The fact of the matter is you are too close to the chancellor. The council doesn't like it when he interferes in Jedi affairs. I swear to you, I didn't ask to be put on the council. But it's what you wanted. Your friendship with Chancellor Palpatine seems to have paid off. That has nothing to do with this.

It says the war is over. Then we must go back. If there are any stragglers, they will fall into the trap and be killed. Suggest dismantling the coded signal, do you? Yes, Master. There is too much at stake.

How many other Jedi have managed to survive? Heard from no one have we. I saw thousands of troops attack the Jedi temple. That's why I went looking for Yoda. Have we had any contact from the temple? Received a coded retreat message we have. It requests all Jedi to return to the temple. It says the war is over.

I should be there with him. It's upsetting to me to see that the council, doesn't seem to fully appreciate your talents. Don't you wonder why they won't make you a Jedi master? I wish I knew. More and more I get the feeling that, I'm being excluded from the council.

I didn't want to put you in this situation. What situation? The council wants you to report on all the chancellor's dealings. They want to know what he's up to. They want me to spy on the chancellor? But that's treason. We are at war, Anakin. Why didn't the council give me this assignment when we were in session? This assignment is not to be on record.

There he is. He's still alive. Get a medical capsule immediately. Yes, sir.

He was deceived by a lie. We all were. It appears that the chancellor is behind everything, including the war. Palpatine is the Sith lord we've been looking for. After the death of Count Dooku, Anakin became his new apprentice. I don't believe you. I can't.

I have to report to the council. Besides, someone needs to be the poster boy. Hold on. This whole operation was your idea. Let us not forget, Anakin, that you rescued me from the buzz droids. And you killed Count Dooku, and you rescued the chancellor, carrying me unconscious on your back.

Get help. You're no match for him. He's a Sith lord. Chancellor Palpatine, Sith lords are our specialty.

The boy you trained, gone he is. Consumed by Darth Vader. I do not know where the emperor has sent him. I don't know where to look. Use your feelings, Obi-Wan, and find him you will. When was the last time you saw him? Yesterday.

But it's what you wanted. Your friendship with Chancellor Palpatine seems to have paid off. That has nothing to do with this. The only reason the council has approved your appointment, is because the chancellor trusts you.

Us? He knows. He wants to help you. Anakin, all I want is your love. Love won't save you, Padmé.

You turned her against me! You have done that yourself. You will not take her from me! Your anger and your lust for power have already done that. You have allowed this dark lord to twist your mind, until now you have become the very thing you swore to destroy. Don't lecture me, Obi-Wan. I see through the lies of the Jedi.

Did I miss something? Hold on. What is that? Oops. R2. R2, shut down the elevator.

Drop your weapons. I said drop 'em. Roger. Roger, roger.

I say patience. Patience? Yes. R2 will be along in a few moments, and then he'll release the ray shields. See? No problem.

If there are any stragglers, they will fall into the trap and be killed. Suggest dismantling the coded signal, do you? Yes, Master. There is too much at stake. I agree. And a little more knowledge might light our way.

And Anakin Skywalker. I was expecting someone with your reputation to be a little, older. General Grievous. You're shorter than I expected. Jedi scum. We have a job to do, Anakin. Try not to upset him.

Come closer. I have good news. Our clone intelligence units, have discovered the location of General Grievous. He's hiding in the Utapau system.

Now there I agree with you. In fact, I could do with a tune-up myself. But the fighting will continue until General Grievous is spare parts. I will do everything I can in the senate. Excuse me.

I have waited a long time for this moment, my little green friend. At last the Jedi are no more. Not if anything to say about it I have. At an end your rule is. And not short enough it was.
`.trim();

const app = createCli();

await app.run(paginate({
    title: 'Script Notes',
    text: script,
}));
