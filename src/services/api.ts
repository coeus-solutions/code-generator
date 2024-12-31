// Types for API responses
interface CodeChunkResponse {
  code: string;
  file: string;
}

interface GenerateCodeRequest {
  description: string;
}

interface GeneratedFile {
  filename: string;
  content: string;
}

interface GenerationResponse {
  files: GeneratedFile[];
  preview_url?: string;
}

const API_BASE_URL = 'http://localhost:8000';

export async function generateCodeFromPrompt(
  prompt: string, 
  onProgress?: (files: GeneratedFile[]) => void
): Promise<GenerationResponse> {
  const response = await fetch(`${API_BASE_URL}/generate-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify({ description: prompt }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.detail || `Failed to generate code: ${response.statusText}`
    );
  }

  if (!response.body) {
    throw new Error('No response body received');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let files: Map<string, string> = new Map();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

        try {
          const jsonStr = trimmedLine.slice(5).trim(); // Remove 'data:' prefix and whitespace
          if (!jsonStr) continue; // Skip empty data lines
          
          const chunk: CodeChunkResponse = JSON.parse(jsonStr);
          
          // Update or create file content
          const currentContent = files.get(chunk.file) || '';
          files.set(chunk.file, currentContent + chunk.code);

          // Convert Map to array of files for the callback
          const currentFiles: GeneratedFile[] = Array.from(files.entries()).map(
            ([filename, content]) => ({
              filename,
              content
            })
          );

          onProgress?.(currentFiles);
        } catch (error) {
          console.error('Failed to parse chunk:', error, 'Line:', trimmedLine);
          throw new Error('Failed to parse server response');
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Convert final Map to array of files for the response
  const finalFiles: GeneratedFile[] = Array.from(files.entries()).map(
    ([filename, content]) => ({
      filename,
      content
    })
  );

  return { files: finalFiles };
}