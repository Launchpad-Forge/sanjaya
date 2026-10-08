import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import { Arrow } from '../../components/site/Brand';

export default function Technology() {
  useEffect(() => {
    document.title = 'Technology — Sanjaya Spatial Intelligence';
  }, []);

  return (
    <div className="py-16 page-container space-y-16">
      {/* Hero Header */}
      <div className="space-y-4 max-w-3xl">
        <span className="font-mono text-xs text-trace uppercase tracking-widest">ARCHITECTURE & METHODS</span>
        <h1 className="text-4xl md:text-5xl font-bold">The Sanjaya Perception & Spatial Graph Stack</h1>
        <p className="text-slate text-base leading-relaxed">
          Sanjaya combines monocular neural 3D mapping, metric scale estimation, open-vocabulary object detection, and topological place graph synthesis to build persistent spatial understanding.
        </p>
      </div>

      {/* Layer 1: Perception */}
      <section className="space-y-6 pt-8 border-t border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-paper">1. Neural Geometry & Trajectory Estimation</h2>
          <StatusBadge status="AVAILABLE" />
        </div>
        <p className="text-slate text-sm max-w-3xl">
          Using <strong>LingBot-Map</strong> streaming 3D reconstruction, Sanjaya extracts dense 3D point observations and camera trajectory poses in real time directly from monocular video frames.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          <div className="p-5 rounded bg-graphite border border-white/5 space-y-2">
            <span className="text-trace">INPUT</span>
            <div className="text-paper font-bold">RGB Video Stream</div>
            <p className="text-slate">Standard smartphone or bodycam feed (24-60 FPS)</p>
          </div>
          <div className="p-5 rounded bg-graphite border border-white/5 space-y-2">
            <span className="text-trace">PROCESS</span>
            <div className="text-paper font-bold">Geometric Context Transformer</div>
            <p className="text-slate">Robust keyframe selection & relative camera pose solve</p>
          </div>
          <div className="p-5 rounded bg-graphite border border-white/5 space-y-2">
            <span className="text-trace">OUTPUT</span>
            <div className="text-paper font-bold">3D Point Cloud & Trajectory</div>
            <p className="text-slate">Origin-aligned coordinate system (+Y up, -Z forward)</p>
          </div>
        </div>
      </section>

      {/* Layer 2: Metric Scale */}
      <section className="space-y-6 pt-8 border-t border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-paper">2. Metric Scale Recovery</h2>
          <StatusBadge status="AVAILABLE" />
        </div>
        <p className="text-slate text-sm max-w-3xl">
          Monocular SLAM produces geometry up to an unknown scale factor. Sanjaya integrates <strong>Depth Anything V2 Metric</strong> to perform a per-pixel voting scheme across observations, yielding metric scale predictions in real-world metres with a reliability confidence score.
        </p>
      </section>

      {/* Layer 3: Semantic 3D Objects */}
      <section className="space-y-6 pt-8 border-t border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-paper">3. Open-Vocabulary 3D Object Lifting & Fusion</h2>
          <StatusBadge status="AVAILABLE" />
        </div>
        <p className="text-slate text-sm max-w-3xl">
          Open-vocabulary object detector <strong>OWLv2</strong> identifies user-defined objects in keyframes. Using per-pixel depth maps, each 2D detection is unprojected into 3D space. Repeat sightings across frames are merged via spatial clustering into single 3D spatial entities.
        </p>
      </section>

      {/* Layer 4: Mental Map */}
      <section className="space-y-6 pt-8 border-t border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-paper">4. Topological Mental Map (Place Graph)</h2>
          <StatusBadge status="AVAILABLE" />
        </div>
        <p className="text-slate text-sm max-w-3xl">
          Inspired by <strong>Hydra</strong>, Sanjaya generates a compact graph of spatial places (~0.75m spacing along path) connected by topological edges, with objects attached to nearest places.
        </p>
      </section>

      {/* CTA */}
      <div className="pt-8 border-t border-white/10 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-paper">Ready to test the engine?</h3>
          <p className="text-xs text-slate">Run an instant inspection scan or inspect research docs.</p>
        </div>
        <div className="flex gap-4">
          <Link to="/inspect" className="button-primary text-xs">
            Start Inspection <Arrow />
          </Link>
          <Link to="/developers" className="button-secondary text-xs">
            Developer SDK Roadmap <Arrow diagonal />
          </Link>
        </div>
      </div>
    </div>
  );
}