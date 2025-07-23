import React, { useState } from 'react';
import { GithubIcon, X } from 'lucide-react';

interface GitHubTokenPopupProps {
  onTokenSubmit: (token: string) => void;
  isSubmitting: boolean;
  onClose: () => void;
}

export default function GitHubTokenPopup({ onTokenSubmit, isSubmitting, onClose }: GitHubTokenPopupProps) {
  const [token, setToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onTokenSubmit(token.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-card text-card-foreground rounded-lg shadow-lg p-8 max-w-md w-full">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-4 mb-6">
          <GithubIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
          <h2 className="text-2xl font-bold">Connect Your GitHub Account</h2>
        </div>
        <div className="text-muted-foreground mb-6 space-y-4">
          <p>
            To analyze and manage your repositories, this app requires a GitHub Personal Access Token. Your token is stored securely and is only used to interact with your repositories on your behalf.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click the link below to go to GitHub.</li>
            <li>Give your token a descriptive name in the 'Note' field.</li>
            <li>In the 'Select scopes' section, check the box for <strong>repo</strong>.</li>
            <li>Click 'Generate token' at the bottom of the page.</li>
            <li>Copy the generated token and paste it below.</li>
          </ol>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="github-token" className="block text-sm font-medium text-muted-foreground mb-2">GitHub Personal Access Token</label>
            <input
              id="github-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="temp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>
                              <a href="https://github.com/settings/tokens/new?scopes=repo&description=Almond%20Donut%20App" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mb-6 block">
            Open GitHub to create a new token
          </a>
          <button
            type="submit"
            disabled={isSubmitting || !token.trim()}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save and Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
