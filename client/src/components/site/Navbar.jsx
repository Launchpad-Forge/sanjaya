import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Brand, { Arrow } from './Brand';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user } = useAuth();
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
          <Link to="/contribute">Contribute</Link>
          <a href="https://github.com/Launchpad-Forge/sanjaya" target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a>
        </div>
        <div className="desktop-actions">
          {user ? (
            <Link to="/profile">Hi, {user.email?.split('@')[0]}</Link>
          ) : (
            <Link to="/login">Sign in</Link>
          )}
          <Link to="/try" className="nav-cta">Try Sanjaya <Arrow /></Link>
        </div>
        <button ref={menuButton} className="menu-toggle" onClick={() => setMenuOpen(value => !value)} aria-expanded={menuOpen} aria-controls="mobile-navigation">{menuOpen ? 'Close' : 'Menu'} <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span></button>
      </nav>
      {menuOpen && <nav id="mobile-navigation" className="mobile-navigation" aria-label="Mobile navigation" onClick={event => { if (event.target.closest('a')) setMenuOpen(false); }}>
        <a href="/#how-it-works">How it works</a><Link to="/research">Research</Link><Link to="/docs">Docs</Link><Link to="/contribute">Contribute</Link><a href="https://github.com/Launchpad-Forge/sanjaya" target="_blank" rel="noopener noreferrer">GitHub</a>
        {user ? <Link to="/profile">Profile</Link> : <Link to="/login">Sign in</Link>}
        <Link to="/try" className="nav-cta">Try Sanjaya <Arrow /></Link>
      </nav>}
    </header>
  );
}
