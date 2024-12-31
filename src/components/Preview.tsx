import React, { useState, useMemo } from 'react';
import { PreviewTabs } from './PreviewTabs';
import { CodePreview } from './CodePreview';
import { FileText, Loader } from 'lucide-react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackCodeEditor,
} from '@codesandbox/sandpack-react';
import { nightOwl } from '@codesandbox/sandpack-themes';

interface GeneratedFile {
  filename: string;
  content: string;
}

interface PreviewProps {
  files: GeneratedFile[];
  selectedFile: GeneratedFile | null;
  onFileSelect: (file: GeneratedFile) => void;
  isLoading: boolean;
}

export function Preview({ 
  files, 
  selectedFile, 
  onFileSelect, 
  isLoading
}: PreviewProps) {
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const hasGeneratedCode = files.length > 0;

  // Prepare files for Sandpack
  const sandpackFiles = useMemo(() => {
    const fileMap: Record<string, { code: string }> = {
      '/index.html': {
        code: `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { margin: 0; padding: 16px; background: #030712; color: white; }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`
      },
      '/App.tsx': {
        code: `import React from 'react';
import { createRoot } from 'react-dom/client';
${files.map(file => `import { ${file.filename.replace(/\.tsx?$/, '')} } from './${file.filename}';`).join('\n')}

const App = () => {
  return (
    <div className="p-4">
      ${files.map(file => `<${file.filename.replace(/\.tsx?$/, '')} />`).join('\n      ')}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);`
      }
    };

    // Add all generated files
    files.forEach(file => {
      fileMap[`/${file.filename}`] = { code: file.content };
    });

    return fileMap;
  }, [files]);

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden">
      <PreviewTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        previewAvailable={hasGeneratedCode}
      />
      
      <div className="flex-1 min-h-0 relative">
        {activeTab === 'code' ? (
          <div className="absolute inset-0 grid grid-cols-[220px,1fr]">
            {/* File List */}
            <div className="border-r border-gray-800 overflow-y-auto bg-gray-900">
              <div className="p-2 h-full">
                {isLoading && files.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                    <div className="animate-spin">
                      <Loader size={24} />
                    </div>
                    <span className="text-sm font-medium">Generating code...</span>
                  </div>
                ) : files.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400 gap-2">
                    <FileText size={20} />
                    <span className="text-sm">No files generated yet</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                      Generated Files
                    </div>
                    {files.map((file) => (
                      <button
                        key={file.filename}
                        onClick={() => onFileSelect(file)}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          selectedFile?.filename === file.filename
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        <span className="block truncate">{file.filename}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Code Preview */}
            <div className="bg-gray-950 overflow-hidden flex flex-col">
              {selectedFile ? (
                <div className="flex flex-col h-full">
                  <div className="flex-none border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm px-4 py-2">
                    <div className="text-sm font-medium text-gray-400">{selectedFile.filename}</div>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <div className="p-4">
                      <CodePreview
                        code={selectedFile.content}
                        language={selectedFile.filename.split('.').pop() || 'plaintext'}
                      />
                    </div>
                  </div>
                </div>
              ) : files.length > 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <span className="text-sm">Select a file to view its contents</span>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <span className="text-sm">Generate code to see the preview</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gray-950">
            {hasGeneratedCode && files.length > 0 ? (
              <SandpackProvider
                theme={nightOwl}
                template="react-ts"
                files={sandpackFiles}
                customSetup={{
                  dependencies: {
                    "@types/react": "^18.0.0",
                    "@types/react-dom": "^18.0.0",
                    "react": "^18.0.0",
                    "react-dom": "^18.0.0",
                    "tailwindcss": "^3.0.0",
                    "@tailwindcss/postcss7-compat": "^2.2.17",
                    "postcss": "^8.4.31",
                    "autoprefixer": "^10.4.16"
                  }
                }}
                options={{
                  externalResources: [
                    "https://cdn.tailwindcss.com"
                  ]
                }}
              >
                <div className="h-full">
                  <SandpackPreview
                    showNavigator={false}
                    showRefreshButton={true}
                    className="h-full rounded-none"
                  />
                </div>
              </SandpackProvider>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <span className="text-sm">Generate code to see the preview</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}