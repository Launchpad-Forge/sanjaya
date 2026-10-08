import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ShaderBackground from '../../components/site/ShaderBackground';
import SpatialPreview from '../../components/site/SpatialPreview';
import HeroVideo from '../../components/site/HeroVideo';
import StatusBadge from '../../components/common/StatusBadge';
import Faq from '../../components/site/Faq';
import { Arrow } from '../../components/site/Brand';
import { siteConfig } from '../../config/site';

const steps = [
  ['Observe', 'Start with an ordinary camera. Capture a walkthrough of the space around you.'],
  ['Understand', 'Reconstruct geometry and connect objects to the places they belong.'],
  ['Remember', 'Keep a baseline of the environment. A reference you can return to.'],
  ['Compare', 'Rescan the space. Explore what moved, what appeared, and what needs attention.'],
];
const capabilities = [
  { title: 'Spatial perception', status: 'AVAILABLE', description: 'The foundation: turning camera observations into a structured view of the world.', items: ['Monocular 3D reconstruction', 'Camera trajectory & object localization', 'Scene graphs & map exports'] },
  { title: 'Inspection intelligence', status: 'BUILDING', description: 'The first application: understanding a space across more than one visit.', items: ['Baseline and repeat scans', 'Spatial alignment & change detection', 'Evidence-grounded inspection reports'] },
  { title: 'A connected platform', status: 'PLANNED', description: 'The direction: spatial memory that other systems can build on.', items: ['Persistent world models', 'Developer SDK & streaming adapters', 'Robotics & multi-camera integration'] },
];
const questions = [
  { q: 'What is a baseline scan?', a: 'A baseline is your reference view of a space. Record a slow walkthrough, let the engine reconstruct it, then save it as the baseline for a later comparison.' },
  { q: 'Do I need a special camera?', a: 'Start with an ordinary phone camera or upload a video. The inspection workflow uses standard camera footage; a LiDAR sensor is not required.' },
  { q: 'How should I record a repeat scan?', a: 'Start in the same place, face the same direction, and follow a similar path. Move slowly and keep the scene well lit to give the engine useful overlap between visits.' },
  { q: 'Is this a precision surveying tool?', a: 'Sanjaya is a research prototype. Reconstructed scale and detected changes need review; they should not be treated as independently verified survey measurements.' },
  { q: 'Can I explore without an account?', a: 'Yes. The inspection flow supports guest access. You can also explore the methods, documentation, and source code before creating a workspace.' },
];

