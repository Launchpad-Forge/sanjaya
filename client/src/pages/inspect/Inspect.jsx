import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createInspection, getMission, uploadPhotos, uploadScan } from '../../api/missions';
import usePoll from '../../hooks/usePoll';
import useScanRecorder from '../../hooks/useScanRecorder';
import PhoneConnection from '../../components/live/PhoneConnection';
import ScanResults from '../../components/inspect/ScanResults';
import Brand, { Arrow } from '../../components/site/Brand';

const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
const save = (key, value) => { try { value == null ? localStorage.removeItem(key) : localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage optional */ } };

export default function Inspect() {
  const navigate = useNavigate();
  const [baseline, setBaseline] = useState(() => read('sanjaya.baseline'));
  const [scene, setScene] = useState('Indoor'), [marker, setMarker] = useState(() => read('sanjaya.markerCm') || 0);
  const [source, setSource] = useState('video'), [files, setFiles] = useState([]), [previews, setPreviews] = useState([]);
  const [phase, setPhase] = useState('start'), [missionId, setMissionId] = useState(null), [error, setError] = useState('');
  const comparing = useRef(null);
  const { data, error: pollError } = usePoll(getMission, missionId);
  const mission = data?.id === missionId ? data : null;
  const ready = mission?.status === 'ready', failed = mission?.status === 'failed';
  const recorder = useScanRecorder(blob => submit([blob], 'video'));

  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file)); setPreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);
  useEffect(() => {
    if (!ready || !baseline || comparing.current === mission.id) return;
    comparing.current = mission.id;
    createInspection(baseline.id, mission.id, Number(marker) || 0).then(result => navigate(`/inspection/${result.id}`)).catch(e => setError(e.message));
  }, [ready, baseline, mission, marker, navigate]);

  async function submit(selected = files, kind = source) {
    if (!selected.length) { setError('Choose a video or at least three overlapping photos.'); return; }
    if (kind === 'video' && selected[0].size > 100 * 1024 * 1024) { setError('Choose a video smaller than 100 MB.'); return; }
    setPhase('uploading'); setError(''); setMissionId(null);
    try {
      const options = { scene, label: baseline ? 'Rescan' : 'Baseline' };
      const result = kind === 'images' ? await uploadPhotos(selected, options) : await uploadScan(selected[0], options);
      setMissionId(result.id); setPhase('processing');
    } catch (e) { setError(e.message); setPhase('start'); }
  }
  function reset() { recorder.cancel(); setMissionId(null); setPhase('start'); setError(''); comparing.current = null; }
  function newBaseline() { save('sanjaya.baseline', null); setBaseline(null); reset(); }
  function keepBaseline() { const value = { id: mission.id, created_at: mission.created_at }; save('sanjaya.baseline', value); setBaseline(value); reset(); }
  function select(event, kind) {
    const selected = Array.from(event.target.files || []); event.target.value = '';
    setError(''); setSource(kind); setFiles(kind === 'images' ? selected.sort((a,b) => a.name.localeCompare(b.name, undefined, { numeric: true })) : selected.slice(0,1));
  }
  function move(index, delta) { setFiles(current => { const next = [...current]; [next[index],next[index+delta]] = [next[index+delta],next[index]]; return next; }); }
  const shownError = error || recorder.error || pollError || (failed ? mission.error : '');

  return <main className="scan-page"><div className="page-container">
    <header className="scan-header"><Brand /><Link to="/app">Your workspace <Arrow diagonal /></Link></header>
    <div className="scan-intro"><span className="eyebrow">CAMERA → GEOMETRY → MENTAL MAP</span><h1>{baseline ? 'Return to your space.' : 'Give your space a new dimension.'}</h1><p className="scan-description">{baseline ? 'Follow the original route to compare against your saved baseline. You can also start a fresh baseline below.' : 'Connect your phone, record on this device, or upload a video or overlapping photos. The engine builds your reconstruction after capture.'}</p></div>
    {shownError && <div className="scan-error" role="alert">{shownError}{(failed || pollError || error && ready) && <button onClick={reset}>Start another scan</button>}</div>}
    {phase === 'start' && recorder.phase === 'idle' && <>
      {baseline && <div className="scan-baseline"><span>Baseline saved · {new Date(baseline.created_at).toLocaleString()}</span><button className="text-link" onClick={newBaseline}>Start a new baseline ↗</button></div>}
      <section className="scan-source-grid">
        <article><span className="eyebrow">01 / CAPTURE HERE</span><h2>Use your camera.</h2><p>Walk slowly for 8–30 seconds. Keep the floor and nearby surfaces in view.</p><button className="button-primary" onClick={recorder.start}>Open camera <Arrow /></button></article>
        <article><span className="eyebrow">02 / BRING A RECORDING</span><h2>Upload a video.</h2><p>Use a short walkthrough of a single space. Maximum file size: 100 MB.</p><label className="button-secondary scan-file-label">Choose video <input type="file" accept="video/*" onChange={event => select(event,'video')} /></label></article>
        <article><span className="eyebrow">03 / CONNECT THE VIEWS</span><h2>Upload photos.</h2><p>Choose 3–96 overlapping JPG, PNG, or WebP views in capture order.</p><label className="button-secondary scan-file-label">Choose photos <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event => select(event,'images')} /></label></article>
      </section>
      {!!files.length && <section className="scan-selection"><div className="scan-selection-heading"><h2>{source === 'video' ? files[0].name : `${files.length} photos selected`}</h2><button className="text-link" onClick={() => setFiles([])}>Clear selection</button></div>{source === 'video' ? <video className="scan-camera" controls src={previews[0]} preload="metadata" /> : <><p>Photos are sorted by filename. Move them into the order you walked through the space.</p><div className="scan-photo-grid">{files.map((file, i) => <article key={`${file.name}-${i}`}><img src={previews[i]} alt={`Selected view ${i + 1}`} /><span>{i + 1}. {file.name}</span><div><button disabled={i === 0} aria-label={`Move photo ${i+1} earlier`} onClick={() => move(i,-1)}>←</button><button disabled={i === files.length-1} aria-label={`Move photo ${i+1} later`} onClick={() => move(i,1)}>→</button></div></article>)}</div></>}<button className="button-primary" onClick={() => submit()}>Build mental map <Arrow /></button></section>}
      <section className="scan-options"><fieldset><legend>Environment</legend>{['Indoor','Outdoor'].map(value => <label key={value}><input type="radio" name="scene" checked={scene===value} onChange={() => setScene(value)} /> {value}</label>)}</fieldset><label>Optional ArUco marker side (cm)<input type="number" min="0" max="100" step="0.5" value={marker} onChange={event => {setMarker(event.target.value);save('sanjaya.markerCm',event.target.value);}} /><small>0 means no marker. Used when comparing scans.</small></label></section>
      <PhoneConnection />
    </>}
    {(recorder.phase === 'camera' || recorder.phase === 'recording') && <section className="scan-recording"><video ref={recorder.videoRef} className="scan-camera" autoPlay playsInline muted /><div className="scan-actions">{recorder.phase === 'camera' ? <button className="button-primary" onClick={recorder.record}>Record walkthrough</button> : <button className="button-primary" disabled={recorder.seconds<8} onClick={recorder.stop}>{recorder.seconds<8 ? `Keep walking · ${recorder.seconds}s / 30s` : `Finish scan · ${recorder.seconds}s / 30s`}</button>}<button className="button-secondary" onClick={recorder.cancel}>Cancel recording</button></div><p className="scan-hint">Move slowly through the space. Audio is not recorded.</p></section>}
    {(phase==='uploading' || phase==='processing' && !ready && !failed) && <section className="scan-progress"><span className="eyebrow">{phase==='uploading'?'SENDING YOUR CAPTURE':'ENGINE PROCESSING'}</span><h2>{phase==='uploading'?'Uploading your views…':'Building your mental map…'}</h2><p role="status">The engine reconstructs geometry, estimates scale, and builds a graph of places and objects. Queue and processing times vary.</p>{missionId && <Link to={`/missions/${missionId}`} className="text-link">Open the permanent results link ↗</Link>}</section>}
    {ready && !baseline && <><ScanResults mission={mission} /><div className="scan-actions"><button className="button-primary" onClick={keepBaseline}>Save as baseline <Arrow /></button><button className="button-secondary" onClick={reset}>Discard and rescan</button></div></>}
    {ready && baseline && !error && <p role="status" className="scan-progress">Comparing this scan with your baseline…</p>}
  </div></main>;
}
