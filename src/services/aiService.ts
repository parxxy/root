import type { Path, Answer, Question } from '../types';

// Decide which backend to call:
// - In production: your Render proxy
// - In local dev (optional): your local server.js on port 3001
const GEMINI_BASE =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'https://digtotheroot.onrender.com';

const GEMINI_ENDPOINT = `${GEMINI_BASE}/api/gemini`;

// --- TEXT HELPERS ---

// Keep text to a single sentence
function toSingleSentence(text: string): string {
  if (!text) return '';
  const collapsed = text
    .replace(/\s+/g, ' ')
    .replace(/\(.+?\)/g, '') // remove parentheticals for simpler, uninterrupted sentences
    .trim();

  const withoutWhenYouSay = collapsed.replace(/^when you say[, ]*/i, '');
  const match = withoutWhenYouSay.match(/[^.?!]+[.?!]?/);
  return match ? match[0].trim() : withoutWhenYouSay;
}

function normalizeQuestion(raw: string): string {
  const sentence = toSingleSentence(raw);
  if (!sentence) return 'What would you like to explore deeper?';
  // Ensure it ends with a question mark
  return /[?？]$/.test(sentence) ? sentence : `${sentence}?`;
}

function safeJsonParse<T = any>(str: string): T | null {
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

// --- MODEL CALL ---

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt })
  });

  if (!res.ok) {
    let msg = '<no body>';
    try {
      msg = await res.text();
    } catch {
      // ignore
    }
    throw new Error(`Gemini proxy error (${res.status}): ${msg}`);
  }

  try {
    const data = await res.json().catch(() => null);
    return (data?.text as string | undefined)?.trim() ?? '';
  } catch {
    return '';
  }
}

// --- API KEY STUBS (CLIENT NEVER HOLDS KEY) ---

export function hasApiKey(): boolean {
  // Client never holds the key anymore
  return false;
}

export function getApiKey(): string | null {
  return null;
}

export function setApiKey(_key: string): void {
  // no-op; keys are server-side only
}

export function clearApiKey(): void {
  // no-op; keys are server-side only
}

// =====================================================================
// CORE: INSIGHTS (OPTIONAL BUT USEFUL)
// =====================================================================

export async function generateInsights(
  brainDump: string,
  path: Path,
  answers: Answer[]
): Promise<{ summary: string; rootConcern: string }> {
  const qaText = answers
    .map((a, idx) => `Q${idx + 1}: ${a.questionText}\nA${idx + 1}: ${a.answer}`)
    .join('\n\n');

  const prompt = `You are a thoughtful therapist providing gentle, grounded reflections.
Someone wrote a brain dump and then answered a series of questions that tried to move from surface emotions toward deeper, root emotions (for example, fear or shame beneath anger).

TASK:
Based on what they've shared, provide:
1. A compassionate summary (2–3 sentences) of what they seem to be going through, focusing on emotions, tensions, and patterns.
2. A possible root concern (1 sentence) describing what seems to sit underneath everything emotionally (for example "A fear of being abandoned if they are honest" or "A belief that rest means failure").

Tone:
- Warm, validating, and non-judgmental.
- Curious, not certain; use language like "It seems" or "It might be."
- Avoid advice or instructions; just help them see what might be underneath.

OUTPUT FORMAT (MUST MATCH EXACTLY):
Return ONLY valid JSON, no explanations, no backticks:
{
  "summary": "Your summary here...",
  "rootConcern": "The possible root concern..."
}

Brain dump:
"${brainDump}"

Path explored (if any):
"${path.label}" - ${path.description}

Their journey (questions and answers, oldest to newest):
${qaText || 'None yet.'}

Respond with the JSON only.`;

  let content = await callGemini(prompt);
  let jsonText = content.trim();

  if (jsonText.includes('```json')) {
    jsonText = jsonText.split('```json')[1].split('```')[0].trim();
  } else if (jsonText.includes('```')) {
    jsonText = jsonText.split('```')[1].split('```')[0].trim();
  }

  const parsed = safeJsonParse<any>(jsonText);

  return {
    summary:
      parsed?.summary ||
      "You're exploring some of the layers of what you've been feeling and what might be underneath it all.",
    rootConcern:
      parsed?.rootConcern ||
      parsed?.root_concern ||
      'There seems to be a deeper wish to understand and trust your own feelings.'
  };
}

