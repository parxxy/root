import { useState, useEffect } from 'react';
import { setApiKey, clearApiKey } from '../services/aiService';
import './SettingsScreen.css';

interface SettingsScreenProps {
  onClose: () => void;
}

export default function SettingsScreen({ onClose }: SettingsScreenProps) {
  const [apiKey, setApiKeyInput] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    // Always show as configured since we have a default key
    setIsConfigured(true);
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) {
      alert('Please enter an API key');
      return;
    }
    
    setApiKey(apiKey.trim());
    setIsConfigured(true);
    setApiKeyInput('');
    alert('API key saved!');
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear your API key?')) {
      clearApiKey();
      setIsConfigured(false);
      setApiKeyInput('');
    }
  };

  return (
    <div className="settings-screen">
      <div className="settings-container">
        <div className="settings-header">
          <h1>AI Settings</h1>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h2>Google Gemini API Key</h2>
            <p className="settings-description">
              AI-powered dynamic paths and questions use Google's Gemini API (free tier).
              Your key is stored locally and never sent anywhere except to Google.
              A default key is already configured, but you can override it here.
            </p>

            {isConfigured && (
              <div className="api-key-status">
                <span className="status-indicator configured">●</span>
                <span>API key is configured</span>
                <button className="clear-button" onClick={handleClear}>Clear Key</button>
              </div>
            )}

            {!isConfigured && (
              <div className="api-key-input-section">
                <input
                  type={showKey ? 'text' : 'password'}
                  className="api-key-input"
                  placeholder="AIza..."
                  value={apiKey}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                />
                <button
                  className="toggle-visibility"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? '👁️' : '👁️‍🗨️'}
                </button>
                <button className="save-button" onClick={handleSave}>
                  Save Key
                </button>
              </div>
            )}

            <div className="settings-info">
              <h3>How to get your own API key (optional):</h3>
              <ol>
                <li>Go to <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a></li>
                <li>Sign in with your Google account</li>
                <li>Create a new API key</li>
                <li>Paste it here (starts with "AIza")</li>
              </ol>
              
              <div className="security-warning">
                <strong>ℹ️ Note:</strong> A default API key is configured. You can override it with your own if needed. For production use, API keys should be stored on a backend server.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
