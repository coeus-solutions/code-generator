// Types for API responses
interface FinalResponse {
  final: {
    description: string;
    code: string;
  }
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
    mode: 'cors',
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
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

      for (const line of lines) {
        if (line.trim() === ':ping') continue;
        if (!line.startsWith('data:')) continue;

        try {
          const jsonStr = line.slice(5).trim(); // Remove 'data:' prefix
          if (!jsonStr) continue;

          const data: FinalResponse = JSON.parse(jsonStr);
          
          if (!data.final?.code) {
            continue;
          }

          // Parse the code string which contains a JSON object with filenames and contents
          const filesObj = JSON.parse(data.final.code);
          
          // Convert the object into our GeneratedFile[] format
          const files: GeneratedFile[] = Object.entries(filesObj).map(([filename, content]) => ({
            filename,
            content: typeof content === 'string' ? content : JSON.stringify(content, null, 2)
          }));

          // Call the progress callback with the files
          onProgress?.(files);

          return { files };
        } catch (error) {
          console.error('Failed to parse message:', error);
          continue;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  throw new Error('Stream ended without receiving valid code');
}