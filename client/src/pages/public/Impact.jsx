import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Arrow } from '../../components/site/Brand';

export default function Impact() {
  useEffect(() => {
    document.title = 'Impact — Sanjaya Spatial Intelligence';
  }, []);

  return (
    <div className="py-16 page-container space-y-16">
      <div className="max-w-3xl space-y-4">
        <span className="font-mono text-xs text-trace uppercase tracking-widest">PHYSICAL-WORLD IMPACT</span>
        <h1 className="text-4xl md:text-5xl font-bold">Spatial intelligence shouldn't require a specialized robot.</h1>
        <p className="text-slate text-base leading-relaxed">
          Sanjaya is not intended to replace every specialized sensing system. It explores a lower-friction spatial intelligence layer for situations where ordinary visual observations are sufficient.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/10">
        <div className="p-6 rounded-xl bg-graphite border border-white/10 space-y-4">
          <span className="font-mono text-xs text-trace">USE CASE 01</span>
          <h3 className="text-xl font-bold text-paper">Disaster Response & Search Units</h3>
          <p className="text-xs text-slate leading-relaxed">
            In structural collapses or post-hazard sites where GPS is unviable, an operator or drone with a regular camera can map unexplored void bounds, locate victims, and identify blocked exits within minutes.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-graphite border border-white/10 space-y-4">
          <span className="font-mono text-xs text-trace">USE CASE 02</span>
          <h3 className="text-xl font-bold text-paper">Industrial Inspection & Safety Compliance</h3>
          <p className="text-xs text-slate leading-relaxed">
            Facilities teams can run weekly walkthroughs to automatically flag missing fire extinguishers, blocked emergency routes, or misplaced hazardous materials compared against a baseline twin.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-graphite border border-white/10 space-y-4">
          <span className="font-mono text-xs text-trace">USE CASE 03</span>
          <h3 className="text-xl font-bold text-paper">Tunnels & Underground Mining</h3>
          <p className="text-xs text-slate leading-relaxed">
            Enclosed metal and sub-surface structures block satellite positioning. Sanjaya provides metric length, corridor branch topology, and place graph memory over low-bandwidth links.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-graphite border border-white/10 space-y-4">
          <span className="font-mono text-xs text-trace">USE CASE 04</span>
          <h3 className="text-xl font-bold text-paper">Embodied Robotics & Drones</h3>
          <p className="text-xs text-slate leading-relaxed">
            Legged robots and autonomous aerial vehicles require high-level spatial graphs (not just raw point clouds) to navigate rooms, avoid unseen gaps, and execute spatial query tasks.
          </p>
        </div>
      </div>

      <div className="pt-8 border-t border-white/10 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-paper">Our Responsible Use Commitment</h3>
          <p className="text-xs text-slate">Sanjaya is designed strictly for situational awareness, inspection, and research.</p>
        </div>
        <Link to="/responsible-use" className="button-secondary text-xs">
          Read Responsible Use Policy <Arrow diagonal />
        </Link>
      </div>
    </div>
  );
}