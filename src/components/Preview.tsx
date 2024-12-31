import React, { useState, useEffect, useRef } from 'react';
import { PreviewTabs } from './PreviewTabs';
import { CodePreview } from './CodePreview';
import { FileText, Loader, Download } from 'lucide-react';
import JSZip from 'jszip';

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
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  const [previewContent, setPreviewContent] = useState<string>('');
  const statusLogRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hasGeneratedCode = files.length > 0;

  const handleDownload = async () => {
    const zip = new JSZip();
    
    // Add all files to the zip
    files.forEach(file => {
      if (file.filename !== 'status.log') {
        zip.file(file.filename, file.content);
      }
    });
    
    // Generate the zip file
    const content = await zip.generateAsync({ type: "blob" });
    
    // Create download link and trigger download
    const url = window.URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-code.zip';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Update preview content when files change
  useEffect(() => {
    if (activeTab === 'preview' && files.length > 0) {
      const htmlFile = files.find(f => f.filename.endsWith('.html')) || {
        content: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <title>Preview</title>
    <style>
      body {
        margin: 0;
        padding: 1rem;
        background: white;
      }
      #root {
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`
      };

      // Combine all TypeScript/JavaScript files into a single script
      const allScripts = files
        .filter(f => f.filename.endsWith('.tsx') || f.filename.endsWith('.ts'))
        .map(f => f.content)
        .join('\n\n');

      // Add all CSS files
      const styleTags = files
        .filter(f => f.filename.endsWith('.css'))
        .map(f => `
          <style>
            ${f.content}
          </style>
        `)
        .join('\n');

      const fullHtml = htmlFile.content.replace(
        '</body>',
        `${styleTags}
         <script type="text/babel">
           ${allScripts}
           
           // Initialize the app
           const root = ReactDOM.createRoot(document.getElementById('root'));
           root.render(
             React.createElement(React.StrictMode, null,
               React.createElement(App)
             )
           );
         </script>
         </body>`
      );

      setPreviewContent(fullHtml);
    }
  }, [files, activeTab]);

  // Update iframe content when preview content changes
  useEffect(() => {
    if (iframeRef.current && previewContent) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(previewContent);
        doc.close();
      }
    }
  }, [previewContent]);

  // Status message handling (unchanged)
  useEffect(() => {
    const statusLog = files.find(f => f.filename === 'status.log');
    if (statusLog) {
      try {
        const content = JSON.parse(statusLog.content);
        if (content.code) {
          setStatusMessages(prev => [...prev, content.code]);
          if (statusLogRef.current) {
            statusLogRef.current.scrollTop = statusLogRef.current.scrollHeight;
          }
        }
      } catch {
        const messages = statusLog.content.split('\n').filter(msg => msg.trim());
        setStatusMessages(messages);
      }
    }
  }, [files]);

  useEffect(() => {
    if (isLoading) {
      setStatusMessages([]);
    }
  }, [isLoading]);

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden">
      <div className="flex justify-between items-center border-b border-gray-800 bg-gray-950">
        <PreviewTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          previewAvailable={hasGeneratedCode}
        />
        {files.length > 0 && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 mr-2 text-sm font-medium text-gray-400 hover:text-gray-300 transition-colors"
          >
            <Download size={16} />
            Download
          </button>
        )}
      </div>
      
      <div className="flex-1 min-h-0 relative">
        {activeTab === 'code' ? (
          <div className="absolute inset-0 grid grid-cols-[220px,1fr]">
            {/* File List - unchanged */}
            <div className="border-r border-gray-800 overflow-y-auto bg-gray-900">
              <div className="p-2 h-full">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <div className="animate-spin mb-4">
                      <Loader size={24} />
                    </div>
                    <div 
                      ref={statusLogRef}
                      className="w-full px-4 py-2 text-sm text-gray-400 max-h-[300px] overflow-y-auto space-y-1 bg-gray-800/50 rounded"
                    >
                      {statusMessages.map((msg, i) => (
                        <div key={i} className="font-mono whitespace-pre-wrap break-words">{msg}</div>
                      ))}
                    </div>
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
                    {files
                      .filter(file => file.filename !== 'status.log')
                      .sort((a, b) => a.filename.localeCompare(b.filename))
                      .map((file) => (
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

            {/* Code Preview - unchanged */}
            <div className="bg-gray-950 overflow-hidden flex flex-col">
              {isLoading && !selectedFile ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                  <div className="animate-spin">
                    <Loader size={24} />
                  </div>
                </div>
              ) : selectedFile ? (
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
              <div className="w-full h-full">
                <iframe
                  ref={iframeRef}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-modals allow-popups allow-forms allow-same-origin"
                  title="Preview"
                />
              </div>
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