import { useEffect, useRef, useState } from 'react';
import { hero } from '../../config/hero';

export default function HeroVideo() {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setIsPlaying(!preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoError) return;
    let inView = false;
    const sync = () => {
      if (isPlaying && inView && !document.hidden) video.play().catch(() => setIsPlaying(false));
      else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
    observer.observe(video);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      video.pause();
    };
  }, [isPlaying, videoError]);

  return (
    <div className="relative w-full aspect-video overflow-hidden">
      {videoError ? <img src={hero.video.poster} alt="Recorded camera reconstruction" className="w-full h-full object-cover" /> : <video ref={videoRef} src={hero.video.mp4} muted loop playsInline preload="metadata" poster={hero.video.poster} className="w-full h-full object-cover" onError={() => setVideoError(true)} aria-label="Recorded 3D reconstruction demonstration" />}
      {!videoError && <button type="button" onClick={() => setIsPlaying(value => !value)} className="absolute bottom-4 right-4 bg-void/80 text-paper px-4 py-2 rounded-pill text-small" aria-label={isPlaying ? 'Pause video' : 'Play video'}>{isPlaying ? 'Pause' : 'Play'}</button>}
    </div>
  );
}
