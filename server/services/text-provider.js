// Server-side text provider for multiplayer rooms
// Hardcoded passages — lowercase, no punctuation, suitable for typing battles

const multiplayerTexts = [
  {
    id: 'mp-1',
    text: 'the quick brown fox jumps over the lazy dog and runs across the meadow where the sun sets behind the distant hills painting the sky in shades of orange and gold',
    charCount: 160
  },
  {
    id: 'mp-2',
    text: 'every morning the birds sing their songs as the world wakes up and the light pours through the windows filling each room with warmth and the promise of a new day',
    charCount: 161
  },
  {
    id: 'mp-3',
    text: 'the ocean waves crash against the rocky shore sending sprays of salt water into the cool morning air while seagulls circle overhead looking for their next meal',
    charCount: 158
  },
  {
    id: 'mp-4',
    text: 'in the heart of the forest tall trees stretch toward the sky their branches forming a canopy that filters the sunlight into patterns on the mossy ground below',
    charCount: 159
  },
  {
    id: 'mp-5',
    text: 'she opened the old wooden door and stepped into a room filled with dusty books and forgotten memories the air was thick with the scent of aged paper and dried flowers',
    charCount: 165
  },
  {
    id: 'mp-6',
    text: 'the city never sleeps its streets alive with the hum of traffic and the glow of neon signs that reflect off wet pavement after a brief evening rain',
    charCount: 149
  },
  {
    id: 'mp-7',
    text: 'a gentle breeze carried the scent of fresh pine through the open window as the afternoon sun cast long shadows across the wooden floor of the small cabin',
    charCount: 153
  },
  {
    id: 'mp-8',
    text: 'typing is not just about speed it is about finding a rhythm between your thoughts and your fingers where each keystroke flows naturally into the next creating a seamless stream of words on the screen',
    charCount: 197
  },
  {
    id: 'mp-9',
    text: 'the train rattled along the tracks cutting through fields of golden wheat that swayed in the wind like waves on a vast and endless sea stretching to the horizon',
    charCount: 160
  },
  {
    id: 'mp-10',
    text: 'learning something new every day keeps the mind sharp and the spirit curious for it is through constant growth that we find meaning and purpose in our lives',
    charCount: 156
  },
  {
    id: 'mp-11',
    text: 'the old clock on the wall ticked steadily marking each second with a soft click that echoed through the silent house as the family slept peacefully upstairs',
    charCount: 157
  },
  {
    id: 'mp-12',
    text: 'under the starlit sky the campfire crackled and popped sending tiny sparks floating upward like fireflies dancing in the darkness of the cool summer night',
    charCount: 155
  },
  {
    id: 'mp-13',
    text: 'the best way to predict the future is to create it one small step at a time building habits that compound over weeks and months until you become the person you always wanted to be',
    charCount: 181
  },
  {
    id: 'mp-14',
    text: 'rain fell softly on the garden soaking into the dark earth where seeds lay waiting for the right moment to push through the soil and reach toward the light above',
    charCount: 161
  },
  {
    id: 'mp-15',
    text: 'the keyboard clicked rapidly as lines of code filled the screen each function carefully crafted to solve a small piece of a much larger and more complex puzzle',
    charCount: 160
  },
  {
    id: 'mp-16',
    text: 'mountains rose sharply from the valley floor their snow capped peaks hidden behind thick clouds that rolled in from the west bringing the promise of an early winter storm',
    charCount: 170
  },
  {
    id: 'mp-17',
    text: 'she picked up the old photograph and smiled remembering the summer days spent by the lake where the water was so clear you could see the smooth stones at the bottom',
    charCount: 164
  },
  {
    id: 'mp-18',
    text: 'practice does not make perfect but it does make progress and every small improvement adds up over time until what once seemed impossible becomes second nature',
    charCount: 158
  },
  {
    id: 'mp-19',
    text: 'the market square was busy with vendors selling fresh fruit and vegetables their colorful stalls arranged in neat rows that lined the cobblestone streets of the old town',
    charCount: 168
  },
  {
    id: 'mp-20',
    text: 'a good book can transport you to another world where the boundaries of reality fade and your imagination takes over painting vivid scenes that feel as real as life itself',
    charCount: 170
  },
  {
    id: 'mp-21',
    text: 'the river wound its way through the valley carving a path between the hills that had stood for millions of years watching the seasons change in an endless cycle of growth and rest',
    charCount: 180
  },
  {
    id: 'mp-22',
    text: 'focus is the bridge between where you are and where you want to be without it your efforts scatter like leaves in the wind never quite reaching their destination',
    charCount: 161
  },
  {
    id: 'mp-23',
    text: 'the aroma of freshly baked bread drifted through the kitchen filling the house with warmth as the baker carefully shaped each loaf before placing it into the hot oven',
    charCount: 167
  },
  {
    id: 'mp-24',
    text: 'technology changes the way we live and work but the core of human connection remains the same built on trust empathy and the simple act of listening to one another',
    charCount: 163
  },
  {
    id: 'mp-25',
    text: 'the sunset painted the horizon in brilliant shades of red and purple as the day came to a quiet end and the first stars began to appear in the darkening sky above the sleeping town',
    charCount: 181
  }
];

/**
 * Get enough text to fill the full game duration.
 * Concatenates multiple random passages so players never run out.
 * Assumes ~40 WPM avg = ~200 chars/30s. We provide 3x buffer.
 * @param {number} duration - Game duration in seconds
 * @returns {{ id: string, text: string, charCount: number }}
 */
export function getTextForRoom(duration = 30) {
  // Target chars: assume up to 150 WPM max (~5 chars/word) = 750 chars/min
  // 2x buffer so even the fastest typists never run out
  const targetChars = Math.ceil((duration / 60) * 750 * 2);

  const usedIndices = new Set();
  const parts = [];
  let totalChars = 0;

  while (totalChars < targetChars) {
    // Pick a random passage (avoid immediate repeats if possible)
    let idx;
    let attempts = 0;
    do {
      idx = Math.floor(Math.random() * multiplayerTexts.length);
      attempts++;
    } while (usedIndices.has(idx) && attempts < 10 && usedIndices.size < multiplayerTexts.length);

    usedIndices.add(idx);
    const passage = multiplayerTexts[idx];
    parts.push(passage.text);
    totalChars += passage.charCount;

    // Reset used set if we've gone through all passages (allow reuse)
    if (usedIndices.size >= multiplayerTexts.length) usedIndices.clear();
  }

  const combinedText = parts.join(' ');
  return {
    id: `mp-combined-${duration}`,
    text: combinedText,
    charCount: combinedText.length
  };
}
