'use client';

import React from 'react';

type Tab = 'preview' | 'code';

interface TopBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onDownload: () => void;
  hasContent: boolean;
}

export default function TopBar({ activeTab, onTabChange, onDownload, hasContent }: TopBarProps) {
  return (
    <div className="flex items-center justify-between h-11 px-4 bg-[#0a0a0a] border-b border-zinc-800 select-none shrink-0">
      {/* Left: Tabs */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onTabChange('preview')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'preview'
              ? 'text-white bg-zinc-800'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
          }`}
        >
          {activeTab === 'preview' && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}
          Preview
        </button>
        <button
          onClick={() => onTabChange('code')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'code'
              ? 'text-white bg-zinc-800'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
          }`}
        >
          {activeTab === 'code' && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}
          Code
        </button>
      </div>

      {/* Right: Download */}
      {hasContent && (
        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download .zip
        </button>
      )}
    </div>
  );
}
