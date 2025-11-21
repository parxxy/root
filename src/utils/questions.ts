import type { Question } from '../types';

const QUESTION_SETS: Record<string, Record<number, Question[]>> = {
  future: {
    1: [
      { id: 'f1-1', text: 'What decision are you facing?', layer: 1 },
      { id: 'f1-2', text: 'What would you choose if fear wasn\'t a factor?', layer: 1 },
      { id: 'f1-3', text: 'What information are you missing?', layer: 1 }
    ],
    2: [
      { id: 'f2-1', text: 'What emotion comes up when you think about the future?', layer: 2 },
      { id: 'f2-2', text: 'What story are you telling yourself about what could go wrong?', layer: 2 },
      { id: 'f2-3', text: 'What would feel good to let go of?', layer: 2 }
    ],
    3: [
      { id: 'f3-1', text: 'What do you actually need to feel safe?', layer: 3 },
      { id: 'f3-2', text: 'What if it\'s okay to not know yet?', layer: 3 },
      { id: 'f3-3', text: 'What would your wisest self tell you?', layer: 3 }
    ]
  },
  relationships: {
    1: [
      { id: 'r1-1', text: 'Which relationship feels most challenging right now?', layer: 1 },
      { id: 'r1-2', text: 'What do you need that you\'re not getting?', layer: 1 },
      { id: 'r1-3', text: 'What are you afraid to ask for?', layer: 1 }
    ],
    2: [
      { id: 'r2-1', text: 'What boundaries do you want to set?', layer: 2 },
      { id: 'r2-2', text: 'What do you need to accept about this person?', layer: 2 },
      { id: 'r2-3', text: 'What do you need to accept about yourself?', layer: 2 }
    ],
    3: [
      { id: 'r3-1', text: 'What would it feel like to be fully seen?', layer: 3 },
      { id: 'r3-2', text: 'What love do you need to give yourself first?', layer: 3 },
      { id: 'r3-3', text: 'What would change if you believed you deserve connection?', layer: 3 }
    ]
  },
  pressure: {
    1: [
      { id: 'p1-1', text: 'Where do you feel the most pressure right now?', layer: 1 },
      { id: 'p1-2', text: 'Who are you trying to impress?', layer: 1 },
      { id: 'p1-3', text: 'What happens if you make a mistake?', layer: 1 }
    ],
    2: [
      { id: 'p2-1', text: 'What would "good enough" look like?', layer: 2 },
      { id: 'p2-2', text: 'What expectations are you carrying that aren\'t yours?', layer: 2 },
      { id: 'p2-3', text: 'What would you do if you knew you couldn\'t fail?', layer: 2 }
    ],
    3: [
      { id: 'p3-1', text: 'What do you need to release to feel lighter?', layer: 3 },
      { id: 'p3-2', text: 'What would happen if you allowed yourself to be human?', layer: 3 },
      { id: 'p3-3', text: 'What is enough, just as you are?', layer: 3 }
    ]
  },
  identity: {
    1: [
      { id: 'i1-1', text: 'What about yourself feels unclear right now?', layer: 1 },
      { id: 'i1-2', text: 'Who were you before you started worrying about this?', layer: 1 },
      { id: 'i1-3', text: 'What labels are you holding onto that don\'t fit anymore?', layer: 1 }
    ],
    2: [
      { id: 'i2-1', text: 'What do you want to believe about yourself?', layer: 2 },
      { id: 'i2-2', text: 'What parts of you are you hiding?', layer: 2 },
      { id: 'i2-3', text: 'What would it mean to be fully yourself?', layer: 2 }
    ],
    3: [
      { id: 'i3-1', text: 'What is already true about you that you\'re ignoring?', layer: 3 },
      { id: 'i3-2', text: 'Who would you be without this story?', layer: 3 },
      { id: 'i3-3', text: 'What if you\'re already becoming who you need to be?', layer: 3 }
    ]
  },
  overwhelm: {
    1: [
      { id: 'o1-1', text: 'What feels like too much right now?', layer: 1 },
      { id: 'o1-2', text: 'What can you let go of today?', layer: 1 },
      { id: 'o1-3', text: 'What one thing would make the biggest difference?', layer: 1 }
    ],
    2: [
      { id: 'o2-1', text: 'What do you need most right now?', layer: 2 },
      { id: 'o2-2', text: 'What boundaries would help?', layer: 2 },
      { id: 'o2-3', text: 'What would rest look like?', layer: 2 }
    ],
    3: [
      { id: 'o3-1', text: 'What if you only had to do one thing at a time?', layer: 3 },
      { id: 'o3-2', text: 'What are you holding that someone else could carry?', layer: 3 },
      { id: 'o3-3', text: 'What would change if you believed you don\'t have to do it all?', layer: 3 }
    ]
  },
  emotions: {
    1: [
      { id: 'e1-1', text: 'What emotion feels strongest right now?', layer: 1 },
      { id: 'e1-2', text: 'Where do you feel it in your body?', layer: 1 },
      { id: 'e1-3', text: 'What triggered this feeling?', layer: 1 }
    ],
    2: [
      { id: 'e2-1', text: 'What does this emotion want you to know?', layer: 2 },
      { id: 'e2-2', text: 'What would it feel like to sit with this?', layer: 2 },
      { id: 'e2-3', text: 'What support do you need?', layer: 2 }
    ],
    3: [
      { id: 'e3-1', text: 'What would it mean to honor this feeling?', layer: 3 },
      { id: 'e3-2', text: 'What wisdom is in this emotion?', layer: 3 },
      { id: 'e3-3', text: 'What would change if you let yourself feel fully?', layer: 3 }
    ]
  },
  uncertainty: {
    1: [
      { id: 'u1-1', text: 'What feels unclear or foggy?', layer: 1 },
      { id: 'u1-2', text: 'What are you hoping to figure out?', layer: 1 },
      { id: 'u1-3', text: 'What questions do you have?', layer: 1 }
    ],
    2: [
      { id: 'u2-1', text: 'What information would help?', layer: 2 },
      { id: 'u2-2', text: 'What are you trying to control?', layer: 2 },
      { id: 'u2-3', text: 'What would clarity look like?', layer: 2 }
    ],
    3: [
      { id: 'u3-1', text: 'What if not knowing is part of the process?', layer: 3 },
      { id: 'u3-2', text: 'What can you trust even without certainty?', layer: 3 },
      { id: 'u3-3', text: 'What would help you feel grounded?', layer: 3 }
    ]
  },
  fear: {
    1: [
      { id: 'fe1-1', text: 'What are you most afraid of?', layer: 1 },
      { id: 'fe1-2', text: 'What story is fear telling you?', layer: 1 },
      { id: 'fe1-3', text: 'What would happen if this fear came true?', layer: 1 }
    ],
    2: [
      { id: 'fe2-1', text: 'What do you need to feel safe?', layer: 2 },
      { id: 'fe2-2', text: 'What would courage look like here?', layer: 2 },
      { id: 'fe2-3', text: 'What are you capable of handling?', layer: 2 }
    ],
    3: [
      { id: 'fe3-1', text: 'What would you do if you felt safe?', layer: 3 },
      { id: 'fe3-2', text: 'What if you\'re stronger than you think?', layer: 3 },
      { id: 'fe3-3', text: 'What would change if fear didn\'t run the show?', layer: 3 }
    ]
  },
  clarity: {
    1: [
      { id: 'c1-1', text: 'What do you want clarity about?', layer: 1 },
      { id: 'c1-2', text: 'What feels confusing?', layer: 1 },
      { id: 'c1-3', text: 'What would understanding look like?', layer: 1 }
    ],
    2: [
      { id: 'c2-1', text: 'What questions feel most important?', layer: 2 },
      { id: 'c2-2', text: 'What assumptions might be blocking you?', layer: 2 },
      { id: 'c2-3', text: 'What perspective would help?', layer: 2 }
    ],
    3: [
      { id: 'c3-1', text: 'What do you already know but aren\'t acknowledging?', layer: 3 },
      { id: 'c3-2', text: 'What would wisdom tell you?', layer: 3 },
      { id: 'c3-3', text: 'What if clarity is simpler than you think?', layer: 3 }
    ]
  }
};

