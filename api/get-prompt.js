const recentPrompts = [];
const RECENT_LIMIT = 30;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not set' });
  }

  try {
    const avoidClause = recentPrompts.length > 0
      ? `\n\nDo NOT suggest any of these recently used prompts: ${recentPrompts.slice(-20).join(', ')}.`
      : '';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a creative drawing-game host for a Pictionary-style game.
Your job is to pick ONE thing for a player to draw.

Rules:
- Return ONLY the single word or very short phrase (2-3 words max). No punctuation, no explanation, no extra text.
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

    if (!response.ok) {
      console.error('OpenAI error:', JSON.stringify(data));
      return res.status(502).json({ error: 'OpenAI API error', details: data });
    }

    let prompt = (data?.choices?.[0]?.message?.content || '').trim();
    prompt = prompt.replace(/^["'\u201c\u201d\u2018\u2019]|["'\u201c\u201d\u2018\u2019]$/g, '').replace(/[.!?]+$/, '').trim();

    if (!prompt) {
      return res.status(500).json({ error: 'Empty prompt from OpenAI', raw: data });
    }

    recentPrompts.push(prompt.toLowerCase());
    if (recentPrompts.length > RECENT_LIMIT) recentPrompts.shift();

    return res.status(200).json({ prompt });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch prompt' });
  }
};