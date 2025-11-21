import type { Path } from '../types';

type KeywordTheme = {
  keywords: string[];
  path: Path;
};

const THEMES: KeywordTheme[] = [
  {
    keywords: ['future', 'job', 'school', 'career', 'move', 'moving', 'decision', 'decide', 'choice', 'choices', 'next', 'plan', 'plans'],
    path: {
      id: 'future',
      label: 'Fear of the Future',
      description: 'Uncertainty about what\'s next and the choices ahead'
    }
  },
  {
    keywords: ['friend', 'girlfriend', 'boyfriend', 'partner', 'relationship', 'alone', 'people', 'connection', 'social', 'family', 'parent', 'parents', 'sibling'],
    path: {
      id: 'relationships',
      label: 'Connection & Relationships',
      description: 'Thoughts about your connections with others'
    }
  },
  {
    keywords: ['perfect', 'enough', 'should', 'have to', 'pressure', 'expectations', 'fail', 'failure', 'wrong', 'mistake', 'anxious', 'worry', 'stress'],
    path: {
      id: 'pressure',
      label: 'Pressure to Get It Right',
      description: 'The weight of expectations and perfectionism'
    }
  },
  {
    keywords: ['who i am', 'myself', 'identity', 'purpose', 'meaning', 'value', 'worth', 'lost', 'direction', 'know who', 'become', 'becoming'],
    path: {
      id: 'identity',
      label: 'Who Am I Becoming?',
      description: 'Questions about your sense of self and purpose'
    }
  },
  {
    keywords: ['overwhelmed', 'tired', 'exhausted', 'stuck', 'trapped', 'helpless', 'hopeless', 'nothing', 'pointless'],
    path: {
      id: 'overwhelm',
      label: 'Feeling Overwhelmed',
      description: 'When everything feels like too much'
    }
  },
  {
    keywords: ['sad', 'depressed', 'down', 'lonely', 'empty', 'numb', 'feel nothing', 'dark', 'bad'],
    path: {
      id: 'emotions',
      label: 'Emotional Weight',
      description: 'The feelings that are sitting with you'
    }
  }
];

const DEFAULT_PATHS: Path[] = [
  {
    id: 'overwhelm',
    label: 'Feeling Overwhelmed',
    description: 'When everything feels like too much'
  },
  {
    id: 'uncertainty',
    label: 'Not Sure What\'s Wrong',
    description: 'A sense that something\'s off, but unclear what'
  },
  {
    id: 'fear',
    label: 'Fear and Uncertainty',
    description: 'Anxiety about the unknown'
  },
  {
    id: 'clarity',
    label: 'Wanting Clarity',
    description: 'A desire to understand yourself better'
  }
];

export function detectPaths(brainDump: string): Path[] {
  if (!brainDump || brainDump.trim().length === 0) {
    return DEFAULT_PATHS;
  }

  const text = brainDump.toLowerCase();
  const pathScores: Map<string, { path: Path; score: number }> = new Map();

  // Score each theme based on keyword matches
  THEMES.forEach(({ keywords, path }) => {
    let score = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        score += matches.length;
      }
    });

    if (score > 0) {
      const existing = pathScores.get(path.id);
      if (!existing || score > existing.score) {
        pathScores.set(path.id, { path, score });
      }
    }
  });

  // Sort by score and take top 3-4
  const sortedPaths = Array.from(pathScores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(item => item.path);

  // If we found paths, return them; otherwise return defaults
  if (sortedPaths.length > 0) {
    return sortedPaths;
  }

  return DEFAULT_PATHS;
}

