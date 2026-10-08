import React from 'react';

export default function StatusBadge({ status, label }) {
  const norm = (status || label || '').toLowerCase();
  
  if (norm.includes('available') || norm.includes('current') || norm.includes('working') || norm.includes('solid')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        {label || 'AVAILABLE'}
      </span>
    );
  }

  if (norm.includes('building') || norm.includes('active') || norm.includes('progress')) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full border border-amber-400 bg-transparent" />
        {label || 'BUILDING'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono bg-slate-500/10 text-slate-400 border border-slate-500/20">
      <span className="w-1.5 h-1.5 rounded-full border border-slate-400" />
      {label || 'PLANNED'}
    </span>
  );
}

