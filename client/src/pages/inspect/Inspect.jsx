// /inspect: record a scan -> 3D world -> save as baseline; later: rescan -> compare.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createInspection, getMission, uploadScan } from '../../api/missions';
import MapViewer3D from '../../components/viewer/MapViewer3D';
import usePoll from '../../hooks/usePoll';

const MIN_S = 8;
const MAX_S = 30;
const MIME = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
  .find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m));

const store = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};

const btn = 'rounded-full px-6 py-3 font-semibold transition-opacity disabled:opacity-40';
const primary = `${btn} bg-trace text-void`;
const secondary = `${btn} border border-white/20 text-paper`;

export default function Inspect() {
  const navigate = useNavigate();
  const [baseline, setBaseline] = useState(() => store.get('sanjaya.baseline'));
  const [markerCm, setMarkerCm] = useState(() => store.get('sanjaya.markerCm') ?? 0);
  const [scene, setScene] = useState('Indoor');
  const [phase, setPhase] = useState('start'); // start | camera | recording | uploading | processing
  const [missionId, setMissionId] = useState(null);
  const [error, setError] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const mode = baseline ? 'rescan' : 'baseline';

  const { data: mission, error: pollError } = usePoll(getMission, missionId);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  useEffect(() => stopCamera, []);

  // a finished rescan goes straight to the comparison
  useEffect(() => {
    if (mode !== 'rescan' || mission?.status !== 'ready') return;
    createInspection(baseline.id, mission.id, Number(markerCm) || 0)
      .then((ins) => navigate(`/inspection/${ins.id}`))
      .catch((e) => setError(e.message));
  }, [mission, mode, baseline, markerCm, navigate]);

  const submit = useCallback(async (blob) => {
    setPhase('uploading');
    setError(null);
    try {
      const m = await uploadScan(blob, { scene, label: mode === 'baseline' ? 'Baseline' : 'Rescan' });
      setMissionId(m.id);
      setPhase('processing');
    } catch (e) {
      setError(e.message);
      setPhase('start');
    }
  }, [scene, mode]);

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false,
      });
      streamRef.current = stream;
      setPhase('camera');
      requestAnimationFrame(() => { if (videoRef.current) videoRef.current.srcObject = stream; });
    } catch (e) {
      setError(`Camera unavailable (${e.name}). You can upload a video instead.`);
    }
  }

  function record() {
    const chunks = [];
    const rec = new MediaRecorder(streamRef.current, MIME ? { mimeType: MIME, videoBitsPerSecond: 6_000_000 } : undefined);
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      stopCamera();
      submit(new Blob(chunks, { type: rec.mimeType || 'video/webm' }));
    };
    recorderRef.current = rec;
    rec.start(1000);
    setSeconds(0);
    setPhase('recording');
  }

  useEffect(() => {
    if (phase !== 'recording') return undefined;
    const t = setInterval(() => setSeconds((s) => {
      if (s + 1 >= MAX_S) recorderRef.current?.state === 'recording' && recorderRef.current.stop();
      return s + 1;
    }), 1000);
    return () => clearInterval(t);
  }, [phase]);

  function saveBaseline() {
    const b = { id: mission.id, created_at: mission.created_at };
    store.set('sanjaya.baseline', b);
    setBaseline(b);
    setMissionId(null);
    setPhase('start');
  }

  function newBaseline() {
    store.set('sanjaya.baseline', null);
    setBaseline(null);
    setMissionId(null);
    setPhase('start');
  }

  const ready = mission?.status === 'ready';
  const failed = mission?.status === 'failed';
  const shownError = error || pollError || (failed && `Processing failed: ${mission.error}`);

  return (
    <main className="min-h-screen bg-void px-4 py-8 text-paper md:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between">
          <Link to="/" className="text-sm text-slate hover:text-paper">← Sanjaya</Link>
          <span className="text-xs uppercase tracking-[0.2em] text-slate">Inspection · step {mode === 'baseline' ? '1' : '2'} of 2</span>
        </header>

        <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
          {mode === 'baseline' ? 'Scan the baseline' : 'Scan again to find what changed'}
        </h1>
        <p className="mt-3 max-w-2xl text-slate">
          {mode === 'baseline'
            ? 'Record a slow 15–30 second walk through the space. Sanjaya rebuilds it in 3D and keeps it as the reference.'
            : `Baseline saved ${new Date(baseline.created_at).toLocaleString()}. Change something in the scene, then start from the same spot, facing the same way, and walk the same path.`}
        </p>

        {shownError && <p role="alert" className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">{shownError}</p>}

        {phase === 'start' && (
          <section className="mt-8 grid gap-6 md:grid-cols-[1fr_320px]">
            <div className="rounded-2xl border border-graphite p-6">
              <ul className="space-y-2 text-sm text-mist/80">
                <li>• Start where you will start every time{Number(markerCm) > 0 ? ', with the marker in view' : ''}.</li>
                <li>• Walk slowly; turn while moving, never spin in place.</li>
                <li>• Tilt slightly down so the floor is visible. Good light helps.</li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className={primary} onClick={startCamera}>{mode === 'baseline' ? 'Start inspection' : 'Scan again'}</button>
                <label className={`${secondary} cursor-pointer`}>
                  Upload a video
                  <input type="file" accept="video/*" className="sr-only" onChange={(e) => e.target.files[0] && submit(e.target.files[0])} />
                </label>
                {baseline && <button className={secondary} onClick={newBaseline}>New baseline</button>}
              </div>
            </div>
            <details className="rounded-2xl border border-graphite p-6 text-sm">
              <summary className="cursor-pointer font-medium">Options</summary>
              <fieldset className="mt-4">
                <legend className="mb-2 text-slate">Scene</legend>
                {['Indoor', 'Outdoor'].map((s) => (
                  <label key={s} className="mr-4"><input type="radio" name="scene" checked={scene === s} onChange={() => setScene(s)} /> {s}</label>
                ))}
              </fieldset>
              <label className="mt-4 block text-slate">
                Anchor marker side (cm, ArUco 4×4; 0 = none)
                <input type="number" min="0" max="100" step="0.5" value={markerCm}
                  onChange={(e) => { setMarkerCm(e.target.value); store.set('sanjaya.markerCm', e.target.value); }}
                  className="mt-1 w-full rounded-lg border border-graphite bg-black px-3 py-2 text-paper" />
              </label>
            </details>
          </section>
        )}

        {(phase === 'camera' || phase === 'recording') && (
          <section className="mt-8">
            <div className="relative overflow-hidden rounded-2xl border border-graphite bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="block max-h-[70vh] w-full object-contain" />
              {phase === 'recording' && (
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-sm">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> {seconds}s / {MAX_S}s
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-3">
              {phase === 'camera'
                ? <button className={primary} onClick={record}>Record</button>
                : <button className={primary} disabled={seconds < MIN_S} onClick={() => recorderRef.current.stop()}>
                    {seconds < MIN_S ? `Keep walking… ${MIN_S - seconds}s` : 'Stop scan'}
                  </button>}
              <button className={secondary} onClick={() => { stopCamera(); setPhase('start'); }}>Cancel</button>
            </div>
          </section>
        )}

        {(phase === 'uploading' || (phase === 'processing' && !ready && !failed)) && (
          <section className="mt-10 rounded-2xl border border-graphite p-8">
            <p className="text-lg">{phase === 'uploading' ? 'Uploading scan…' : 'Building the 3D world…'}</p>
            <p className="mt-2 text-sm text-slate">This usually takes 1–3 minutes on the GPU engine. Keep this page open.</p>
            <div className="mt-6 h-1 overflow-hidden rounded bg-graphite"><div className="h-full w-1/3 animate-pulse bg-trace" /></div>
          </section>
        )}

        {ready && mode === 'rescan' && !error && (
          <p className="mt-10 text-lg">Comparing with the baseline…</p>
        )}

        {ready && mode === 'baseline' && (
          <section className="mt-8 space-y-6">
            <MapViewer3D url={mission.urls.scene} />
            <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <Stat label="Objects found" value={mission.stats.objects} />
              <Stat label="Frames mapped" value={mission.stats.frames} />
              <Stat label="Floor seen" value={mission.stats.floor_area_seen ? `${mission.stats.floor_area_seen} m²` : '–'} />
              <Stat label="Real-world scale" value={mission.stats.metric ? `on (spread ${mission.stats.scale?.spread})` : 'off'} />
            </dl>
            {mission.stats.warnings?.length > 0 && (
              <ul className="text-sm text-slate">{mission.stats.warnings.map((w) => <li key={w}>• {w}</li>)}</ul>
            )}
            <div className="flex flex-wrap gap-3">
              <button className={primary} onClick={saveBaseline}>Save as baseline</button>
              <button className={secondary} onClick={() => { setMissionId(null); setPhase('start'); }}>Discard and rescan</button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-graphite p-4">
      <dt className="text-slate">{label}</dt>
      <dd className="mt-1 text-xl font-semibold">{value ?? '–'}</dd>
    </div>
  );
}
