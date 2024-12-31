import React, { useState, useEffect } from 'react';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { Terminal } from 'lucide-react';
import { generateCodeFromPrompt } from './services/api';

interface GeneratedFile {
  filename: string;
  content: string;
}

function App() {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Update selected file when files change
  useEffect(() => {
    if (files.length > 0) {
      if (!selectedFile) {
        // No file selected, select the first one
        setSelectedFile(files[0]);
      } else {
        // Keep current selection if it still exists in files
        const updatedFile = files.find(f => f.filename === selectedFile.filename);
        if (updatedFile) {
          // Update content of selected file if it changed
          if (updatedFile.content !== selectedFile.content) {
            setSelectedFile(updatedFile);
          }
        } else {
          // Selected file no longer exists, select the first file
          setSelectedFile(files[0]);
        }
      }
    } else {
      setSelectedFile(null);
    }
  }, [files, selectedFile]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    
    setIsLoading(true);
    setFiles([]);
    setSelectedFile(null);

    try {
      await generateCodeFromPrompt(input, (updatedFiles) => {
        setFiles(updatedFiles);
      });
    } catch (error) {
      console.error('Failed to generate code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file: GeneratedFile) => {
    setSelectedFile(file);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 p-4">
        <div className="container mx-auto flex items-center gap-2">
          <Terminal className="text-blue-500" size={24} />
          <h1 className="text-xl font-bold">Code Generator</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 h-[calc(100vh-73px)]">
        <div className="grid grid-cols-[2fr,3fr] gap-4 h-full">
          <Editor 
            value={input} 
            onChange={setInput} 
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden">
              <Preview 
                files={files}
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;