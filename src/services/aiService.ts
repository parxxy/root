import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Path, Question, Answer } from '../types';

// Default API key (can be overridden in settings)
const DEFAULT_API_KEY = 'AIzaSyAkvYkel0vsJWDtnI4EKUu_4MrQTYj6XW0';

// Keep AI questions to a single sentence
function toSingleSentence(text: string): string {
  const collapsed = text
    .replace(/\s+/g, ' ')
    .replace(/\(.+?\)/g, '') // remove parentheticals for simpler, uninterrupted questions
    .trim();
  const withoutWhenYouSay = collapsed.replace(/^when you say[, ]*/i, '');
  const match = withoutWhenYouSay.match(/[^.?!]+[.?!]?/);
  return match ? match[0].trim() : withoutWhenYouSay;
}

// Get API key from environment or localStorage
function getApiKeyInternal(): string | null {
  // Check environment variable first (for build-time)
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey) return envKey;
  
  // Check localStorage (for runtime configuration)
  const storedKey = localStorage.getItem('gemini_api_key');
  if (storedKey) return storedKey;
  
  // Use default key if provided
  return DEFAULT_API_KEY;
}

let geminiClient: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI | null {
  const apiKey = getApiKeyInternal();
  if (!apiKey) return null;
  
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  
  return geminiClient;
}

export function hasApiKey(): boolean {
  return getApiKeyInternal() !== null;
}

export function getApiKey(): string | null {
  return getApiKeyInternal();
}

export function setApiKey(key: string): void {
  localStorage.setItem('gemini_api_key', key);
  geminiClient = null; // Reset client to use new key
}

export function clearApiKey(): void {
  localStorage.removeItem('gemini_api_key');
  geminiClient = null;
}

// Generate paths from brain dump using AI
export async function generatePaths(brainDump: string): Promise<Path[]> {
  const client = getClient();
  if (!client) {
    throw new Error('Gemini API key not configured. Please set your API key in settings.');
  }

  try {
    // Use gemini-2.0-flash (free tier, latest model)
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `You are a thoughtful therapist helping someone explore their thoughts. Based on their brain dump, identify 3-4 key paths or themes they could explore. Each path should be:
- A clear, empathetic label (2-5 words)
- A brief description (one sentence) that helps them understand what this path explores

Return ONLY a JSON array in this format:
{
  "paths": [
    {
      "id": "unique-id",
      "label": "Path Name",
      "description": "Brief description of what this path explores"
    }
  ]
}

Keep paths focused, specific, and helpful. Avoid generic responses.

Here's what someone wrote in their brain dump:

"${brainDump}"

Identify 3-4 paths they could explore.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();
    
    if (!content) throw new Error('No response from AI');

    // Extract JSON from markdown code blocks if present
    let jsonText = content.trim();
    if (jsonText.includes('```json')) {
      jsonText = jsonText.split('```json')[1].split('```')[0].trim();
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.split('```')[1].split('```')[0].trim();
    }

    const parsed = JSON.parse(jsonText);
    let paths = parsed.paths || parsed;
    
    // Ensure it's an array
    if (!Array.isArray(paths)) {
      if (typeof paths === 'object' && paths !== null) {
        paths = Object.values(paths);
      } else {
        paths = [paths];
      }
    }
    
    // Validate and format paths
    return paths.slice(0, 4).map((p: any, idx: number) => ({
      id: p.id || `path_${idx}`,
      label: p.label || 'Unknown Path',
      description: p.description || 'Explore this path'
    }));
  } catch (error) {
    console.error('Error generating paths:', error);
    throw error;
  }
}

