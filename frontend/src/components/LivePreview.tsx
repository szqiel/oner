'use client';

import React from 'react';

interface LivePreviewProps {
  htmlContent: string;
}

export default function LivePreview({ htmlContent }: LivePreviewProps) {
  // If no content, show a placeholder
  if (!htmlContent) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-center opacity-50">
          <p className="text-lg font-mono">Awaiting Swarm Initialization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-white">
      <iframe
        className="w-full h-full border-none"
        srcDoc={htmlContent}
        title="Live Preview"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
