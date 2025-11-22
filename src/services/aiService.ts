import type { Path, Question, Answer } from '../types';

// Decide which backend to call:
// - In production: your Render proxy
// - In local dev (optional): your local server.js on port 3001
const GEMINI_BASE =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'https://digtotheroot.onrender.com';

const GEMINI_ENDPOINT = `${GEMINI_BASE}/api/gemini`;

// --- TEXT HELPERS ---

// Keep AI questions to a single sentence
function toSingleSentence(text: string): string {
  if (!text) return '';
  const collapsed = text
    .replace(/\s+/g, ' ')
    .replace(/\(.+?\)/g, '') // remove parentheticals for simpler, uninterrupted questions
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
// LEGACY: PATHS + LAYERED QUESTIONS (OK TO KEEP EVEN IF UNUSED NOW)
// =====================================================================

export async function generatePaths(brainDump: string): Promise<Path[]> {
  const prompt = `You are a thoughtful therapist helping someone explore their thoughts.

TASK:
Given the brain dump below, identify 3–4 key emotional themes they could explore.

OUTPUT FORMAT (MUST MATCH EXACTLY):
Return ONLY valid JSON, no explanations, no backticks:
{
  "paths": [
    {
      "id": "unique-id",
      "label": "Path Name",
      "description": "Brief description of what this path explores"
    }
  ]
}

Constraints:
- "label": 2–5 words, clear and empathetic.
- "description": exactly one sentence.
- Focus on specific feelings, fears, or tensions rather than generic labels.

Brain dump:
"${brainDump}"

Respond with the JSON only.`;

  let content = await callGemini(prompt);
  let jsonText = content.trim();

  if (jsonText.includes('```json')) {
    jsonText = jsonText.split('```json')[1].split('```')[0].trim();
  } else if (jsonText.includes('```')) {
    jsonText = jsonText.split('```')[1].split('```')[0].trim();
  }

  const parsed = safeJsonParse<any>(jsonText);

  if (!parsed) {
    return [
      {
        id: 'path_fallback',
        label: 'Explore Feelings',
        description: 'Explore what feels most alive or intense for you right now.'
      }
    ] as Path[];
  }

  let paths: any = Array.isArray(parsed) ? parsed : parsed.paths ?? parsed;

  if (!Array.isArray(paths)) {
    paths = Object.values(paths);
  }

  return (paths as any[]).slice(0, 4).map((p, idx) => ({
    id: String(p.id || `path_${idx}`),
    label: String(p.label || 'Unknown Path'),
    description: String(
      p.description ||
        'Explore what feels most important or intense for you right now.'
    )
  }));
}

export async function generateQuestions(
  brainDump: string,
  path: Path,
  layer: number,
  previousAnswers: Answer[]
): Promise<Question[]> {
  const layerDescriptions = [
    'Surface-level clarifying questions that help understand the situation better',
    'Emotional and meaning-focused questions that go deeper into feelings and motivations',
    'Root-level questions that explore core beliefs, values, and fundamental concerns'
  ];

  const contextText =
    previousAnswers.length > 0
      ? `\n\nPrevious answers in this exploration (oldest to newest):\n${previousAnswers
          .map(
            (a, i) =>
              `Q${i + 1}: ${a.questionText}\nA${i + 1}: ${a.answer}`
          )
          .join('\n\n')}`
      : '';

  const prompt = `You are a thoughtful therapist asking increasingly deep questions to help someone get from surface emotions to the root emotion underneath (for example, noticing fear underneath anger).

TASK:
Generate 2–4 questions for Layer ${layer} (${layerDescriptions[layer - 1]}).

Overall goals:
- Always move emotionally sideways or deeper, never back up to generic or surface-level topics.
- Use their own words from the brain dump and previous answers.
- Track the emotional thread across the whole conversation, not just the last message.

Question rules:
- Each question must be ONE sentence only.
- Ask ONE question per sentence (no stacked questions).
- Focus on feelings, fears, needs, and meanings under what they said.
- Reference specific phrases, situations, or people they mentioned.
- It is okay for questions to feel emotionally direct and intense, as long as they are gentle and non-judgmental.
- Avoid advice, reassurance, or solutions.
- Vary your phrasing and structure; do NOT repeat the same template like "What is underneath that?" or "What is the root of that?".

OUTPUT FORMAT (MUST MATCH EXACTLY):
Return ONLY valid JSON (no backticks, no explanation):
{
  "questions": [
    { "id": "q1", "text": "Question text here", "layer": ${layer} },
    { "id": "q2", "text": "Question text here", "layer": ${layer} }
  ]
}

Brain dump:
"${brainDump}"

Path:
"${path.label}" - ${path.description}
${contextText}

Generate ${layer === 3 ? '3' : '2-3'} Layer ${layer} questions that stay with the emotional thread and move at least as deep as the previous questions.`;

  let content = await callGemini(prompt);
  let jsonText = content.trim();

  if (jsonText.includes('```json')) {
    jsonText = jsonText.split('```json')[1].split('```')[0].trim();
  } else if (jsonText.includes('```')) {
    jsonText = jsonText.split('```')[1].split('```')[0].trim();
  }

  const parsed = safeJsonParse<any>(jsonText);
  if (!parsed || !parsed.questions || !Array.isArray(parsed.questions)) {
    const fallback = [
      'What would you like to explore deeper?',
      'What feels most important to talk about right now?'
    ];
    return fallback.map((text, idx) => ({
      id: `q_fallback_${idx}`,
      text: normalizeQuestion(text),
      layer
    }));
  }

  const questions = parsed.questions as any[];
  return questions.map((q, idx) => ({
    id: q.id || `q_${Date.now()}_${idx}`,
    text: normalizeQuestion(q.text || q.question || 'How are you feeling?'),
    layer: q.layer || layer
  }));
}

// =====================================================================
// CORE: INSIGHTS
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
// "I AM OLIVIA" SECRET MODE
// =====================================================================

const OLIVIA_TRIGGER = /i\s+am\s+olivia/i;

// Simple, sweet compliments focused on pretty, smart, talented, creative,
// fashionable, funny, and cute.
const OLIVIA_COMPLIMENTS: string[] = [
  'You seem like someone who is incredibly pretty in a soft, effortless way.',
  'You give off the energy of someone who is genuinely smart and naturally insightful.',
  'You feel like a person with a lot of talent that shows even in little ways.',
  'You come across as really creative, like ideas just naturally flow out of you.',
  'You seem like the type of person who has great style without even trying.',
  'You feel like someone who is funny in a way that makes people feel comfortable.',
  'You carry a super cute energy that people notice right away.',
  'You seem like someone who shines without needing to say a lot.',
  'You give off the vibe of someone who is bright and warm at the same time.',
  'You feel like someone whose presence makes things better just by being there.'
];

function isOliviaMode(brainDump: string, previousAnswers: Answer[]): boolean {
  if (OLIVIA_TRIGGER.test(brainDump)) return true;
  return previousAnswers.some(a => OLIVIA_TRIGGER.test(a.answer));
}

function getOliviaCompliment(previousAnswers: Answer[]): string {
  const index = previousAnswers.length % OLIVIA_COMPLIMENTS.length;
  return OLIVIA_COMPLIMENTS[index];
}

// =====================================================================
// SINGLE FOLLOW-UP QUESTION (OR OLIVIA MODE)
// =====================================================================

export async function generateNextQuestion(
  brainDump: string,
  previousAnswers: Answer[]
): Promise<string> {
  // Olivia mode: "I am Olivia" => compliment mode instead of questions
  if (isOliviaMode(brainDump, previousAnswers)) {
    return getOliviaCompliment(previousAnswers);
  }

  const qaHistory = previousAnswers
    .map(
      (a, idx) =>
        `Q${idx + 1}: ${a.questionText}\nA${idx + 1}: ${a.answer}`
    )
    .join('\n\n');

  const prompt = `You are a thoughtful, gently persistent conversational partner whose job is to help someone move from surface emotions toward the deeper, root emotions underneath (for example, fear or vulnerability beneath anger).

You will ask ONLY ONE question at a time, every time.

Global goals:
- Always move at least as deep as before; never zoom out to generic small talk or very broad questions.
- Track the emotional thread across the entire conversation: the brain dump AND all previous answers.
- Use their own words (phrases, images, names) so it feels personal and grounded.
- Stay with feelings, meanings, fears, body sensations, and needs rather than giving advice or focusing on practical problem-solving.

Question style:
- Ask exactly ONE specific question.
- It must be exactly ONE sentence.
- No stacked questions, no lists, no parentheticals.
- It is okay for the question to feel emotionally direct/intense, but it must be gentle, curious, and non-judgmental.
- Vary your phrasing and structure; do NOT repeat the same template like "What is underneath that?" or "What is the root of that?".
- You can come at depth from different angles: what it reminds them of, what they fear it means about them, how it feels in their body, what part of them is speaking, what they are afraid will happen, what they wish they could say, etc.
- When helpful, you may offer 2–3 options inside the same sentence (for example, "Does it feel more like X, Y, or Z?"), but this still must be one sentence.

DO NOT:
- Do not give advice, solutions, or reassurance.
- Do not summarize what they said.
- Do not change the topic to something more general or lighter.
- Do not ask "How was your day?" or other surface questions.

INPUTS:

Brain dump (their initial free write):
"${brainDump}"

Conversation so far (questions and answers, oldest to newest):
${qaHistory || 'None yet.'}

If there are no previous answers yet, ask a first question that:
- Picks up on the emotionally heaviest or most repeated theme in the brain dump.
- Asks about what feels most loaded, scary, or tender underneath that theme, using varied, natural language.

If there ARE previous answers, ask a next question that:
- Builds directly on what they just shared in their most recent 1–2 answers.
- Digs into what might be underneath that (feelings, fears, beliefs, needs, body sensations, or old patterns).
- Does not jump to new topics or step back to shallow ground.

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
// ONE-SENTENCE CHAT SUMMARY
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