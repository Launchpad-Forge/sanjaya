import { Component, useState } from 'react';
import { Link } from 'react-router-dom';
import MapViewer3D from '../viewer/MapViewer3D';

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="scan-empty">The 3D preview could not load. You can still view the maps or download the scene below.</div> : this.props.children; }
}

export default function ScanResults({ mission }) {
  const [tab, setTab] = useState('scene');
  const views = [['scene', '3D reconstruction'], ['floorplan', 'Floor plan'], ['mentalmap', 'Mental map']];
  const stats = mission.stats || {}, urls = mission.urls || {};
  return <section className="scan-results"><div className="scan-result-heading"><div><span className="eyebrow">RECONSTRUCTION COMPLETE</span><h2>Your space, reconstructed.</h2><p>Actual engine output · {stats.metric ? 'Estimated metric scale' : 'Model units · no metric scale'}</p></div><span className="scan-complete">Complete</span></div>
    <div className="scan-tabs" role="group" aria-label="Reconstruction view">{views.map(([key, label]) => <button key={key} onClick={() => setTab(key)} aria-pressed={tab === key}>{label}</button>)}</div>
    {tab === 'scene' ? <SceneBoundary key={urls.scene}>{urls.scene ? <MapViewer3D url={urls.scene} /> : <div className="scan-empty">No 3D scene was returned.</div>}</SceneBoundary> : urls[tab] ? <div className="scan-output-image"><img src={urls[tab]} alt={tab === 'floorplan' ? 'Engine-generated floor plan with camera trajectory and coverage' : 'Engine-generated graph of places and detected objects'} /></div> : <div className="scan-empty">The engine did not produce this view for this scan.</div>}
    <dl className="scan-stats">{[['Frames', stats.frames], ['Objects', stats.objects], ['Places', stats.places], ['Floor seen', stats.floor_area_seen != null ? `${stats.floor_area_seen} ${stats.metric ? 'm²' : 'units²'}` : null]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>)}</dl>
    {stats.warnings?.length > 0 && <div className="scan-hint"><strong>Reconstruction notes</strong><ul>{stats.warnings.map(note => <li key={note}>{note}</li>)}</ul></div>}
    <div className="scan-downloads"><h3>Download the actual output</h3><div>{[['scene', '3D scene (.glb)'], ['floorplan', 'Floor plan image'], ['mentalmap', 'Mental map image'], ['graph', 'Scene graph JSON'], ['bundle', 'Full mission bundle']].filter(([key]) => urls[key]).map(([key, label]) => <a key={key} href={urls[key]} target="_blank" rel="noreferrer" className="button-secondary">{label} ↓</a>)}</div><p>Use the floor plan and mental map images in your landing page. Signed download links expire; reopen this result to refresh them.</p></div>
    {!!mission.objects?.length && <div className="scan-objects"><h3>Objects supported by the scan</h3><div>{mission.objects.map((object, index) => <article key={object.id || index}>{object.crop_url && <img src={object.crop_url} alt={`Evidence for ${object.label}`} loading="lazy" />}<strong>{object.label}</strong><span>{object.position?.map(n => Number(n).toFixed(2)).join(', ')} {mission.unit || 'units'}</span></article>)}</div></div>}
    <Link to="/inspect" className="text-link">Start another scan ↗</Link>
  </section>;
}
