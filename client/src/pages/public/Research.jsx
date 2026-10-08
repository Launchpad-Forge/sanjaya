import React from 'react';
import LongformLayout from '../../components/site/LongformLayout';
import { landing } from '../../content/landing';

export default function Research() {
  return (
    <LongformLayout title="Research" date="October 2026">
      <p className="text-body-large text-slate mb-8">
        Sanjaya is built on top of state-of-the-art open research in SLAM, scene graphs, and foundation models.
      </p>

      <h2 className="text-heading-2 mt-16 mb-8">Overview</h2>
      <p className="text-body mb-6">
        The core pipeline takes sequential RGB frames from any standard camera and jointly estimates the camera pose and dense scene geometry. It does this without LiDAR, active depth sensors, or GPS.
      </p>

      <h2 className="text-heading-2 mt-16 mb-8">Method</h2>
      <div className="my-8 w-full border border-slate/20 rounded-media p-8 bg-mist flex items-center justify-center">
        {/* Simple inline SVG pipeline diagram */}
        <svg viewBox="0 0 600 120" className="w-full max-w-full text-graphite" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="20" y="40" width="100" height="40" rx="8" />
          <text x="70" y="65" textAnchor="middle" stroke="none" fill="currentColor" className="text-small font-sans">RGB Frames</text>
          
          <path d="M 120 60 L 160 60" markerEnd="url(#arrow)" />
          
          <rect x="160" y="40" width="120" height="40" rx="8" />
          <text x="220" y="65" textAnchor="middle" stroke="none" fill="currentColor" className="text-small font-sans">Pose & Depth</text>

          <path d="M 280 60 L 320 60" markerEnd="url(#arrow)" />

          <rect x="320" y="40" width="120" height="40" rx="8" />
          <text x="380" y="65" textAnchor="middle" stroke="none" fill="currentColor" className="text-small font-sans">Scene Graph</text>

          <path d="M 440 60 L 480 60" markerEnd="url(#arrow)" />

          <rect x="480" y="40" width="100" height="40" rx="8" />
          <text x="530" y="65" textAnchor="middle" stroke="none" fill="currentColor" className="text-small font-sans">Query</text>

          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" stroke="none" fill="currentColor" />
            </marker>
          </defs>
        </svg>
      </div>

      <h2 className="text-heading-2 mt-16 mb-8">Foundations</h2>
      <div className="flex flex-col gap-8">
        {landing.research.list.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-2">
            <h3 className="text-heading-3">{item.title}</h3>
            <p className="text-small text-slate">Source: {item.source}</p>
            <p className="text-body text-graphite/80">
              We leverage this foundation to ensure robust mapping in unconstrained environments, adapting the model weights to streaming inference constraints.
            </p>
          </div>
        ))}
      </div>

      <h2 className="text-heading-2 mt-16 mb-8">Benchmarks</h2>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-body border-collapse">
          <thead>
            <tr className="border-b border-slate/20">
              <th className="py-4 font-semibold">Dataset</th>
              <th className="py-4 font-semibold">ATE (m)</th>
              <th className="py-4 font-semibold">Graph Recall</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate/10">
              <td className="py-4 text-graphite/80">Replica</td>
              <td className="py-4 text-slate">to be measured</td>
              <td className="py-4 text-slate">to be measured</td>
            </tr>
            <tr className="border-b border-slate/10">
              <td className="py-4 text-graphite/80">ScanNet</td>
              <td className="py-4 text-slate">to be measured</td>
              <td className="py-4 text-slate">to be measured</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-heading-2 mt-16 mb-8">Known Limitations</h2>
      <ul className="list-disc pl-6 text-body text-graphite/80 space-y-2">
        <li>Highly reflective or textureless surfaces (like blank white corridors) can degrade tracking.</li>
        <li>Rapid camera motion causes motion blur, reducing feature extraction quality.</li>
        <li>Absolute scale relies on learned priors unless a known metric reference is introduced.</li>
      </ul>

      <h2 className="text-heading-2 mt-16 mb-8">How to cite</h2>
      <div className="relative group mt-6">
        <pre className="bg-mist p-6 rounded-media text-small overflow-x-auto font-mono text-graphite/80 border border-slate/20">
{`@software{sanjaya2026,
  author = {Sanjaya Contributors},
  title = {Sanjaya: Live 3D Mental Maps from Monocular Video},
  year = {2026},
  url = {https://github.com/sanjaya/sanjaya}
}`}
        </pre>
        <button 
          className="absolute top-4 right-4 bg-paper border border-slate/20 px-3 py-1 rounded-pill text-small font-medium opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => navigator.clipboard.writeText(`@software{sanjaya2026,\n  author = {Sanjaya Contributors},\n  title = {Sanjaya: Live 3D Mental Maps from Monocular Video},\n  year = {2026},\n  url = {https://github.com/sanjaya/sanjaya}\n}`)}
        >
          Copy
        </button>
      </div>
    </LongformLayout>
  );
}
