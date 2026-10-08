import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Brand, { Arrow } from './Brand';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 20);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    const close = event => {
      if (event.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [menuOpen]);

  return (
    <header className={`site-header ${scrolled || menuOpen ? 'is-scrolled' : ''}`}>
      <nav className="site-nav" aria-label="Main navigation">
        <Brand />
        <div className="desktop-links">
          <a href="/#how-it-works">How it works</a>
          <Link to="/research">Research</Link>
          <Link to="/docs">Docs</Link>
          <Link to="/contribute">Contribute <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="desktop-actions">
          <Link to="/login">Sign in</Link>
          <Link to="/try" className="nav-cta">Try Sanjaya <Arrow /></Link>
        </div>
        <button ref={menuButton} className="menu-toggle" onClick={() => setMenuOpen(value => !value)} aria-expanded={menuOpen} aria-controls="mobile-navigation">{menuOpen ? 'Close' : 'Menu'} <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span></button>
      </nav>
      {menuOpen && <nav id="mobile-navigation" className="mobile-navigation" aria-label="Mobile navigation" onClick={event => { if (event.target.closest('a')) setMenuOpen(false); }}>
        <a href="/#how-it-works">How it works</a><Link to="/research">Research</Link><Link to="/docs">Docs</Link><Link to="/contribute">Contribute</Link><Link to="/login">Sign in</Link><Link to="/try" className="nav-cta">Try Sanjaya <Arrow /></Link>
      </nav>}
    </header>
  );
}