export default function Landing() {
  useEffect(() => { document.title = 'Sanjaya — Spatial intelligence for the physical world'; }, []);
  return (
    <div className="landing-page landing-refined">
      <ShaderBackground variant="mesh" />
      <section className="landing-hero page-container">
        <Link to="/research" className="hero-eyebrow"><span className="status-dot" /> OPEN RESEARCH. A WORLD BEYOND THE FRAME. <Arrow /></Link>
        <h1>Intelligence shouldn’t<br /><span>stop at the frame.</span></h1>
        <p className="hero-description">Turn everyday video into an understanding of the physical world.<br className="desktop-break" /> Reconstruct a space. Remember its state. See what changes.</p>
        <div className="hero-actions"><Link to="/inspect" className="button-primary">Start an inspection <Arrow /></Link><Link to="/technology" className="button-secondary">Explore the technology <Arrow diagonal /></Link></div>
        <div className="hero-meta"><span>Any camera</span><span>No LiDAR required</span><span>Open research</span></div>
        <SpatialPreview />
        <div className="hero-footnote"><span>FROM CAMERA FRAMES TO SPATIAL MEMORY</span><a href="#how-it-works">A new way to see <span aria-hidden="true">↓</span></a></div>
      </section>

      <div className="research-strip page-container"><span>BUILT ON OPEN<br />RESEARCH</span><div>{['LingBot-Map', 'Depth Anything', 'OWLv2', 'Hydra'].map(name => <Link key={name} to="/research">{name}</Link>)}</div></div>

      <section id="how-it-works" className="landing-section page-container">
        <div className="section-heading"><div><span className="eyebrow">01 / THE MISSING LAYER</span><h2>Seeing a frame is just<br /><span className="text-soft">the beginning.</span></h2></div><p>A picture captures a moment. A spatial model connects the places, objects, and changes that give that moment meaning.</p></div>
        <div className="steps-grid">{steps.map(([title, body], i) => <article key={title}><div className="step-number">0{i + 1}<span aria-hidden="true">{['↗', '◇', '⌘', '↔'][i]}</span></div><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>

      <section className="landing-section page-container capabilities">
        <div className="section-heading"><div><span className="eyebrow">02 / FROM PIXELS TO PLACES</span><h2>A world you can<br />make sense of.</h2></div><Link to="/technology" className="text-link">Inside the spatial engine <Arrow diagonal /></Link></div>
        <div className="capability-grid">
          <article className="capability-card feature-recording"><div className="card-copy"><span className="card-kicker">RECONSTRUCT THE SPACE</span><h3>A new dimension in every frame.</h3><p>Camera observations become 3D geometry and a camera trajectory. The first step toward a shared understanding.</p></div><div className="recording-wrap"><HeroVideo /><span className="recording-label">RECONSTRUCTION RECORDING</span></div></article>
          <article className="capability-card"><div className="card-copy"><span className="card-kicker">CONNECT WHAT’S INSIDE</span><h3>More than a cloud of points.</h3><p>Organize rooms, routes, and objects into a scene graph. A compact map of how a space fits together.</p></div><div className="mini-graph" aria-label="Illustrative scene graph"><span className="graph-node graph-root">Environment</span><div className="graph-branches"><span>Places</span><span>Objects</span><span>Routes</span></div><span className="diagram-caption">GEOMETRY BECOMES CONTEXT.</span></div></article>
        </div>
        <div className="engine-ribbon"><span className="eyebrow">THE SPATIAL ENGINE</span><div>{['Geometry', 'Scale', 'Objects', 'Scene graph', 'Coverage'].map((stage, index) => <span key={stage}><small>0{index + 1}</small>{stage}{index < 4 && <Arrow />}</span>)}</div></div>
      </section>

      <section className="page-container inspection-feature">
        <div className="inspection-copy"><span className="eyebrow">03 / MEET SANJAYA INSPECTION</span><h2>The same space.<br /><span className="text-soft">A different story.</span></h2><p>Walk through a space today. Come back tomorrow. Use a baseline and a repeat scan to explore what has changed—and the evidence behind it.</p><ol>{['Capture a baseline', 'Return and rescan', 'Review the changes'].map((step, i) => <li key={step}><span>0{i + 1}</span>{step}</li>)}</ol><div className="inspection-actions"><Link to="/inspect" className="button-primary">Try an inspection <Arrow /></Link><Link to="/inspection" className="text-link">How it works <Arrow diagonal /></Link></div></div>
        <div className="comparison-preview" aria-label="Illustrative comparison between a baseline and repeat scan"><div className="comparison-topline"><span>SPATIAL MEMORY</span><span>Illustrative example</span></div><div className="comparison-frames">{['Baseline', 'Repeat scan'].map((label, i) => <div className="comparison-frame" key={label}><span>{label}</span><div className="room-sketch"><i /><i /><i className={i ? 'object-moved' : ''} /></div><small>{i ? 'A change to review' : 'A reference to return to'}</small></div>)}</div><div className="comparison-evidence"><span className="evidence-symbol" aria-hidden="true">↔</span><div><strong>Every change needs context.</strong><p>What changed. Where it happened. How certain we are.</p></div></div></div>
      </section>

      <section className="landing-section page-container">
        <div className="section-heading"><div><span className="eyebrow">04 / BUILT IN THE OPEN</span><h2>A clear view of<br />where we are.</h2></div><p>An evolving research prototype, with a distinction between the current engine, work in progress, and what comes next.</p></div>
        <div className="status-grid">{capabilities.map(item => <article className="status-card" key={item.title}><StatusBadge status={item.status} /><h3>{item.title}</h3><p>{item.description}</p><ul>{item.items.map(text => <li key={text}><span aria-hidden="true">↗</span>{text}</li>)}</ul></article>)}</div>
      </section>

      <section className="landing-section page-container use-case-section"><div><span className="eyebrow">05 / FOR THE PHYSICAL WORLD</span><h2>Better understanding.<br />Real possibilities.</h2><p>Exploring how spatial memory can help people and machines navigate a changing world.</p><Link to="/impact" className="text-link">Explore the applications <Arrow diagonal /></Link></div><div className="use-case-list">{[['Infrastructure inspection', 'Return to a site with a reference of how it was.'], ['Disaster response & recovery', 'Build context in unfamiliar environments.'], ['Robotics & exploration', 'Give autonomous systems a map to reason over.']].map(([title, body], i) => <div key={title}><span>0{i + 1}</span><div><h3>{title}</h3><p>{body}</p></div><Arrow diagonal /></div>)}</div></section>

      <section className="page-container"><div className="developer-invite"><div><span className="eyebrow">OPEN QUESTIONS. OPEN SOURCE.</span><h2>Bring your perspective.</h2><p>A model, a dataset, a use case, or a hard question.<br />Help shape the next layer of spatial intelligence.</p></div><div><Link to="/developers" className="button-primary">Build with Sanjaya <Arrow /></Link><a href={siteConfig.githubUrl} target="_blank" rel="noreferrer" className="text-link">Explore the source <Arrow diagonal /></a></div></div></section>

      <section className="landing-section page-container faq-section"><div><span className="eyebrow">A FEW THINGS TO KNOW</span><h2>Good questions.<br />Open answers.</h2><Link to="/docs" className="text-link">Read the documentation <Arrow diagonal /></Link></div><Faq items={questions} /></section>
      <section className="closing-section page-container"><span className="eyebrow">CHANGE YOUR PERSPECTIVE</span><h2>Give your world<br />a little memory.</h2><Link to="/inspect" className="button-primary">Start exploring <Arrow /></Link></section>
    </div>
  );
}
