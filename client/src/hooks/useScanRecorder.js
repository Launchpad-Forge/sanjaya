import { useEffect, useRef, useState } from 'react';

export default function useScanRecorder(onComplete) {
  const videoRef = useRef(null), stream = useRef(null), recorder = useRef(null), generation = useRef(0);
  const complete = useRef(onComplete); complete.current = onComplete;
  const [phase, setPhase] = useState('idle'), [seconds, setSeconds] = useState(0), [error, setError] = useState('');
  const started = useRef(0);
  function release() {
    generation.current++;
    if (recorder.current) {
      recorder.current.onstop = null;
      if (recorder.current.state !== 'inactive') recorder.current.stop();
      recorder.current = null;
    }
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
  }
  useEffect(() => () => release(), []);
  useEffect(() => { if (videoRef.current && stream.current) videoRef.current.srcObject = stream.current; }, [phase]);
  useEffect(() => {
    if (phase !== 'recording') return;
    const timer = setInterval(() => {
      const elapsed = Math.floor((performance.now() - started.current) / 1000);
      setSeconds(Math.min(elapsed, 30));
      if (elapsed >= 30 && recorder.current?.state === 'recording') recorder.current.stop();
    }, 250);
    return () => clearInterval(timer);
  }, [phase]);
  async function start() {
    setError('');
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) { setError('Open this page over HTTPS to use the camera, or upload a video instead.'); return; }
    if (typeof MediaRecorder === 'undefined') { setError('This browser cannot record video. Record with your camera app and upload the video instead.'); return; }
    release(); const id = generation.current;
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      if (id !== generation.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media; setPhase('camera');
    } catch { setError('Camera access was unavailable. Check your permission or upload a video instead.'); }
  }
  function record() {
    if (!stream.current) return;
    const chunks = [], id = generation.current;
    try {
      const mimeType = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type));
      const rec = new MediaRecorder(stream.current, mimeType ? { mimeType, videoBitsPerSecond: 6_000_000 } : undefined);
      rec.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      rec.onerror = () => { release(); setPhase('idle'); setError('Recording failed. Please try again or upload a video.'); };
      rec.onstop = () => {
        if (id !== generation.current) return;
        stream.current?.getTracks().forEach(track => track.stop()); stream.current = null;
        recorder.current = null; setPhase('idle');
        const blob = new Blob(chunks, { type: rec.mimeType || 'video/webm' });
        if (blob.size < 1024) { setError('The recording was empty. Please try again.'); return; }
        complete.current(blob);
      };
      recorder.current = rec; started.current = performance.now(); setSeconds(0); rec.start(1000); setPhase('recording');
    } catch { release(); setPhase('idle'); setError('This camera could not start recording. Please upload a video instead.'); }
  }
  return { videoRef, phase, seconds, error, start, record, stop: () => { if (seconds >= 8 && recorder.current?.state === 'recording') recorder.current.stop(); }, cancel: () => { release(); setPhase('idle'); } };
}
