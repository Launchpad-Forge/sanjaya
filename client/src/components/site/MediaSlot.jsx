import React from 'react';

export function MediaSlot({ name, className = "" }) {
  return (
    <div className={`w-full aspect-video bg-graphite rounded-media flex items-center justify-center border border-slate/20 ${className}`}>
      <span className="text-slate font-mono text-small">Media slot: {name}</span>
    </div>
  );
}

export function StatPair({ label, value }) {
  return (
    <div className="flex flex-col">
      <div className="text-display font-semibold tabular-nums text-graphite tracking-tight">
        {value === null ? <span className="text-slate/50 text-body">to be measured</span> : value}
      </div>
      <div className="text-slate text-body mt-2">{label}</div>
    </div>
  );
}
