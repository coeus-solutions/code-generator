import React from 'react';
import { Split } from 'lucide-react';
import { SubmitButton } from './SubmitButton';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function Editor({ value, onChange, onSubmit, isLoading }: EditorProps) {
  return (
    <div className="h-full bg-gray-900 text-white p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-400">
          <Split size={20} />
          <span className="text-sm font-medium">Input</span>
        </div>
        <SubmitButton onSubmit={onSubmit} isLoading={isLoading} />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[calc(100%-40px)] bg-gray-800 text-gray-100 p-4 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        placeholder="Start typing your prompt here..."
      />
    </div>
  );
}