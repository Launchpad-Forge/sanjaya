import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import { Arrow } from '../../components/site/Brand';

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-xl bg-graphite border border-white/10">
        <div>
          <span className="font-mono text-xs text-trace uppercase tracking-wider block mb-1">SANJAYA SPATIAL WORKSPACE</span>
          <h1 className="text-2xl md:text-3xl font-bold text-paper">Persistent Spatial Intelligence</h1>
          <p className="text-xs text-slate mt-1 max-w-xl">
            Scan physical environments, maintain baseline spatial twins, and detect 3D changes across visits.
          </p>
        </div>
        <Link to="/inspect" className="button-primary shrink-0">
          Start New Inspection <Arrow />
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-graphite/40 border border-white/10 p-6 rounded-xl space-y-2">
          <span className="text-xs font-mono text-slate">ACTIVE BASELINE TWINS</span>
          <div className="text-3xl font-bold font-mono text-paper">1</div>
          <p className="text-[11px] text-slate">Local baseline scan saved</p>
        </div>
        <div className="bg-graphite/40 border border-white/10 p-6 rounded-xl space-y-2">
          <span className="text-xs font-mono text-slate">INSPECTION RUNS</span>
          <div className="text-3xl font-bold font-mono text-paper">0</div>
          <p className="text-[11px] text-slate">Re-scans processed</p>
        </div>
        <div className="bg-graphite/40 border border-white/10 p-6 rounded-xl space-y-2">
          <span className="text-xs font-mono text-slate">SPATIAL ENGINE STATUS</span>
          <div className="pt-1">
            <StatusBadge status="AVAILABLE" label="ENGINE ONLINE" />
          </div>
          <p className="text-[11px] text-slate mt-2">Gradio ZeroGPU Engine Active</p>
        </div>
      </div>

      {/* Quick Actions & Recent Inspections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-graphite/40 border border-white/10 p-6 rounded-xl space-y-4">
          <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-paper">Recent Inspections</h2>
          
          <div className="p-6 rounded-lg bg-void border border-dashed border-white/10 text-center space-y-3">
            <p className="text-xs text-slate">No recent inspections recorded yet.</p>
            <p className="text-[11px] text-slate/70">Scan an environment to create your first spatial baseline.</p>
            <Link to="/inspect" className="button-secondary text-xs inline-flex">
              Start Inspection <Arrow />
            </Link>
          </div>
        </div>

        <div className="bg-graphite/40 border border-white/10 p-6 rounded-xl space-y-4">
          <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-paper">System Pipeline Capabilities</h2>
          
          <div className="space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between p-3 rounded bg-void border border-white/5">
              <span>Monocular 3D Reconstruction</span>
              <StatusBadge status="AVAILABLE" />
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-void border border-white/5">
              <span>Metric Scale Recovery</span>
              <StatusBadge status="AVAILABLE" />
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-void border border-white/5">
              <span>OWLv2 Object Lifting</span>
              <StatusBadge status="AVAILABLE" />
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-void border border-white/5">
              <span>Temporal Change Localization</span>
              <StatusBadge status="BUILDING" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
