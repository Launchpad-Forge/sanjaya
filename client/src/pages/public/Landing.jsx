import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/site/Navbar';
import Footer from '../../components/site/Footer';
import ShaderBackground from '../../components/site/ShaderBackground';
import SpatialPreview from '../../components/site/SpatialPreview';
import HeroVideo from '../../components/site/HeroVideo';
import Faq from '../../components/site/Faq';
import QrTry from '../../components/site/QrTry';
import { Arrow } from '../../components/site/Brand';
import { landing } from '../../content/landing';
import { siteConfig } from '../../config/site';

export default function Landing() {
  useEffect(() => { document.title = 'Sanjaya — See beyond the frame'; }, []);
  return (
    <div className="landing-page">
      <ShaderBackground variant="mesh" />
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main-content">
        <section className="landing-hero page-container">
          <a href="/research" className="hero-eyebrow"><span className="status-dot" /> OPEN RESEARCH. NEW PERSPECTIVES. <Arrow /></a>
          <h1>One camera.<br /><span>The whole building.</span></h1>
          <p className="hero-description">Turn an ordinary camera into a shared, living 3D map.<br className="desktop-break" /> See the space. Understand the scene. Know what’s ahead.</p>
          <div className="hero-actions"><Link to="/try" className="button-primary">Try it with your phone <Arrow /></Link><Link to="/research" className="button-secondary">Explore the research <Arrow diagonal /></Link></div>
          <div className="hero-meta"><span>Any camera</span><span>No LiDAR</span><span>No GPS</span><span>Open source</span></div>
          <SpatialPreview />
          <div className="hero-footnote"><span>FROM EVERYDAY VIDEO TO SPATIAL UNDERSTANDING</span><a href="#how-it-works">Discover what’s possible <span aria-hidden="true">↓</span></a></div>
        </section>

        <section className="research-strip page-container" aria-label="Research foundations"><span>BUILT ON OPEN<br />RESEARCH</span><div>{['VGGT-SLAM', 'Hydra', 'LingBot-Map', 'MASt3R-SLAM', 'SAM 3'].map(name => <Link key={name} to="/research">{name}</Link>)}</div></section>

        <section id="how-it-works" className="landing-section page-container">
          <div className="section-heading"><div><span className="eyebrow">01 / A LITTLE INPUT. A NEW DIMENSION.</span><h2>From a point of view<br />to the bigger picture.</h2></div><p>Floor plans get old. GPS stops at the door.<br />Sanjaya explores a different way: understanding a space as you move through it.</p></div>
          <div className="steps-grid">{landing.howItWorks.steps.map((step, index) => <article key={step.title}><div className="step-number">0{index + 1}<span aria-hidden="true">{['↗', '◇', '⌘', '↔'][index]}</span></div><h3>{step.title}</h3><p>{step.body}</p></article>)}</div>
        </section>

        <section className="landing-section page-container capabilities">
          <div className="section-heading"><div><span className="eyebrow">02 / MORE THAN A MAP</span><h2>Space becomes<br /><span className="text-soft">understanding.</span></h2></div><Link to="/docs" className="text-link">Explore the documentation <Arrow diagonal /></Link></div>
          <div className="capability-grid">
            <article className="capability-card feature-recording"><div className="card-copy"><span className="card-kicker">01 — A SHARED PERSPECTIVE</span><h3>Live, not later.</h3><p>See the map take shape from camera frames. A shared view of the space, while your team is still exploring.</p></div><div className="recording-wrap"><HeroVideo /><span className="recording-label">RECONSTRUCTION RECORDING</span></div></article>
            <article className="capability-card"><div className="card-copy"><span className="card-kicker">02 — CONNECT THE DOTS</span><h3>A map you can think with.</h3><p>Rooms, doors, and the things inside them. Connected in a scene graph that people and robots can reason over.</p></div><div className="mini-graph" aria-label="Illustrative scene graph"><span className="graph-node graph-root">Building</span><div className="graph-branches"><span>Room</span><span>Corridor</span><span>Stairs</span></div><span className="diagram-caption">A WORLD OF PIXELS. A GRAPH OF PLACES.</span></div></article>
            <article className="capability-card"><div className="card-copy"><span className="card-kicker">03 — MAKE THE UNKNOWN VISIBLE</span><h3>Know what’s still unseen.</h3><p>Unexplored spaces stay visible. Keep a clear distinction between what the map knows and what needs a closer look.</p></div><div className="coverage-diagram" aria-label="Illustration of mapped and unexplored space"><div className="coverage-cells">{Array.from({length: 24}, (_, i) => <span key={i} className={i % 8 > 4 ? 'unmapped' : ''} />)}</div><div className="coverage-key"><span>Mapped</span><span>Still to explore</span></div></div></article>
            <article className="capability-card"><div className="card-copy"><span className="card-kicker">04 — QUESTIONS BECOME DIRECTIONS</span><h3>Ask the map.</h3><p>Explore spatial questions through the scene graph. Answers grounded in the map, with a place you can point to.</p></div><div className="query-preview"><span className="query-label">EXPLORE THE POSSIBILITIES</span>{['Where is the stairwell?', 'Show me the unchecked rooms.', 'What is the fastest route out?'].map(query => <div key={query}>{query}<Arrow diagonal /></div>)}</div></article>
          </div>
        </section>

        <section className="landing-section page-container use-case-section"><div><span className="eyebrow">03 / MADE FOR THE REAL WORLD</span><h2>A clearer view.<br />When it matters.</h2><p>For people and machines finding their way through unfamiliar spaces.</p><Link to="/responsible-use" className="text-link">Our responsible use principles <Arrow diagonal /></Link></div><div className="use-case-list">{['Disaster response & recovery', 'Tunnels & underground spaces', 'Robotics & autonomous exploration', 'Building & route understanding'].map((name, i) => <div key={name}><span>0{i + 1}</span><h3>{name}</h3><span aria-hidden="true">↗</span></div>)}</div></section>

        <section className="page-container"><div className="try-panel"><div><span className="eyebrow"><span className="status-dot" /> SEE IT FROM YOUR PERSPECTIVE</span><h2>Your camera.<br />A new dimension.</h2><p>Explore the 60-second guest demo.<br />An ordinary phone is a good place to start.</p><Link to="/try" className="button-primary">Start exploring <Arrow /></Link><span className="try-note">Research prototype · No account needed</span></div><div className="try-qr"><QrTry /><span>SCAN WITH YOUR PHONE</span></div></div></section>

        <section className="landing-section page-container"><div className="section-heading"><div><span className="eyebrow">04 / OPEN BY DESIGN</span><h2>Better when we<br />build it together.</h2></div><p>Sanjaya is an open research project.<br />Bring a model, a dataset, a use case,<br />or a question we haven’t thought to ask.</p></div><div className="principle-row">{[{title:'People stay in control.',body:'Designed for situational awareness, with a human in the loop.'},{title:'Research in the open.',body:'Explore the methods, inspect the code, and help shape what comes next.'},{title:'Honest about the unknown.',body:'An evolving prototype. Approximate scale. Plenty left to discover.'}].map(item => <article key={item.title}><span aria-hidden="true">✳</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div><div className="research-actions"><Link to="/contribute" className="button-secondary">Share an idea <Arrow /></Link><a href={siteConfig.githubUrl} target="_blank" rel="noreferrer" className="text-link">View on GitHub <Arrow diagonal /></a></div><div className="roadmap"><span className="eyebrow">THE ROAD AHEAD</span><div>{landing.roadmap.items.map(item => <article key={item.time}><span className={item.time === 'Now' ? 'roadmap-now' : ''}>{item.time}</span><p>{item.desc}</p></article>)}</div></div></section>

        <section className="landing-section page-container faq-section"><div><span className="eyebrow">A FEW THINGS TO KNOW</span><h2>Good questions.<br />Open answers.</h2><Link to="/docs" className="text-link">Dig into the docs <Arrow diagonal /></Link></div><Faq items={landing.faq} /></section>
        <section className="closing-section page-container"><span className="eyebrow">CHANGE YOUR PERSPECTIVE</span><h2>There’s more<br />to the picture.</h2><Link to="/try" className="button-primary">Explore with Sanjaya <Arrow /></Link></section>
      </main>
      <Footer />
    </div>
  );
}
