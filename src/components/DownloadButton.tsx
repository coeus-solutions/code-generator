import React from 'react';
import { Download } from 'lucide-react';

interface DownloadButtonProps {
  onDownload: () => void;
  disabled: boolean;
}

export function DownloadButton({ onDownload, disabled }: DownloadButtonProps) {
  return (
    <button
      onClick={onDownload}
      disabled={disabled}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Download size={18} />
      <span>Download</span>
    </button>
  );
}