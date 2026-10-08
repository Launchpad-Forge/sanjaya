import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Arrow } from '../../components/site/Brand';

export default function Join() {
  useEffect(() => {
    document.title = 'Join Sanjaya — Spatial Intelligence';
  }, []);

  return (
    <div className="py-16 page-container space-y-12 max-w-4xl mx-auto">
      <div className="space-y-4 text-center">
        <span className="font-mono text-xs text-trace uppercase tracking-widest">JOIN SANJAYA</span>
        <h1 className="text-4xl md:text-5xl font-bold">Get started with spatial intelligence.</h1>
        <p className="text-slate text-base max-w-xl mx-auto">
          Explore spatial perception, build inspection baselines, or contribute to open research.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
        <div className="p-8 rounded-xl bg-graphite border border-white/10 space-y-6 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-xs font-mono text-trace font-bold">OPTION 01 — INSTANT SCAN</span>
            <h3 className="text-2xl font-bold text-paper">Instant Guest Inspection</h3>
            <p className="text-xs text-slate leading-relaxed">
              Test spatial mapping immediately using your browser camera or video upload. No account required.
            </p>
          </div>
          <Link to="/inspect" className="button-primary justify-center text-center">
            Start Instant Inspection <Arrow />
          </Link>
        </div>

        <div className="p-8 rounded-xl bg-graphite border border-trace/30 space-y-6 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-xs font-mono text-trace font-bold">OPTION 02 — WORKSPACE ACCESS</span>
            <h3 className="text-2xl font-bold text-paper">Create Workspace Account</h3>
            <p className="text-xs text-slate leading-relaxed">
              Save baseline environments, track inspection history over time, and generate grounded PDF reports.
            </p>
          </div>
          <Link to="/register" className="button-secondary justify-center text-center">
            Create Free Account <Arrow diagonal />
          </Link>
        </div>
      </div>
    </div>
  );
}