export function getQuestionsForPath(pathId: string, layer: number): Question[] {
  const questions = QUESTION_SETS[pathId]?.[layer];
  return questions || [];
}

export function generateSummary(brainDump: string, answers: Array<{ questionText: string; answer: string }>): string {
  const answerText = answers.map(a => `${a.questionText} ${a.answer}`).join('. ');
  const fullText = `${brainDump}. ${answerText}`.toLowerCase();
  
  // Simple heuristic: look for common patterns
  if (fullText.includes('future') || fullText.includes('decision') || fullText.includes('choice')) {
    return 'You\'re navigating uncertainty about what\'s ahead, weighing decisions and possibilities. The future feels both full of potential and overwhelming.';
  }
  if (fullText.includes('relationship') || fullText.includes('friend') || fullText.includes('alone')) {
    return 'You\'re exploring your connections with others—what you need, what you give, and how to show up authentically in relationships.';
  }
  if (fullText.includes('pressure') || fullText.includes('expectation') || fullText.includes('perfect')) {
    return 'You\'re carrying weight from expectations—your own and others\'. The pressure to get it right is real, and it\'s asking something of you.';
  }
  if (fullText.includes('who') || fullText.includes('identity') || fullText.includes('myself')) {
    return 'You\'re in a space of self-discovery, questioning who you are and who you\'re becoming. There\'s something here about finding yourself.';
  }
  if (fullText.includes('overwhelm') || fullText.includes('too much') || fullText.includes('stuck')) {
    return 'You\'re feeling the weight of everything at once. There\'s a lot on your plate, and it\'s asking you to slow down and choose what matters.';
  }
  if (fullText.includes('sad') || fullText.includes('lonely') || fullText.includes('empty')) {
    return 'You\'re sitting with some heavy emotions. There\'s something here that needs your attention, something that\'s asking to be felt and understood.';
  }
  
  return 'You\'ve been exploring layers of what\'s on your mind. There\'s depth here, and some patterns that are worth paying attention to.';
}

export function generateRootConcern(brainDump: string, answers: Array<{ questionText: string; answer: string }>): string {
  const answerText = answers.map(a => a.answer).join(' ').toLowerCase();
  const fullText = `${brainDump} ${answerText}`.toLowerCase();
  
  if (fullText.includes('enough') || fullText.includes('perfect') || fullText.includes('should')) {
    return 'A belief that you need to be more, do more, or prove your worth.';
  }
  if (fullText.includes('alone') || fullText.includes('connect') || fullText.includes('belong')) {
    return 'A fear of not being seen, understood, or truly connected with others.';
  }
  if (fullText.includes('future') || fullText.includes('decision') || fullText.includes('wrong choice')) {
    return 'Anxiety about making the "right" choice and fear of what might come.';
  }
  if (fullText.includes('who') || fullText.includes('lost') || fullText.includes('direction')) {
    return 'A question about your identity and whether you\'re on the right path.';
  }
  if (fullText.includes('control') || fullText.includes('worry') || fullText.includes('uncertainty')) {
    return 'A need for certainty and control in the face of the unknown.';
  }
  
  return 'A sense that something isn\'t quite right, and a desire to understand what\'s underneath.';
}

