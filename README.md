# Layers

A thoughtful web app that helps users "peel back the layers" of what's on their mind, inspired by a paper fortune teller.

## Features

- **Brain Dump**: Start by freely writing what's weighing on your mind
- **Path Selection**: Choose from 3-4 paths that emerge from your writing
- **Layered Exploration**: Go deeper through 3 layers of thoughtful questions
- **Insight Summary**: Receive a personalized summary and root concern analysis
- **Session History**: View and revisit past explorations stored in localStorage

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: CSS Modules with modern, clean design
- **State Management**: React Hooks
- **Persistence**: Browser localStorage

## Getting Started

### Installation

```bash
cd layers-app
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## How It Works

1. **Brain Dump**: Write freely about what's on your mind
2. **Path Detection**: The app analyzes keywords to suggest relevant paths
3. **Layered Questions**: Explore through 3 layers:
   - Layer 1: Surface-level clarifying questions
   - Layer 2: Emotional/meaning questions
   - Layer 3: Root-level questions
4. **Insights**: Receive a summary and explore your answers in a timeline

## Project Structure

```
src/
├── components/          # React components
│   ├── HomeScreen.tsx
│   ├── BrainDumpScreen.tsx
│   ├── PathSelectionScreen.tsx
│   ├── LayerQuestionScreen.tsx
│   └── InsightSummaryScreen.tsx
├── utils/              # Utility functions
│   ├── pathDetection.ts
│   ├── questions.ts
│   └── storage.ts
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

## License

MIT
