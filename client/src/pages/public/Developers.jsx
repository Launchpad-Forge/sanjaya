import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import { Arrow } from '../../components/site/Brand';

export default function Developers() {
  useEffect(() => {
    document.title = 'Developers — Sanjaya Spatial SDK & Platform';
  }, []);

  return (
    <div className="py-16 page-container space-y-16">
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <span className="font-mono text-xs text-trace uppercase tracking-widest">DEVELOPER PLATFORM</span>
        <h1 className="text-4xl md:text-5xl font-bold">Give your systems spatial memory.</h1>
        <p className="text-slate text-base leading-relaxed">
          Embed persistent spatial intelligence into autonomous robotics, camera streams, and inspection pipelines.
        </p>
      </div>

      {/* Code Snippet Example (API Roadmap) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate">
          <span>API DIRECTION / ROADMAP EXAMPLE</span>
          <span className="text-amber-400">PLANNED SDK ABSTRACTION</span>
        </div>
        <div className="p-6 rounded-xl bg-graphite border border-white/10 font-mono text-xs text-paper overflow-x-auto leading-relaxed">
          <pre>{`import { SanjayaClient } from '@sanjaya/sdk';

const sanjaya = new SanjayaClient({ apiKey: process.env.SANJAYA_API_KEY });

// Connect an observation stream
const session = await sanjaya.sessions.create({
  source: 'rtsp://camera.local/stream1',
  sceneType: 'Indoor',
  mode: 'INSPECTION'
});

// Subscribe to 3D spatial events
session.on('object_detected', (event) => {
  console.log(\`Detected \${event.label} at 3D coords (\${event.x}, \${event.y}, \${event.z})\`);
});

session.on('change_detected', (change) => {
  console.warn(\`Spatial change localized: \${change.description} with confidence \${change.confidence}\`);
});`}</pre>
        </div>
      </div>

      {/* Source Adapters Grid */}
      <div className="space-y-6 pt-8 border-t border-white/10">
        <h2 className="text-2xl font-bold text-paper">Source Adapters & Integrations</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          <div className="p-5 rounded-lg bg-graphite border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-paper">Browser Camera</span>
              <StatusBadge status="AVAILABLE" label="Current" />
            </div>
            <p className="text-slate text-[11px]">Monocular smartphone and laptop webcam capture via WebRTC / WebSocket.</p>
          </div>

          <div className="p-5 rounded-lg bg-graphite border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-paper">Video File Upload</span>
              <StatusBadge status="AVAILABLE" label="Current" />
            </div>
            <p className="text-slate text-[11px]">MP4, MOV, and AVI offline video processing via Sanjaya Engine API.</p>
          </div>

          <div className="p-5 rounded-lg bg-graphite border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-paper">RTSP Live Stream</span>
              <StatusBadge status="PLANNED" />
            </div>
            <p className="text-slate text-[11px]">Continuous IP camera network ingestion for persistent facility surveillance.</p>
          </div>

          <div className="p-5 rounded-lg bg-graphite border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-paper">ROS 2 Adapter</span>
              <StatusBadge status="PLANNED" />
            </div>
            <p className="text-slate text-[11px]">Publish spatial place graphs directly to Robot Operating System (ROS 2) nav nodes.</p>
          </div>

          <div className="p-5 rounded-lg bg-graphite border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-paper">MAVSDK Drone Link</span>
              <StatusBadge status="PLANNED" />
            </div>
            <p className="text-slate text-[11px]">Autonomous drone flight path spatial telemetry and frontier navigation.</p>
          </div>

          <div className="p-5 rounded-lg bg-graphite border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-paper">Custom gRPC Adapter</span>
              <StatusBadge status="PLANNED" />
            </div>
            <p className="text-slate text-[11px]">Low-latency binary spatial frame protocol for embedded edge hardware.</p>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-white/10 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-paper">Read the research & API documentation</h3>
          <p className="text-xs text-slate">Explore underlying research papers and current endpoints.</p>
        </div>
        <div className="flex gap-4">
          <Link to="/docs" className="button-secondary text-xs">
            Technical Documentation <Arrow diagonal />
          </Link>
          <a href="https://github.com/Launchpad-Forge/sanjaya" target="_blank" rel="noreferrer" className="button-primary text-xs">
            View on GitHub <Arrow />
          </a>
        </div>
      </div>
    </div>
  );
}