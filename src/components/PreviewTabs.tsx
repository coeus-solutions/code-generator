import React from 'react';
import { Code, Play } from 'lucide-react';

interface PreviewTabsProps {
  activeTab: 'code' | 'preview';
  onTabChange: (tab: 'code' | 'preview') => void;
  previewAvailable: boolean;
}

export function PreviewTabs({ activeTab, onTabChange, previewAvailable }: PreviewTabsProps) {
  return (
    <div className="flex border-b border-gray-800 bg-gray-950 px-2">
      <button
        onClick={() => onTabChange('code')}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'code'
            ? 'border-blue-500 text-blue-400'
            : 'border-transparent text-gray-400 hover:text-gray-300'
        }`}
      >
        <Code size={16} />
        Code
      </button>
      <button
        onClick={() => onTabChange('preview')}
        disabled={!previewAvailable}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
          !previewAvailable
            ? 'opacity-50 cursor-not-allowed text-gray-500'
            : activeTab === 'preview'
            ? 'border-blue-500 text-blue-400'
            : 'border-transparent text-gray-400 hover:text-gray-300'
        }`}
      >
        <Play size={16} />
        Preview
      </button>
    </div>
  );
}