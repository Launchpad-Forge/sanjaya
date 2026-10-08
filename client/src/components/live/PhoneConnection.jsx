import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { createPairing, getPairing } from '../../api/missions';

export default function PhoneConnection() {
  const [pair, setPair] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const navigate = useNavigate();
  const reachable = window.location.protocol === 'https:' && !['localhost', '127.0.0.1'].includes(window.location.hostname);
  useEffect(() => {
    if (!pair) return;
    let active = true, timer;
    const poll = async () => {
      try {
        const result = await getPairing(pair.id, pair.viewerToken);
        if (!active) return;
        if (result.missionId) navigate(`/missions/${result.missionId}`);
        else timer = setTimeout(poll, 2500);
      } catch (e) { if (active) setError(e.message); }
    };
    poll(); return () => { active = false; clearTimeout(timer); };
  }, [pair, navigate]);
  async function connect() {
    setBusy(true); setError('');
    try { setPair(await createPairing()); } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  const url = pair ? `${window.location.origin}/capture/${pair.id}#token=${pair.captureToken}` : '';
  return <section className="scan-phone-panel"><div><span className="eyebrow">YOUR PHONE. THIS WORKSPACE.</span><h2>Connect your phone</h2><p>Scan the QR code, record a walkthrough on your phone, and watch processing and results here.</p><small>The engine reconstructs after capture finishes. This is not continuous live mapping.</small></div><div>{!reachable ? <p className="scan-hint">Phone pairing needs a public HTTPS address. On this local preview, use this device’s camera or upload a file.</p> : pair ? <><div className="scan-qr"><QRCodeSVG value={url} size={160} /></div><p className="scan-hint" role="status">Waiting for a phone scan · link expires in 30 minutes</p><a href={url} className="text-link">Open capture link ↗</a><button type="button" className="text-link" onClick={() => { setPair(null); setError(''); }}>New connection</button></> : <button className="button-secondary" disabled={busy} onClick={connect}>{busy ? 'Connecting…' : 'Connect a phone'}</button>}{error && <p role="alert" className="scan-error">{error}</p>}</div></section>;
}