// Generate context-aware questions for a specific path and layer
export async function generateQuestions(
  brainDump: string,
  path: Path,
  layer: number,
  previousAnswers: Answer[]
): Promise<Question[]> {
  const client = getClient();
  if (!client) {
    throw new Error('Gemini API key not configured.');
  }

  const layerDescriptions = [
    'Surface-level clarifying questions that help understand the situation better',
    'Emotional and meaning-focused questions that go deeper into feelings and motivations',
    'Root-level questions that explore core beliefs, values, and fundamental concerns'
  ];

  const contextText = previousAnswers.length > 0
    ? `\n\nPrevious answers in this exploration:\n${previousAnswers.map(a => `Q: ${a.questionText}\nA: ${a.answer}`).join('\n\n')}`
    : '';

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `You are a thoughtful therapist asking insightful questions. Generate 2-4 questions for Layer ${layer} (${layerDescriptions[layer - 1]}).

These questions should:
- Be specific to their situation based on the brain dump and path
- Be open-ended and thought-provoking
- Build on previous answers if provided
- Feel natural and conversational
- Each question must be ONE sentence only (no multi-sentence or stacked questions)
- Use simple, uninterrupted sentences (no lists, no parentheticals, no stacked clauses)

Return ONLY a JSON object in this format:
{
  "questions": [
    {"id": "q1", "text": "Question text here", "layer": ${layer}},
    {"id": "q2", "text": "Question text here", "layer": ${layer}}
  ]
}

Brain dump: "${brainDump}"

Path: "${path.label}" - ${path.description}${contextText}

Generate ${layer === 3 ? '3' : '2-3'} Layer ${layer} questions.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();
    
    if (!content) throw new Error('No response from AI');

    // Extract JSON from markdown code blocks if present
    let jsonText = content.trim();
    if (jsonText.includes('```json')) {
      jsonText = jsonText.split('```json')[1].split('```')[0].trim();
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.split('```')[1].split('```')[0].trim();
    }

    const parsed = JSON.parse(jsonText);
    const questions = parsed.questions || [];
    
    return questions.map((q: any) => ({
      id: q.id || `q_${Date.now()}_${Math.random()}`,
      text: toSingleSentence(q.text || q.question || 'How are you feeling?'),
      layer: q.layer || layer
    }));
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
}

// Generate summary and root concern
export async function generateInsights(
  brainDump: string,
  path: Path,
  answers: Answer[]
): Promise<{ summary: string; rootConcern: string }> {
  const client = getClient();
  if (!client) {
    throw new Error('Gemini API key not configured.');
  }

  const qaText = answers.map(a => `Q: ${a.questionText}\nA: ${a.answer}`).join('\n\n');

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `You are a thoughtful therapist providing insights. Based on someone's brain dump and their answers to exploration questions, provide:
1. A compassionate summary (2-3 sentences) of what they've shared
2. A possible root concern (1 sentence) - what seems to be at the core

Be empathetic, insightful, and helpful. Avoid being overly prescriptive.

Return ONLY a JSON object:
{
  "summary": "Your summary here...",
  "rootConcern": "The possible root concern..."
}

Brain dump: "${brainDump}"

Path explored: "${path.label}"

Their journey:
${qaText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();
    
    if (!content) throw new Error('No response from AI');

    // Extract JSON from markdown code blocks if present
    let jsonText = content.trim();
    if (jsonText.includes('```json')) {
      jsonText = jsonText.split('```json')[1].split('```')[0].trim();
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.split('```')[1].split('```')[0].trim();
    }

    const parsed = JSON.parse(jsonText);
    
    return {
      summary: parsed.summary || 'You\'ve been exploring layers of what\'s on your mind.',
      rootConcern: parsed.rootConcern || parsed.root_concern || 'A desire to understand yourself better.'
    };
  } catch (error) {
    console.error('Error generating insights:', error);
    throw error;
  }
}

