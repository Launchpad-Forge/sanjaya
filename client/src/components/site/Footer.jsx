import React from 'react';
import { Link } from 'react-router-dom';
import { siteConfig } from '../../config/site';

export default function Footer() {
  return (
    <footer className="bg-graphite text-mist py-16 px-side-mob md:px-side-desk border-t border-white/10">
      <div className="max-w-site mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
        <div className="flex flex-col gap-4">
          <div className="font-mono text-sm tracking-widest text-trace font-bold mb-2">SANJAYA</div>
          <p className="text-xs text-slate max-w-xs leading-relaxed">
            Spatial intelligence for the physical world. Transforming observations into persistent spatial understanding.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-mono text-xs uppercase tracking-wider text-paper font-semibold mb-2">Platform</h4>
          <Link to="/technology" className="text-small text-slate hover:text-paper transition-colors">Technology</Link>
          <Link to="/inspection" className="text-small text-slate hover:text-paper transition-colors">Inspection</Link>
          <Link to="/research" className="text-small text-slate hover:text-paper transition-colors">Research</Link>
          <Link to="/developers" className="text-small text-slate hover:text-paper transition-colors">Developers</Link>
          <Link to="/docs" className="text-small text-slate hover:text-paper transition-colors">Docs</Link>
          <a href={siteConfig.githubUrl || "https://github.com/Launchpad-Forge/sanjaya"} target="_blank" rel="noreferrer" className="text-small text-slate hover:text-paper transition-colors">GitHub ↗</a>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-mono text-xs uppercase tracking-wider text-paper font-semibold mb-2">Organization</h4>
          <Link to="/impact" className="text-small text-slate hover:text-paper transition-colors">Impact</Link>
          <Link to="/about" className="text-small text-slate hover:text-paper transition-colors">About</Link>
          <Link to="/responsible-use" className="text-small text-slate hover:text-paper transition-colors">Responsible Use</Link>
          <Link to="/join" className="text-small text-slate hover:text-paper transition-colors">Join Sanjaya</Link>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-mono text-xs uppercase tracking-wider text-paper font-semibold mb-2">Legal & Security</h4>
          <Link to="/privacy" className="text-small text-slate hover:text-paper transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="text-small text-slate hover:text-paper transition-colors">Terms of Service</Link>
          <Link to="/security" className="text-small text-slate hover:text-paper transition-colors">Security Disclosure</Link>
          <Link to="/accessibility" className="text-small text-slate hover:text-paper transition-colors">Accessibility</Link>
        </div>
      </div>
      <div className="max-w-site mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate">
        <span>Open research & spatial engineering. Licensed under Apache-2.0.</span>
        <span>© {new Date().getFullYear()} SANJAYA Project</span>
      </div>
    </footer>
  );
}
