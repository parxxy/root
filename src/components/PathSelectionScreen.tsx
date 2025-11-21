import type { Path } from '../types';
import './PathSelectionScreen.css';

interface PathSelectionScreenProps {
  paths: Path[];
  onPathSelected: (path: Path) => void;
}

export default function PathSelectionScreen({ paths, onPathSelected }: PathSelectionScreenProps) {
  return (
    <div className="path-selection-screen">
      <div className="path-selection-container">
        <h1 className="path-selection-title">Choose a path to explore</h1>
        <p className="path-selection-subtitle">
          These paths emerged from what you wrote. Pick one that resonates.
        </p>

        <div className="paths-grid">
          {paths.map((path) => (
            <div
              key={path.id}
              className="path-card"
              onClick={() => onPathSelected(path)}
            >
              <h2 className="path-label">{path.label}</h2>
              <p className="path-description">{path.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

