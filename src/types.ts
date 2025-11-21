export type Path = {
  id: string;
  label: string;
  description: string;
};

export type Question = {
  id: string;
  text: string;
  layer: number;
};

export type Answer = {
  questionId: string;
  questionText: string;
  answer: string;
  layer: number;
};

export type Session = {
  id: string;
  timestamp: number;
  brainDump: string;
  selectedPath: Path;
  answers: Answer[];
  summary?: string;
  rootConcern?: string;
};

export type AppState = {
  currentScreen: 'home' | 'brainDump' | 'pathSelection' | 'layerQuestions' | 'insight';
  brainDump: string;
  detectedPaths: Path[];
  selectedPath: Path | null;
  currentLayer: number;
  answers: Answer[];
  questionsShown: Set<string>;
};

