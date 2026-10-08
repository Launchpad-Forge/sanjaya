import React from 'react';
import { Link } from 'react-router-dom';
import { siteConfig } from '../../config/site';

export default function Footer() {
  return (
    <footer className="bg-mist text-graphite py-16 px-side-mob md:px-side-desk">
      <div className="max-w-site mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
        <div className="flex flex-col gap-4">
          <h4 className="font-semibold text-small mb-2">Product</h4>
          <Link to="/try" className="text-small text-slate hover:text-graphite">Try</Link>
          <Link to="/research" className="text-small text-slate hover:text-graphite">Research</Link>
          <Link to="/docs" className="text-small text-slate hover:text-graphite">Docs</Link>
        </div>
        <div className="flex flex-col gap-4">
          <h4 className="font-semibold text-small mb-2">Community</h4>
          <Link to="/contribute" className="text-small text-slate hover:text-graphite">Contribute</Link>
          <a href={siteConfig.githubUrl} target="_blank" rel="noreferrer" className="text-small text-slate hover:text-graphite">GitHub</a>
          <Link to="/community" className="text-small text-slate hover:text-graphite">Ideas</Link>
        </div>
        <div className="flex flex-col gap-4 col-span-2 md:col-span-2">
          <h4 className="font-semibold text-small mb-2">Policies</h4>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/responsible-use" className="text-small text-slate hover:text-graphite">Responsible use</Link>
            <Link to="/privacy" className="text-small text-slate hover:text-graphite">Privacy</Link>
            <Link to="/terms" className="text-small text-slate hover:text-graphite">Terms</Link>
            <Link to="/security" className="text-small text-slate hover:text-graphite">Security</Link>
            <Link to="/accessibility" className="text-small text-slate hover:text-graphite">Accessibility</Link>
          </div>
        </div>
      </div>
      <div className="max-w-site mx-auto pt-8 border-t border-slate/20 flex flex-col md:flex-row justify-between items-center gap-4 text-small text-slate">
        <span>Sanjaya — an open research project. Apache-2.0.</span>
      </div>
    </footer>
  );
}