// Generate a very short title for a chat (2–5 words, Title Case)
export async function generateChatTitle(
  brainDump: string,
  path: Path,
  answers: Answer[]
): Promise<string> {
  const client = getClient();
  if (!client) {
    throw new Error('Gemini API key not configured.');
  }

  const qaText = answers
    .map((a, idx) => `Q${idx + 1}: ${a.questionText}\nA${idx + 1}: ${a.answer}`)
    .join('\n');

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are a helpful assistant that creates very short titles for chats.
Rules:
- Use 2–5 words.
- No quotation marks.
- Use Title Case.
- Summarize the main topic of the conversation.
- If there isn’t enough info, respond exactly with: New chat.

Brain dump: "${brainDump}"
Path: "${path.label}" - ${path.description}
Answers so far:
${qaText || 'None yet'}

Return only the title text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();
    if (!content) throw new Error('No response from AI');

    let title = content.trim();
    title = title.replace(/^["']|["']$/g, ''); // strip surrounding quotes
    const words = title.split(/\s+/).filter(Boolean).slice(0, 5);
    if (words.length < 2) return 'New chat';
    const toTitleCase = (word: string) =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    return words.map(toTitleCase).join(' ');
  } catch (error) {
    console.error('Error generating chat title:', error);
    return 'New chat';
  }
}

// Generate a single follow-up question based on brain dump and previous answers
export async function generateNextQuestion(
  brainDump: string,
  previousAnswers: Answer[]
): Promise<string> {
  const client = getClient();
  if (!client) {
    throw new Error('Gemini API key not configured.');
  }

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const qaHistory = previousAnswers.map((a, idx) => 
      `Q${idx + 1}: ${a.questionText}\nA${idx + 1}: ${a.answer}`
    ).join('\n\n');

    const prompt = `You are a thoughtful conversationalist helping someone explore their thoughts through questions. Based on their brain dump and the answers they've given, ask ONE follow-up question that digs deeper into their emotions and feelings.

IMPORTANT: Only ask questions. Do NOT provide advice, summaries, interpretations, or suggestions. Your role is to help them explore deeper through questions only.

Guidelines:
- Ask ONE specific, focused question (not multiple questions)
- It must be exactly ONE sentence (no multi-sentence responses)
- Keep it simple and uninterrupted (no parentheticals, no multi-part clauses)
- Make it feel natural and conversational, like you're really listening
- Build on what they've already shared - reference specific things they mentioned (names, situations, feelings)
- Go deeper into the emotions, feelings, or underlying concerns - help them get to the root of how they're feeling
- Questions should feel supportive, empathetic, and curious - not interrogating
- When relevant, offer specific options they can choose from (like: "the school pressure, the emotional stuff with Olivia, or the fear about the future? (You can pick one or say 'all of them equally.')")
- Be specific about what they mentioned - reference their exact words when helpful
- Dig into what's underneath - the feelings, fears, or concerns behind what they said
- Format like a real conversation - sometimes offer choices, sometimes ask open questions

Example question styles:
// Avoid starting with "When you say" to keep questions direct
- "If it's feeling like too much to hold, what feels the heaviest right now — the school pressure, the emotional stuff with Olivia, or the fear about the future? (You can pick one or say 'all of them equally.')"
- "What part of school feels like the biggest threat right now: falling behind, not having energy, or fear of disappointing yourself?"
- "Does the exhaustion feel more physical (your body is tired) or mental (your mind is tired from thinking)?"
- "When you think about Olivia, do you feel more anxious about what could happen, or about not knowing what will happen?"
- "If your future feels like it's 'barreling toward you,' what's the thing you're afraid it might hit you with?"
- "When you feel paralyzed, what thought is usually running through your mind in that moment?"

${previousAnswers.length === 0 
  ? `This is their initial brain dump - ask your FIRST question to help them explore what's really going on. Focus on understanding what's at the core, what's underneath. Be specific to what they mentioned:

"${brainDump}"

What's the most important thing you'd want to understand first? Ask about their overwhelm, their concerns, their feelings. Reference specific things they mentioned.`
  : `Brain dump:
"${brainDump}"

Their answers so far:
${qaHistory}

What's the next question you'd ask to dig deeper? Build on what they've shared. Go into the emotions, fears, or underlying concerns. Reference what they said specifically. Think about what's underneath what they're feeling.`}

Return ONLY the question text, nothing else. No numbering, no "Q:" prefix, no quotes around it, just the question itself.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();
    
    if (!content) throw new Error('No response from AI');

    // Clean up the response - remove any numbering or prefixes
    let question = content.trim();
    // Remove common prefixes like "Q:", "Question:", numbers, etc.
    question = question.replace(/^(Q\d*[:\-.]?\s*|Question\s*\d*[:\-.]?\s*|\d+[.\-)]\s*)/i, '');
    // Remove quotes if wrapped
    question = question.replace(/^["']|["']$/g, '');
    
    return toSingleSentence(question);
  } catch (error) {
    console.error('Error generating question:', error);
    throw error;
  }
}
