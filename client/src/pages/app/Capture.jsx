import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { uploadPairedScan } from '../../api/missions';
import useScanRecorder from '../../hooks/useScanRecorder';
import Brand from '../../components/site/Brand';

export default function Capture() {
  const { id } = useParams(), navigate = useNavigate();
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token'));
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function send(blob) {
    setBusy(true); setError('');
    try { const mission = await uploadPairedScan(id, token, blob, 'Indoor'); navigate(`/missions/${mission.id}`); }
    catch (e) { setError(e.message); setBusy(false); }
  }
  const recorder = useScanRecorder(send);
  return <main className="scan-page"><div className="page-container"><header className="scan-header"><Brand /><Link to="/">Home</Link></header><span className="eyebrow">PHONE CAPTURE</span><h1>Show us your space.</h1><p className="scan-description">Record a slow 8–30 second walkthrough. Your connected workspace will receive the reconstruction after processing.</p>{(!token || error || recorder.error) && <p role="alert" className="scan-error">{!token ? 'This link is missing its pairing token. Scan a new QR code from your workspace.' : error || recorder.error}</p>}{busy ? <p role="status" className="scan-progress">Uploading your scan… Keep this page open.</p> : token && <>{recorder.phase === 'idle' ? <button className="button-primary" onClick={recorder.start}>Open phone camera</button> : <><video className="scan-camera" ref={recorder.videoRef} autoPlay playsInline muted /><div className="scan-actions">{recorder.phase === 'camera' ? <button className="button-primary" onClick={recorder.record}>Record walkthrough</button> : <button className="button-primary" disabled={recorder.seconds < 8} onClick={recorder.stop}>{recorder.seconds < 8 ? `Keep moving · ${recorder.seconds}s` : `Finish scan · ${recorder.seconds}s`}</button>}<button className="button-secondary" onClick={recorder.cancel}>Cancel recording</button></div></>}</>}</div></main>;
}