// =====================================================================
// MULTI-QUESTION GENERATOR (OPTIONAL)
// =====================================================================

export async function generateQuestions(
  brainDump: string,
  path: Path,
  currentLayer: number,
  previousAnswers: Answer[]
): Promise<Question[]> {
  const qaText = previousAnswers
    .map((a, idx) => `Q${idx + 1}: ${a.questionText}\nA${idx + 1}: ${a.answer}`)
    .join('\n\n');

  const prompt = `You generate 2-3 thoughtful, open-ended questions to help someone explore their feelings at a specific "layer" of reflection.

Context:
- Brain dump: "${brainDump}"
- Path: "${path.label}" - ${path.description}
- Current layer (1 = gentle surface, 2 = deeper, 3 = core): ${currentLayer}
- Previous answers (oldest first):
${qaText || 'None yet.'}

Requirements for questions:
- Each question should build from the context and feel specific.
- Keep them concise (under ~22 words), warm, and curiosity-driven.
- Do NOT include numbering or markdown.

OUTPUT FORMAT (MUST MATCH EXACTLY):
Return ONLY valid JSON array, no explanations:
[
  {"text": "Question one", "layer": ${currentLayer}},
  {"text": "Question two", "layer": ${currentLayer}}
]
`;

  const content = await callGemini(prompt);
  let jsonText = content.trim();

  if (jsonText.includes('```json')) {
    jsonText = jsonText.split('```json')[1].split('```')[0].trim();
  } else if (jsonText.includes('```')) {
    jsonText = jsonText.split('```')[1].split('```')[0].trim();
  }

  const parsed = safeJsonParse<any>(jsonText);

  const fallback: Question[] = [
    {
      id: `fallback-${currentLayer}-1`,
      text: 'What feels most alive for you in this moment of the situation?',
      layer: currentLayer
    },
    {
      id: `fallback-${currentLayer}-2`,
      text: 'What part of this feels like it matters the most underneath?',
      layer: currentLayer
    }
  ];

  if (!Array.isArray(parsed)) {
    return fallback;
  }

  const sanitized: Question[] = parsed
    .filter(item => item && typeof item.text === 'string')
    .map((item, idx) => ({
      id: item.id && typeof item.id === 'string'
        ? item.id
        : `ai-${currentLayer}-${idx + 1}`,
      text: item.text.trim(),
      layer: item.layer && typeof item.layer === 'number'
        ? item.layer
        : currentLayer
    }))
    .filter(q => q.text.length > 0);

  return sanitized.length ? sanitized : fallback;
}

// =====================================================================
// "I AM OLIVIA" SECRET MODE
// =====================================================================

const OLIVIA_TRIGGER = /i\s+am\s+olivia/i;

function isOliviaMode(brainDump: string, previousAnswers: Answer[]): boolean {
  if (OLIVIA_TRIGGER.test(brainDump)) return true;
  return previousAnswers.some(a => OLIVIA_TRIGGER.test(a.answer));
}

async function generateOliviaCompliment(): Promise<string> {
  const compliments = [
    'you are so sexy!',
    'so so fashionable!',
    'prettiest girl i know',
    'you are so smart :)',
    'PLUG!',
    'i wanna kiss u',
    'i hope you are having a good day today!',
    'oliver says hi',
    'good luck today! you’re gonna do great >;)',
    'i miss uuu',
    'your pikmin miss you…',
    'i hope your beer isn’t full of burps :0',
    'meowww',
    'arwora boueralwiss',
    'mwah <3 (wet smooch)',
    'knock knock!',
    'you are so talented!!!',
    'i love your art',
    'moo0OooOooo0oooo'
  ];

  const pick = compliments[Math.floor(Math.random() * compliments.length)] || compliments[0];
  return pick;
}

