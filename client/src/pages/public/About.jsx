import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Arrow } from '../../components/site/Brand';
import { siteConfig } from '../../config/site';

export default function About() {
  useEffect(() => {
    document.title = 'About — Sanjaya Spatial Intelligence';
  }, []);

  return (
    <div className="py-16 page-container space-y-16">
      <div className="max-w-3xl space-y-4">
        <span className="font-mono text-xs text-trace uppercase tracking-widest">ORGANIZATION & MISSION</span>
        <h1 className="text-4xl md:text-5xl font-bold">Building reliable intelligence for machines operating in the physical world.</h1>
        <p className="text-slate text-base leading-relaxed">
          Sanjaya is an open research and spatial engineering project exploring how visual observations from ordinary cameras can be transformed into persistent spatial understanding.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/10">
        <div className="p-8 rounded-xl bg-graphite border border-white/10 space-y-3">
          <span className="text-xs font-mono text-trace font-bold">THE MISSION</span>
          <h3 className="text-xl font-bold text-paper">Open Spatial Intelligence</h3>
          <p className="text-xs text-slate leading-relaxed">
            Build open, reliable spatial intelligence for people and machines operating in physical environments, lowering the hardware barrier to spatial understanding.
          </p>
        </div>

        <div className="p-8 rounded-xl bg-graphite border border-white/10 space-y-3">
          <span className="text-xs font-mono text-trace font-bold">THE VISION</span>
          <h3 className="text-xl font-bold text-paper">Persistent Physical Memory</h3>
          <p className="text-xs text-slate leading-relaxed">
            A future where cameras, robots, sensors, and autonomous systems contribute to a shared, persistent understanding of physical spaces.
          </p>
        </div>
      </div>

      <div className="space-y-6 pt-8 border-t border-white/10">
        <h2 className="text-2xl font-bold text-paper">Core Principles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          <div className="p-5 rounded bg-graphite border border-white/5 space-y-2">
            <span className="text-trace">01</span>
            <div className="text-paper font-bold">Human in the Control Loop</div>
            <p className="text-slate">Designed for situational awareness and decision support — human operators make the final call.</p>
          </div>
          <div className="p-5 rounded bg-graphite border border-white/5 space-y-2">
            <span className="text-trace">02</span>
            <div className="text-paper font-bold">Research in the Open</div>
            <p className="text-slate">Apache-2.0 licensed code, transparent methods, open source benchmarks, and verifiable algorithms.</p>
          </div>
          <div className="p-5 rounded bg-graphite border border-white/5 space-y-2">
            <span className="text-trace">03</span>
            <div className="text-paper font-bold">Honest About Uncertainty</div>
            <p className="text-slate">Explicitly marking approximate scale, unmapped frontiers, and confidence metrics without fake certainty.</p>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-white/10 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-paper">Explore the repository</h3>
          <p className="text-xs text-slate">Inspect code, report issues, or contribute to the research.</p>
        </div>
        <div className="flex gap-4">
          <a href={siteConfig.githubUrl || "https://github.com/Launchpad-Forge/sanjaya"} target="_blank" rel="noreferrer" className="button-primary text-xs">
            View GitHub <Arrow />
          </a>
          <Link to="/join" className="button-secondary text-xs">
            Join Sanjaya <Arrow diagonal />
          </Link>
        </div>
      </div>
    </div>
  );
}