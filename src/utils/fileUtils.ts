// Utility functions for file operations
export function downloadAsZip(files: { name: string; content: string }[]): void {
  // For now, we'll just download a single file
  // In a real implementation, we would use a library like JSZip to create a zip file
  const file = files[0];
  const blob = new Blob([file.content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}