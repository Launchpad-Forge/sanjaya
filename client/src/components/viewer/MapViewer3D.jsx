import React from 'react';

export default function MapViewer3D({ url, height = '400px' }) {
  return (
    <div 
      className="w-full rounded-xl bg-black border border-white/10 relative overflow-hidden flex flex-col items-center justify-center p-6 text-center"
      style={{ minHeight: height }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-trace/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Visual Spatial Viewer Grid / Mock Mesh */}
      <div className="w-24 h-24 rounded-full border border-trace/30 flex items-center justify-center mb-4 relative animate-pulse">
        <div className="w-16 h-16 rounded-full border border-trace/60 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-trace" />
        </div>
        <span className="absolute top-0 text-[10px] font-mono text-trace font-bold uppercase tracking-widest bg-void px-2 py-0.5 rounded border border-trace/20">
          3D MODEL
        </span>
      </div>

      <h4 className="text-sm font-bold font-mono text-paper mb-1">
        3D Spatial Scene Cloud
      </h4>
      
      <p className="text-xs font-mono text-slate max-w-sm mb-4">
        {url ? `Loaded source: ${url}` : 'Origin = first camera position, +Y up, -Z initial forward (metres)'}
      </p>

      <div className="flex items-center gap-4 text-xs font-mono text-slate border-t border-white/10 pt-4">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Metric Scale: ON</span>
        <span>•</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-trace" /> Coordinate Frame: glTF</span>
      </div>
    </div>
  );
}
