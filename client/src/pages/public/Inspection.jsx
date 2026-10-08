import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import SpatialPreview from '../../components/site/SpatialPreview';
import { Arrow } from '../../components/site/Brand';

export default function Inspection() {
  useEffect(() => {
    document.title = 'Sanjaya Inspection — Spatial Visual Intelligence';
  }, []);

  return (
    <div className="py-16 page-container space-y-16">
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <span className="font-mono text-xs text-trace uppercase tracking-widest">PRODUCT SPECIFICATION</span>
        <h1 className="text-4xl md:text-5xl font-bold">Sanjaya Inspection</h1>
        <p className="text-slate text-lg leading-relaxed">
          Scan once. Build the world. Detect what changed.
        </p>
      </div>

      {/* Hero Visual */}
      <div className="rounded-xl border border-white/10 overflow-hidden bg-graphite p-2">
        <SpatialPreview />
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-white/10">
        <div className="p-6 rounded-lg bg-graphite border border-white/5 space-y-3">
          <span className="font-mono text-xs text-trace">01. BASELINE SCAN</span>
          <h3 className="text-lg font-bold text-paper">Create Baseline Spatial Twin</h3>
          <p className="text-xs text-slate leading-relaxed">
            Record a 20-30 second walkthrough of an environment using a smartphone camera. Sanjaya extracts 3D geometry, metric scale, and object spatial coordinates.
          </p>
        </div>

        <div className="p-6 rounded-lg bg-graphite border border-white/5 space-y-3">
          <span className="font-mono text-xs text-trace">02. RE-SCAN ALIGNMENT</span>
          <h3 className="text-lg font-bold text-paper">Automatic Spatial Registration</h3>
          <p className="text-xs text-slate leading-relaxed">
            Walk the site at a later date. Sanjaya automatically registers and aligns the new 3D observation into the baseline coordinate frame.
          </p>
        </div>

        <div className="p-6 rounded-lg bg-graphite border border-white/5 space-y-3">
          <span className="font-mono text-xs text-trace">03. 3D CHANGE REPORTING</span>
          <h3 className="text-lg font-bold text-paper">Grounded Evidence Reports</h3>
          <p className="text-xs text-slate leading-relaxed">
            Identify missing equipment, moved objects, or new structural hazards with 3D markers and AI-generated evidential summaries.
          </p>
        </div>
      </div>

      {/* Application CTA */}
      <div className="p-8 rounded-xl bg-graphite border border-trace/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-mono text-trace font-bold">READY TO RUN AN INSPECTION?</span>
          <h3 className="text-xl font-bold text-paper">Start your instant guest inspection scan</h3>
          <p className="text-xs text-slate mt-1">No special equipment required. Works directly in browser.</p>
        </div>
        <Link to="/inspect" className="button-primary shrink-0">
          Start Inspection <Arrow />
        </Link>
      </div>
    </div>
  );
}