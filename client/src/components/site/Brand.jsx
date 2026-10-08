import { Link } from 'react-router-dom';

export function BrandMark() {
  return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 2 29 9.5v13L16 30 3 22.5v-13L16 2Z" stroke="currentColor" strokeWidth="1.5"/><path d="m3 9.5 13 7.7 13-7.7M16 17v13M9.5 6l13 7.5v7L16 24l-6.5-3.5v-7L22.5 6" stroke="currentColor" strokeWidth="1.5"/></svg>;
}

export default function Brand() {
  return <Link to="/" className="site-brand" aria-label="Sanjaya home"><BrandMark /><span>sanjaya<span className="brand-period">.</span></span></Link>;
}

export function Arrow({ diagonal = false }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h15m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