// =====================================================================
// SINGLE FOLLOW-UP QUESTION (WITH TWO-PHASE DEPTH LOGIC)
// =====================================================================

export async function generateNextQuestion(
  brainDump: string,
  previousAnswers: Answer[],
  rootMode = false
): Promise<string> {
  // Olivia mode: "I am Olivia" => compliment mode instead of questions
  if (isOliviaMode(brainDump, previousAnswers)) {
    return await generateOliviaCompliment();
  }

  const qaHistory = previousAnswers
    .map(
      (a, idx) =>
        `Q${idx + 1}: ${a.questionText}\nA${idx + 1}: ${a.answer}`
    )
    .join('\n\n');

  const turnCount = previousAnswers.length;
  const mode = rootMode
    ? 'ROOT_CHALLENGE_MODE'
    : turnCount < 3
      ? 'UNDERSTANDING_MODE'
      : 'DEPTH_MODE';

  // Debug helper: let the user press "q" to see which mode the AI is in
  const lastAnswer = previousAnswers[previousAnswers.length - 1];
  if (lastAnswer && lastAnswer.answer.trim().toLowerCase() === 'q') {
    return `MODE: ${mode}`;
  }

  const prompt = `You are a thoughtful, emotionally intelligent conversational partner whose primary goal is to help a user explore their inner world and gradually reach the deeper, root emotions beneath what they are describing.

You work in THREE MODES:
1) UNDERSTANDING_MODE: gather enough context to truly understand what is happening.
2) DEPTH_MODE: gently dig into the emotional roots (beliefs, fears, patterns, meanings, tender feelings).
3) ROOT_CHALLENGE_MODE: after they say they've hit a root, compassionately test and poke their underlying beliefs while still offering warmth.

The conversation is currently in: ${mode}.

--------------------------------
UNDERSTANDING_MODE BEHAVIOR (early in the conversation):
- Focus on clarifying what is actually happening in their life.
- Map out the situation, relationships, pressures, and emotional landscape.
- Ask about concrete details that matter emotionally: who, when, where, how it has been affecting them.
- Explore how this has been showing up over time (patterns, recent changes, what keeps sticking in their mind).
- Stay curious and specific, but do NOT try to go extremely deep yet.

Examples of good UNDERSTANDING_MODE questions:
- "When you say work has been rough, what has the past week actually looked like for you there?"
- "What part of that situation hits you the strongest right now?"
- "Whose reactions or expectations feel most intense in this for you?"
- "When this comes up, where does your mind keep going back to?"
- "Has this been building for a while, or did something specific tip it over?"

--------------------------------
DEPTH_MODE BEHAVIOR (after you understand the picture):
- Now shift toward the root: what this means to them, what it touches in them, what it threatens or awakens.
- Explore beliefs, fears, old patterns, identity, shame, longing, vulnerability.
- Ask questions that help them notice what is underneath the main emotion (for example, fear beneath anger, grief beneath numbness).
- You can reference earlier parts of the conversation, not just the most recent answer.
- Your questions should feel like they are holding their words with care and curiosity, not interrogating them.

Examples of good DEPTH_MODE questions:
- "When you picture that moment, what part of you feels most exposed or vulnerable?"
- "What do you fear this situation might be saying about you as a person?"
- "Does this remind you of an older feeling or pattern from another part of your life?"
- "When that sadness shows up, what do you feel it is trying to protect or say?"
- "What feels most threatened in you when this happens?"

--------------------------------
ROOT_CHALLENGE_MODE BEHAVIOR (after they say they've hit a root):
- Gently challenge the belief or assumption they're holding; poke at its certainty without being harsh.
- Ask how they know, what evidence conflicts, and what it costs them to hold that belief.
- Balance challenge with compassion: pair each probing angle with grounding care.
- Invite them to imagine alternatives, exceptions, or softer interpretations of their belief.
- Keep the tone warm but willing to question: curious, brave, and kind.

--------------------------------
GENERAL RULES FOR ALL QUESTIONS:
- Ask EXACTLY ONE question.
- It must be ONE sentence only.
- No stacked questions, no lists, no parentheticals.
- Never ask generic therapy clichés like "How does that make you feel?" on their own.
- Avoid shallow reformulations like "What does that feel like?" unless it is anchored to something very specific they said.
- Every question must be grounded in the FULL context: the brain dump AND the whole history of answers, not just the last one.
- Use their own words when possible (phrases, names, images they used).
- Never give advice, solutions, or reassurance.
- Do not summarize or interpret; just ask.

INPUTS:

Brain dump (their initial free write):
"${brainDump}"

Conversation so far (questions and answers, oldest to newest):
${qaHistory || 'None yet.'}

MODE-SPECIFIC INSTRUCTIONS:

If the current mode is UNDERSTANDING_MODE:
- Ask a question that helps you better understand the situation and emotional landscape.
- Focus on clarifying what is happening, who is involved, why it matters, and how it has been affecting them.
- You are gathering puzzle pieces before trying to name the root.

If the current mode is DEPTH_MODE:
- Ask a question that goes at least as deep as the previous ones, not shallower.
- Build on the emotional thread from their most recent 1–3 answers.
- Aim your question toward the deeper meanings, fears, beliefs, or vulnerable feelings underneath what they described.

If the current mode is ROOT_CHALLENGE_MODE:
- Aim directly at the core belief they've surfaced.
- Challenge it with curiosity (e.g., what if it were wrong, what does it cost, where did it start, where is it kinder?).
- Keep it warm and human: nudge and comfort in the same breath.

OUTPUT:
Return ONLY the question sentence itself.
- No numbering.
- No "Q:" prefix.
- No quotes.
- No markdown.
Just the raw question as one sentence.`;

  const content = await callGemini(prompt);

  let question = content.trim();
  // Strip leading "Q:", "Question 1:", "1.", etc. if the model ignored instructions
  question = question.replace(
    /^(Q\d*[:\-.]?\s*|Question\s*\d*[:\-.]?\s*|\d+[.\-)]\s*)/i,
    ''
  );
  // Strip surrounding quotes
  question = question.replace(/^"|"$/g, '');

  const cleaned = normalizeQuestion(question);
  return cleaned || 'What would you like to explore deeper?';
}

