import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ShaderBackground from '../../components/site/ShaderBackground';
import SpatialPreview from '../../components/site/SpatialPreview';
import HeroVideo from '../../components/site/HeroVideo';
import StatusBadge from '../../components/common/StatusBadge';
import { Arrow } from '../../components/site/Brand';
import { siteConfig } from '../../config/site';

export default function Landing() {
  useEffect(() => { 
    document.title = 'SANJAYA — Spatial Intelligence for the Physical World'; 
  }, []);

  return (
    <div className="landing-page bg-void text-paper min-h-screen font-sans">
      <ShaderBackground variant="mesh" />

      {/* SECTION 1 — HERO */}
      <section className="landing-hero page-container pt-12 pb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-trace mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-trace animate-pulse" />
          SANJAYA / SPATIAL INTELLIGENCE
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 max-w-4xl leading-tight">
          Intelligence shouldn't <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-paper via-paper to-slate">
            stop at the frame.
          </span>
        </h1>
        
        <p className="hero-description text-slate text-lg md:text-xl max-w-2xl mb-8 leading-relaxed">
          Sanjaya is building persistent spatial intelligence that helps machines and people reconstruct physical environments, understand what exists within them, remember their state, and detect how they change.
        </p>

        <div className="hero-actions flex flex-wrap gap-4 mb-10">
          <Link to="/technology" className="button-primary">
            Explore Sanjaya <Arrow />
          </Link>
          <Link to="/inspect" className="button-secondary">
            Start Inspection <Arrow diagonal />
          </Link>
        </div>

        <div className="hero-meta flex items-center gap-6 text-xs font-mono text-slate border-t border-white/10 pt-6">
          <span>Ordinary Monocular Video</span>
          <span>•</span>
          <span>No LiDAR Required</span>
          <span>•</span>
          <span>Spatial Graph Memory</span>
          <span>•</span>
          <a 
            href={siteConfig.githubUrl || "https://github.com/Launchpad-Forge/sanjaya"} 
            target="_blank" 
            rel="noreferrer" 
            className="text-paper hover:text-trace transition-colors flex items-center gap-1"
          >
            View on GitHub <Arrow diagonal />
          </a>
        </div>

        {/* Hero Visual Container */}
        <div className="mt-12 rounded-xl overflow-hidden border border-white/10 bg-graphite/50 p-2 shadow-2xl">
          <HeroVideo />
        </div>
      </section>

      {/* SECTION 2 — THE GAP */}
      <section className="landing-section page-container py-24 border-t border-white/10 bg-graphite/20">
        <div className="section-heading mb-12">
          <span className="eyebrow text-trace font-mono text-xs uppercase tracking-widest block mb-2">THE MISSING LAYER</span>
          <h2 className="text-3xl md:text-5xl font-bold">Seeing is not the same as<br />understanding a world.</h2>
        </div>

        <p className="text-slate text-base md:text-lg max-w-3xl mb-12 leading-relaxed">
          Computer vision sees frames. Mapping systems reconstruct geometry. Vision-language models explain static images. But machines operating in the physical world need something more: a persistent understanding of what exists, where it exists, how it changes, and how certain that understanding is.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="p-6 rounded-lg bg-graphite border border-white/5 space-y-3">
            <span className="text-xs font-mono text-slate">OBJECT DETECTION</span>
            <h3 className="font-semibold text-paper text-sm">"What is visible"</h3>
            <p className="text-xs text-slate">Frame-by-frame 2D bounding boxes without persistent spatial coordinate grounding.</p>
          </div>
          <div className="p-6 rounded-lg bg-graphite border border-white/5 space-y-3">
            <span className="text-xs font-mono text-slate">3D MAPPING</span>
            <h3 className="font-semibold text-paper text-sm">"Where geometry exists"</h3>
            <p className="text-xs text-slate">Raw point clouds and meshes lacking semantic meaning or object hierarchy.</p>
          </div>
          <div className="p-6 rounded-lg bg-graphite border border-white/5 space-y-3">
            <span className="text-xs font-mono text-slate">VISION-LANGUAGE MODELS</span>
            <h3 className="font-semibold text-paper text-sm">"What an image means"</h3>
            <p className="text-xs text-slate">Un-grounded text descriptions prone to spatial hallucinations across time.</p>
          </div>
          <div className="p-6 rounded-lg bg-graphite border border-white/5 space-y-3">
            <span className="text-xs font-mono text-slate">DIGITAL TWINS</span>
            <h3 className="font-semibold text-paper text-sm">"Structured models"</h3>
            <p className="text-xs text-slate">Static CAD models that don't update automatically as physical environments change.</p>
          </div>
        </div>

        <div className="p-8 rounded-xl bg-void border border-trace/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-xs font-mono text-trace font-bold mb-1">SANJAYA ARCHITECTURE FLOW</div>
            <div className="text-sm font-medium text-paper">Observe → Reconstruct → Understand → Remember → Compare → Explain → Act</div>
          </div>
          <Link to="/technology" className="button-secondary shrink-0 text-xs">
            Learn how the stack works <Arrow />
          </Link>
        </div>
      </section>

      {/* SECTION 3 — WHAT EXISTS TODAY */}
      <section className="landing-section page-container py-24 border-t border-white/10">
        <div className="section-heading mb-12">
          <span className="eyebrow text-trace font-mono text-xs uppercase tracking-widest block mb-2">CURRENT SYSTEM</span>
          <h2 className="text-3xl md:text-4xl font-bold">A working spatial engine, not a concept slide.</h2>
          <p className="text-slate text-sm mt-2">Transparent capability status across development phases.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* AVAILABLE */}
          <div className="p-6 rounded-xl bg-graphite/40 border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="font-mono text-xs font-bold text-paper">PERCEPTION & GEOMETRY</span>
              <StatusBadge status="AVAILABLE" />
            </div>
            <ul className="space-y-2.5 text-xs text-slate font-mono">
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Monocular video → 3D reconstruction</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Camera trajectory estimation</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Approximate metric scale (Depth Anything V2)</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Open-vocabulary object detection (OWLv2)</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Objects lifted into 3D coordinates</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Multi-view object spatial fusion</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Mental map / place graph generation</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Unexplored region & frontier estimation</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> 3D scene & mission bundle exports</li>
            </ul>
          </div>

          {/* BUILDING NOW */}
          <div className="p-6 rounded-xl bg-graphite/40 border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="font-mono text-xs font-bold text-paper">INSPECTION INTELLIGENCE</span>
              <StatusBadge status="BUILDING" />
            </div>
            <ul className="space-y-2.5 text-xs text-slate font-mono">
              <li className="flex items-center gap-2"><span className="text-amber-400">⚡</span> Baseline environment scans</li>
              <li className="flex items-center gap-2"><span className="text-amber-400">⚡</span> Multi-visit re-scan alignment</li>
              <li className="flex items-center gap-2"><span className="text-amber-400">⚡</span> Temporal change detection</li>
              <li className="flex items-center gap-2"><span className="text-amber-400">⚡</span> 3D change spatial localization</li>
              <li className="flex items-center gap-2"><span className="text-amber-400">⚡</span> Evidence-grounded report synthesis</li>
            </ul>
          </div>

          {/* NEXT */}
          <div className="p-6 rounded-xl bg-graphite/40 border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="font-mono text-xs font-bold text-paper">WORLD MODELS & PLATFORM</span>
              <StatusBadge status="PLANNED" />
            </div>
            <ul className="space-y-2.5 text-xs text-slate font-mono opacity-80">
              <li className="flex items-center gap-2"><span>○</span> Persistent world models</li>
              <li className="flex items-center gap-2"><span>○</span> Realtime incremental streaming</li>
              <li className="flex items-center gap-2"><span>○</span> Sanjaya Spatial SDK</li>
              <li className="flex items-center gap-2"><span>○</span> ROS2 / MAVSDK robotics adapters</li>
              <li className="flex items-center gap-2"><span>○</span> Multi-camera sensor fusion</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 4 — SANJAYA ENGINE */}
      <section className="landing-section page-container py-24 border-t border-white/10 bg-graphite/10">
        <div className="section-heading mb-12">
          <span className="eyebrow text-trace font-mono text-xs uppercase tracking-widest block mb-2">SPATIAL ENGINE PIPELINE</span>
          <h2 className="text-3xl md:text-4xl font-bold">The engine beneath Sanjaya.</h2>
          <p className="text-slate text-sm mt-2 max-w-2xl">
            A 5-stage deterministic perception pipeline backed by AI-grounded reasoning.
          </p>
        </div>

        {/* Visual Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 font-mono text-xs mb-12">
          <div className="p-4 rounded bg-graphite border border-white/10 space-y-2">
            <span className="text-trace">01. GEOMETRY</span>
            <h4 className="font-bold text-paper">LingBot-Map</h4>
            <p className="text-[11px] text-slate">Streaming 3D points + camera path pose</p>
          </div>
          <div className="p-4 rounded bg-graphite border border-white/10 space-y-2">
            <span className="text-trace">02. SCALE</span>
            <h4 className="font-bold text-paper">Depth Anything V2</h4>
            <p className="text-[11px] text-slate">Pixel-vote alignment for metric metres</p>
          </div>
          <div className="p-4 rounded bg-graphite border border-white/10 space-y-2">
            <span className="text-trace">03. OBJECTS</span>
            <h4 className="font-bold text-paper">OWLv2</h4>
            <p className="text-[11px] text-slate">Open-vocabulary 3D coordinate lifting</p>
          </div>
          <div className="p-4 rounded bg-graphite border border-white/10 space-y-2">
            <span className="text-trace">04. MENTAL MAP</span>
            <h4 className="font-bold text-paper">Hydra Graph</h4>
            <p className="text-[11px] text-slate">Compact spatial place-and-object graph</p>
          </div>
          <div className="p-4 rounded bg-graphite border border-white/10 space-y-2">
            <span className="text-trace">05. COVERAGE</span>
            <h4 className="font-bold text-paper">Frontier Grid</h4>
            <p className="text-[11px] text-slate">Wall gaps & unexplored frontier bounds</p>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-void border border-white/10 max-w-3xl">
          <h4 className="text-sm font-semibold text-paper mb-2">Grounding & Language Model Integration</h4>
          <p className="text-xs text-slate leading-relaxed">
            Google Gemini is integrated strictly for reasoning over grounded spatial evidence (3D coordinates, bounding boxes, object crops, and camera position history). The language model explains physical evidence — it is not responsible for hallucinating geometry.
          </p>
        </div>
      </section>

      {/* SECTION 5 — SANJAYA INSPECTION */}
      <section className="landing-section page-container py-24 border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="eyebrow text-trace font-mono text-xs uppercase tracking-widest block">FIRST APPLICATION</span>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight">Remember an environment.<br />Detect what changed.</h2>
            <p className="text-slate text-sm leading-relaxed">
              Sanjaya Inspection enables non-expert operators to walk a physical space with an ordinary smartphone, record a baseline map, and later rescan the same site to pinpoint missing equipment, structural hazards, or unauthorized modifications.
            </p>

            <div className="space-y-3 font-mono text-xs text-slate">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-trace/20 text-trace flex items-center justify-center font-bold">1</span>
                <span>Scan environment → Build 3D spatial baseline</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-trace/20 text-trace flex items-center justify-center font-bold">2</span>
                <span>Rescan later → Automatic 3D coordinate alignment</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-trace/20 text-trace flex items-center justify-center font-bold">3</span>
                <span>Detect changes → Spatial evidence & AI grounded report</span>
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <Link to="/inspect" className="button-primary text-xs">
                Start Inspection <Arrow />
              </Link>
              <Link to="/inspection" className="button-secondary text-xs">
                Product Specs <Arrow diagonal />
              </Link>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-white/10 bg-graphite p-2 shadow-2xl">
            <SpatialPreview />
          </div>
        </div>
      </section>

      {/* SECTION 6 — THE FIVE QUESTIONS (FULL-WIDTH TYPOGRAPHY) */}
      <section className="py-24 bg-graphite border-y border-white/10 text-center px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <span className="font-mono text-xs uppercase tracking-widest text-trace">GROUNDED EVIDENTIAL FRAMEWORK</span>
          <h2 className="text-3xl md:text-6xl font-black font-mono tracking-tight text-paper uppercase leading-tight">
            WHAT CHANGED?<br />
            WHERE?<br />
            HOW MUCH?<br />
            WHEN?<br />
            HOW CERTAIN ARE WE?
          </h2>
          <p className="text-slate text-sm max-w-xl mx-auto pt-4 border-t border-white/10">
            Sanjaya is engineered to preserve the physical evidence behind every answer, maintaining exact spatial metrics and confidence bounds.
          </p>
        </div>
      </section>

      {/* SECTION 7 — PLATFORM DIRECTION */}
      <section className="landing-section page-container py-24">
        <div className="section-heading mb-12">
          <span className="eyebrow text-trace font-mono text-xs uppercase tracking-widest block mb-2">PLATFORM DIRECTION</span>
          <h2 className="text-3xl md:text-4xl font-bold">One world model. Many sources.</h2>
          <p className="text-slate text-sm mt-2">Feed observations into a unified, persistent spatial intelligence layer.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 font-mono text-xs mb-12">
          <div className="p-4 rounded bg-graphite border border-white/10 text-center space-y-2">
            <div className="text-paper font-bold">Browser Camera</div>
            <StatusBadge status="AVAILABLE" label="Current" />
          </div>
          <div className="p-4 rounded bg-graphite border border-white/10 text-center space-y-2">
            <div className="text-paper font-bold">Video File</div>
            <StatusBadge status="AVAILABLE" label="Current" />
          </div>
          <div className="p-4 rounded bg-graphite border border-white/10 text-center space-y-2">
            <div className="text-paper font-bold">RTSP Stream</div>
            <StatusBadge status="PLANNED" />
          </div>
          <div className="p-4 rounded bg-graphite border border-white/10 text-center space-y-2">
            <div className="text-paper font-bold">Drone (MAVSDK)</div>
            <StatusBadge status="PLANNED" />
          </div>
          <div className="p-4 rounded bg-graphite border border-white/10 text-center space-y-2">
            <div className="text-paper font-bold">Robot (ROS2)</div>
            <StatusBadge status="PLANNED" />
          </div>
          <div className="p-4 rounded bg-graphite border border-white/10 text-center space-y-2">
            <div className="text-paper font-bold">IoT Sensors</div>
            <StatusBadge status="PLANNED" />
          </div>
        </div>
      </section>

      {/* SECTION 8 — IMPACT */}
      <section className="landing-section page-container py-24 border-t border-white/10 bg-graphite/20">
        <div className="section-heading mb-12">
          <span className="eyebrow text-trace font-mono text-xs uppercase tracking-widest block mb-2">PHYSICAL IMPACT</span>
          <h2 className="text-3xl md:text-4xl font-bold">Spatial intelligence for environments that matter.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl bg-graphite border border-white/10 space-y-3">
            <h3 className="font-semibold text-paper text-base">Infrastructure Inspection</h3>
            <p className="text-xs text-slate leading-relaxed">
              Track structural anomalies, equipment degradation, and maintenance compliance across tunnels, bridges, and industrial sites over time.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-graphite border border-white/10 space-y-3">
            <h3 className="font-semibold text-paper text-base">Disaster Response & Recovery</h3>
            <p className="text-xs text-slate leading-relaxed">
              Provide search-and-rescue units with immediate 3D hazard maps and unexplored void bounds inside collapsed or unmapped buildings.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-graphite border border-white/10 space-y-3">
            <h3 className="font-semibold text-paper text-base">Robotics Navigation</h3>
            <p className="text-xs text-slate leading-relaxed">
              Equip autonomous ground vehicles and drones with low-latency spatial graphs and place topological maps for waypoint planning.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 9 — ROADMAP */}
      <section className="landing-section page-container py-24 border-t border-white/10">
        <div className="section-heading mb-12">
          <span className="eyebrow text-trace font-mono text-xs uppercase tracking-widest block mb-2">DEVELOPMENT ROADMAP</span>
          <h2 className="text-3xl md:text-4xl font-bold">Phased research execution.</h2>
        </div>

        <div className="space-y-6 font-mono text-xs max-w-4xl">
          <div className="p-4 rounded-lg bg-graphite border-l-4 border-trace flex flex-col md:flex-row justify-between md:items-center gap-2">
            <div>
              <span className="font-bold text-paper">01 — MONOCULAR PERCEPTION ENGINE</span>
              <p className="text-slate text-[11px] mt-1">Video to 3D reconstruction, metric scaling, OWLv2 object lifting, mental graph.</p>
            </div>
            <StatusBadge status="AVAILABLE" label="Complete" />
          </div>
          <div className="p-4 rounded-lg bg-graphite border-l-4 border-amber-400 flex flex-col md:flex-row justify-between md:items-center gap-2">
            <div>
              <span className="font-bold text-paper">02 — INSPECTION INTELLIGENCE</span>
              <p className="text-slate text-[11px] mt-1">Multi-visit re-scan alignment, 3D change detection, evidence grounded reports.</p>
            </div>
            <StatusBadge status="BUILDING" />
          </div>
          <div className="p-4 rounded-lg bg-graphite border-l-4 border-slate-500 flex flex-col md:flex-row justify-between md:items-center gap-2">
            <div>
              <span className="font-bold text-paper">03 — PERSISTENT WORLD MODELS</span>
              <p className="text-slate text-[11px] mt-1">Longitudinal spatial memory, state graph evolution, multi-agent updates.</p>
            </div>
            <StatusBadge status="PLANNED" />
          </div>
          <div className="p-4 rounded-lg bg-graphite border-l-4 border-slate-500 flex flex-col md:flex-row justify-between md:items-center gap-2">
            <div>
              <span className="font-bold text-paper">04 — SANJAYA SDK & ADAPTERS</span>
              <p className="text-slate text-[11px] mt-1">Developer SDK, RTSP streaming ingestion, ROS2 and MAVSDK integrations.</p>
            </div>
            <StatusBadge status="PLANNED" />
          </div>
        </div>
      </section>

      {/* SECTION 10 — RESEARCH */}
      <section className="landing-section page-container py-24 border-t border-white/10 bg-graphite/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <span className="eyebrow text-trace font-mono text-xs uppercase tracking-widest block mb-2">RESEARCH PROGRAM</span>
            <h2 className="text-3xl md:text-4xl font-bold">Building machines that remember space.</h2>
          </div>
          <Link to="/research" className="button-secondary text-xs">
            Explore Research Program <Arrow diagonal />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-4 rounded bg-graphite border border-white/5">
            <span className="text-slate block mb-1">AREA 01</span>
            <span className="text-paper font-bold">Spatial Perception</span>
          </div>
          <div className="p-4 rounded bg-graphite border border-white/5">
            <span className="text-slate block mb-1">AREA 02</span>
            <span className="text-paper font-bold">Persistent World Models</span>
          </div>
          <div className="p-4 rounded bg-graphite border border-white/5">
            <span className="text-slate block mb-1">AREA 03</span>
            <span className="text-paper font-bold">3D Change Detection</span>
          </div>
          <div className="p-4 rounded bg-graphite border border-white/5">
            <span className="text-slate block mb-1">AREA 04</span>
            <span className="text-paper font-bold">Spatial Uncertainty</span>
          </div>
        </div>
      </section>

      {/* SECTION 11 & 12 — FINAL CTA */}
      <section className="py-24 page-container text-center border-t border-white/10">
        <div className="max-w-2xl mx-auto space-y-6">
          <span className="eyebrow text-trace font-mono text-xs uppercase tracking-widest">JOIN SANJAYA</span>
          <h2 className="text-3xl md:text-5xl font-bold">Build a memory of the physical world.</h2>
          <p className="text-slate text-sm">
            Open research and spatial engineering for physical-world intelligence.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link to="/inspect" className="button-primary">
              Start Inspection <Arrow />
            </Link>
            <Link to="/join" className="button-secondary">
              Join Sanjaya <Arrow diagonal />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
