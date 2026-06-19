'use client';

import React, { useState, useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import type { FileMap } from '@/lib/fileParser';
import { getFileExtension, getFileIconColor } from '@/lib/fileParser';

interface CodeEditorProps {
  files: FileMap;
}

function getLanguage(filename: string): string {
  const ext = getFileExtension(filename);
  switch (ext) {
    case 'html': return 'markup';
    case 'css': return 'css';
    case 'js': return 'javascript';
    case 'ts': return 'javascript';
    default: return 'markup';
  }
}

function FileIcon({ filename }: { filename: string }) {
  const color = getFileIconColor(filename);
  const ext = getFileExtension(filename);

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <rect x="2" y="1" width="12" height="14" rx="1.5" stroke={color} strokeWidth="1.2" fill="none" />
      <text x="8" y="10.5" textAnchor="middle" fill={color} fontSize="5" fontWeight="bold" fontFamily="monospace">
        {ext.toUpperCase().slice(0, 3)}
      </text>
    </svg>
  );
}

export default function CodeEditor({ files }: CodeEditorProps) {
  const filenames = Object.keys(files);
  const [activeFile, setActiveFile] = useState(filenames[0] || '');
  const codeRef = useRef<HTMLElement>(null);

  // Reset active file when files change
  useEffect(() => {
    if (filenames.length > 0 && !filenames.includes(activeFile)) {
      setActiveFile(filenames[0]);
    }
  }, [filenames, activeFile]);

  // Highlight code when active file or content changes
  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [activeFile, files]);

  const activeContent = files[activeFile] || '';
  const language = getLanguage(activeFile);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* File Explorer Sidebar */}
      <div className="w-52 shrink-0 bg-[#0d0d0d] border-r border-zinc-800 overflow-y-auto">
        <div className="px-3 py-2.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
          File explorer
        </div>
        <div className="space-y-0.5 px-1.5 pb-4">
          {filenames.map((name) => (
            <button
              key={name}
              onClick={() => setActiveFile(name)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[13px] transition-colors text-left ${
                activeFile === name
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
            >
              <FileIcon filename={name} />
              <span className="truncate">{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Code Viewer */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
        {/* File Tabs */}
        <div className="flex items-center h-9 bg-[#0d0d0d] border-b border-zinc-800 px-2 gap-0.5 shrink-0">
          {filenames.map((name) => (
            <button
              key={name}
              onClick={() => setActiveFile(name)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeFile === name
                  ? 'bg-[#0a0a0a] text-white border border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-400'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getFileIconColor(name) }}
              />
              {name}
            </button>
          ))}
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-0">
          <div className="flex min-h-full">
            {/* Line Numbers */}
            <div className="shrink-0 py-4 px-3 text-right select-none border-r border-zinc-800/50">
              {activeContent.split('\n').map((_, i) => (
                <div key={i} className="text-[12px] leading-[20px] text-zinc-600 font-mono">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Highlighted Code */}
            <pre className="flex-1 py-4 px-4 m-0 bg-transparent overflow-x-auto">
              <code
                ref={codeRef}
                className={`language-${language}`}
                style={{ fontSize: '13px', lineHeight: '20px', fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' }}
              >
                {activeContent}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
