import fetch from 'node-fetch';

const recentPrompts = [];
const RECENT_LIMIT = 30;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const avoidClause = recentPrompts.length > 0
      ? `\n\nDo NOT suggest any of these recently used prompts: ${recentPrompts.slice(-20).join(', ')}.`
      : '';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a creative drawing-game host for a Pictionary-style game.
Your job is to pick ONE thing for a player to draw.

Rules:
- Return ONLY the single word or very short phrase (2–3 words max). No punctuation, no explanation, no extra text.
- Choose from a WIDE variety of categories: animals, food, vehicles, buildings, nature, sports, emotions, mythical creatures, household objects, occupations, weather, space, music instruments, fantasy, technology, clothing, plants, geography landmarks, and more.
- Vary the difficulty: some easy (cat, sun, chair), some medium (lighthouse, accordion, igloo), some creative/unusual (time machine, ghost chef, flying whale).
- Never repeat a boring or overused word unless it has been a very long time.
- Make each prompt feel fresh, surprising, and fun.${avoidClause}`
          },
          {
            role: 'user',
            content: 'Give me one drawing prompt now.'
          }
        ],
        max_tokens: 20,
        temperature: 1.1,
        presence_penalty: 0.8,
        frequency_penalty: 0.5
      })
    });

    const data = await response.json();
    let prompt = (data?.choices?.[0]?.message?.content || '').trim();
    prompt = prompt.replace(/^["'""'']|["'""'']$/g, '').replace(/[.!?]+$/, '').trim();

    if (!prompt) {
      return res.status(500).json({ error: 'Invalid response from OpenAI', raw: data });
    }

    recentPrompts.push(prompt.toLowerCase());
    if (recentPrompts.length > RECENT_LIMIT) recentPrompts.shift();

    res.json({ prompt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch prompt' });
  }
}