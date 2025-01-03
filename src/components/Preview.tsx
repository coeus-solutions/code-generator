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
      const baseHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <style>
      body {
        margin: 0;
        padding: 1rem;
        background: white;
      }
      #root {
        height: 100%;
      }
      label {
        display: block;
        margin-top: 10px;
      }
      input, textarea {
        display: block;
        width: 100%;
        margin: 10px 0;
        padding: 8px;
      }
      button {
        background: #4CAF50;
        color: white;
        padding: 10px 20px;
        border: none;
        cursor: pointer;
      }
      form {
        margin: 20px;
        padding: 20px;
      }
      h1 {
        color: #333;
        margin-bottom: 20px;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
      // Initialize global objects
      window.components = {};
      window.React = React;

      // Create a simple createElement wrapper
      const e = React.createElement;
      
      // Make React hooks globally available
      const { useState } = React;

      // Error handler
      window.onerror = function(msg, url, line, col, error) {
        console.error('Error:', msg, 'Line:', line, 'Error:', error);
        document.getElementById('root').innerHTML = '<div style="color: red; padding: 1rem;">Error: ' + msg + '</div>';
        return false;
      };

      // Component registration helper
      window.registerComponent = function(name, component) {
        console.log('Registering component:', name, typeof component);
        window.components[name] = component;
        console.log('Registered component value:', window.components[name]);
        return component;
      };
    </script>
  </body>
</html>`;

      // Convert TypeScript/TSX to plain JavaScript
      const scripts = files
        .filter(f => f.filename.endsWith('.tsx') || f.filename.endsWith('.ts'))
        .sort((a, b) => {
          // Process files in specific order: types -> components -> App -> main
          const order = {
            'types': 1,
            'components': 2,
            'src/App.tsx': 3,
            'main.tsx': 4
          };
          const aOrder = Object.entries(order).find(([key]) => a.filename.includes(key))?.[1] || 99;
          const bOrder = Object.entries(order).find(([key]) => b.filename.includes(key))?.[1] || 99;
          return aOrder - bOrder;
        })
        .map((file, index) => {
          console.log('Processing file:', file.filename);
          
          // Simple JSX-like transformation
          let content = file.content
            // Remove type annotations
            .replace(/:\s*[A-Za-z<>[\]|&{}]+/g, '')
            // Remove interface declarations
            .replace(/interface\s+\w+\s*\{[^}]*\}/g, '')
            // Remove type declarations
            .replace(/type\s+\w+\s*=\s*[^;]+;/g, '')
            // Convert imports
            .replace(/import\s+{\s*([^}]+)}\s+from\s+['"]react['"]/g, '')
            .replace(/import\s+React\s+from\s+['"]react['"]/g, '')
            .replace(/import\s+(\w+)\s+from\s+['"]\.\/?components\/([^'"]+)['"]/g, 'const $1 = window.components["$2"]')
            .replace(/import\s+(\w+)\s+from\s+['"]\.\/components\/([^'"]+)['"]/g, 'const $1 = window.components["$2"]')
            .replace(/import\s+(\w+)\s+from\s+['"]\.\/([^'"]+)['"]/g, 'const $1 = window.components["$2"]')
            .replace(/import\s+['"]\.\/index\.css['"]/g, '')
            // Convert exports
            .replace(/export\s+default\s+function\s+(\w+)/g, (match, name) => {
              return `const ${name} = function ${name}`;
            })
            .replace(/export\s+default\s+class\s+(\w+)/g, (match, name) => {
              return `const ${name} = class ${name}`;
            })
            .replace(/export\s+default\s+const\s+(\w+)\s*=/g, (match, name) => {
              return `const ${name} =`;
            })
            .replace(/export\s+const\s+(\w+)\s*=/g, (match, name) => {
              return `const ${name} =`;
            })
            .replace(/export\s+function\s+(\w+)/g, (match, name) => {
              return `const ${name} = function ${name}`;
            })
            .replace(/export\s+default\s+(\w+)/g, (match, name) => {
              return `window.registerComponent("${name}", ${name})`;
            })
            // Transform JSX-like syntax to React.createElement calls
            .replace(/</g, 'e(')
            .replace(/>/g, ')')
            // Handle self-closing tags
            .replace(/e\((\w+)([^)]*?)\/\)/g, 'e($1$2null)')
            // Transform props
            .replace(/(\w+)=/g, '$1:')
            // Handle string props
            .replace(/:"([^"]+)"/g, ':"$1"')
            // Handle expression props
            .replace(/:\{([^}]+)\}/g, ':$1')
            // Add className handling
            .replace(/className:["']([^"']+)["']/g, (match, classes) => {
              return `className:"${classes}"`;
            });

          // Add component registration for App.tsx
          if (file.filename === 'src/App.tsx') {
            content = `
              try {
                ${content}
                // Ensure App component is registered
                if (typeof App !== 'undefined') {
                  window.registerComponent('App', App);
                  console.log('Successfully registered App component');
                } else {
                  console.error('App component was not defined');
                }
              } catch (error) {
                console.error('Error in App.tsx:', error);
              }
            `;
          }

          const fileName = file.filename.replace(/\.[^/.]+$/, "").split('/').pop();
          
          return `
            <script>
              try {
                (function() {
                  console.log('Processing ${fileName}');
                  ${content}
                  console.log('Components after processing ${fileName}:', Object.keys(window.components));
                })();
              } catch (error) {
                console.error('Error in ${fileName}:', error);
                console.error('Content that caused error:', error.message);
              }
            </script>
          `;
        })
        .join('\n');

      // Add initialization script
      const initScript = `
        <script>
          try {
            // Initialize the app
            const App = window.components['App'];
            console.log('Found App component:', App);
            
            if (!App) {
              throw new Error('App component not found. Available components: ' + Object.keys(window.components).join(', '));
            }

            const container = document.getElementById('root');
            console.log('Found root element:', container);
            
            const root = ReactDOM.createRoot(container);
            console.log('Created React root');
            
            root.render(e(App));
            console.log('App rendered successfully');
          } catch (error) {
            console.error('Error initializing app:', error);
            document.getElementById('root').innerHTML = 
              '<div style="color: red; padding: 1rem;">Error: ' + error.message + '</div>';
          }
        </script>
      `;

      // Add CSS files
      const styles = files
        .filter(f => f.filename.endsWith('.css'))
        .map(f => `<style>${f.content}</style>`)
        .join('\n');

      // Update the title in the generated index.html file
      const updatedFiles = files.map(file => {
        if (file.filename === 'public/index.html') {
          return {
            ...file,
            content: file.content.replace(
              /<title>.*?<\/title>/,
              '<title>Code Generator</title>'
            )
          };
        }
        return file;
      });

      // Update the files prop with the new content
      files = updatedFiles;

      const fullHtml = baseHtml.replace(
        '</body>',
        `${styles}\n${scripts}\n${initScript}\n</body>`
      );

      setPreviewContent(fullHtml);
      
      // Debug the content being set
      console.log('Files being processed:', files.map(f => f.filename));
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

        // Add message listener to catch errors from iframe
        iframe.contentWindow?.addEventListener('error', (event) => {
          console.error('Preview error:', event.error);
        });
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