import React from 'react';
import { Send } from 'lucide-react';

interface SubmitButtonProps {
  onSubmit: () => void;
  isLoading: boolean;
}

export function SubmitButton({ onSubmit, isLoading }: SubmitButtonProps) {
  return (
    <button
      onClick={onSubmit}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Send size={18} />
      <span>{isLoading ? 'Generating...' : 'Generate'}</span>
    </button>
  );
}