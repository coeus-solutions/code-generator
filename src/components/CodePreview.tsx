import React from 'react';
import { AlertCircle } from 'lucide-react';

interface CodePreviewProps {
  code: string;
  language?: string;
}

export function CodePreview({ code, language = 'typescript' }: CodePreviewProps) {
  if (!code) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 gap-2">
        <AlertCircle size={20} />
        <span className="text-sm">Generate code to see the preview</span>
      </div>
    );
  }

  return (
    <div className="relative bg-gray-950 text-gray-100 rounded-lg">
      <pre className="font-mono text-sm leading-6">
        <code className={`language-${language} block overflow-x-auto`}>
          {code.split('\n').map((line, i) => (
            <div key={i} className="px-4 whitespace-pre border-l-2 border-transparent hover:border-gray-800 hover:bg-gray-900/50">
              {line || '\n'}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}