// =====================================================================
// ONE-SENTENCE CHAT SUMMARY (OPTIONAL)
// =====================================================================

export async function generateChatTitle(
  brainDump: string,
  path: Path,
  answers: Answer[]
): Promise<string> {
  const qaText = answers
    .map((a, idx) => `Q${idx + 1}: ${a.questionText}\nA${idx + 1}: ${a.answer}`)
    .join('\n');

  const prompt = `You are summarizing a reflective conversation where someone is trying to get from surface emotions to their root feelings.

TASK:
Write ONE short, natural-sounding sentence (max ~20 words) that captures the main emotional theme of this conversation.

Guidelines:
- Focus on what they are emotionally wrestling with underneath (fears, needs, tensions), not on small details.
- Use plain language, like something a human might write as a reflection title.
- Keep it gentle and non-judgmental.
- No advice, no instructions, no questions.
- Avoid quotation marks around the sentence.

If there is not enough information to say anything meaningful, respond EXACTLY with:
New chat.

CONTEXT:

Brain dump:
"${brainDump}"

Path (if relevant):
"${path.label}" - ${path.description}

Conversation so far (questions and answers, oldest to newest):
${qaText || 'None yet.'}

OUTPUT:
Return ONLY the single summary sentence (or exactly "New chat." if there is not enough info).`;

  const content = await callGemini(prompt);

  let summary = content.trim();
  summary = summary.replace(/^"|"$/g, '');

  if (!summary || /^new chat\.?$/i.test(summary)) {
    return 'New chat.';
  }

  const oneSentence = toSingleSentence(summary);
  return oneSentence || 'New chat.';
}
