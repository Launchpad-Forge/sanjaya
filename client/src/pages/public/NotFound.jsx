import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-void text-paper flex flex-col items-center justify-center p-side-mob text-center selection:bg-trace selection:text-void">
      <div className="w-16 h-16 rounded-full border-2 border-trace border-dashed animate-[spin_10s_linear_infinite] flex items-center justify-center mb-8">
        <div className="w-2 h-2 rounded-full bg-trace"></div>
      </div>
      <h1 className="text-display mb-6 tracking-tight">404</h1>
      <p className="text-body-large text-slate mb-12">
        This part of the map hasn't been explored yet.
      </p>
      <Link to="/" className="text-body font-medium bg-trace text-void px-8 py-3 rounded-pill hover:bg-trace/90 transition-colors">
        Back to home
      </Link>
    </div>
  );
}
