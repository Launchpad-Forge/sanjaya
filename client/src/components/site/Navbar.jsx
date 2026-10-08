import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Brand, { Arrow } from './Brand';
import { useAuth } from '../../context/AuthContext';
import { siteConfig } from '../../config/site';

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

  const navLinks = [
    { label: 'Technology', path: '/technology' },
    { label: 'Inspection', path: '/inspection' },
    { label: 'Research', path: '/research' },
    { label: 'Developers', path: '/developers' },
    { label: 'Impact', path: '/impact' },
    { label: 'About', path: '/about' },
  ];

  return (
    <header className={`site-header ${scrolled || menuOpen ? 'is-scrolled' : ''}`}>
      <nav className="site-nav" aria-label="Main navigation">
        <Brand />
        <div className="desktop-links">
          {navLinks.map(link => (
            <Link 
              key={link.path} 
              to={link.path} 
              aria-current={pathname === link.path ? 'page' : undefined}
              className={pathname === link.path ? 'is-active' : ''}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="desktop-actions">
          <a href={siteConfig.githubUrl || "https://github.com/Launchpad-Forge/sanjaya"} target="_blank" rel="noopener noreferrer" className="text-small text-slate hover:text-paper transition-colors">
            GitHub <span aria-hidden="true">↗</span>
          </a>
          {user ? (
            <Link to="/app" className="text-small text-paper font-medium hover:text-trace transition-colors">
              Workspace ({user.email?.split('@')[0]})
            </Link>
          ) : (
            <Link to="/login" className="text-small text-paper font-medium hover:text-trace transition-colors">
              Sign in
            </Link>
          )}
          <Link to="/join" className="button-primary text-xs py-2 px-3">
            Join Sanjaya <Arrow />
          </Link>
        </div>
        <button 
          ref={menuButton} 
          className="menu-toggle" 
          onClick={() => setMenuOpen(value => !value)} 
          aria-expanded={menuOpen} 
          aria-controls="mobile-navigation"
        >
          {menuOpen ? 'Close' : 'Menu'} <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
        </button>
      </nav>
      {menuOpen && (
        <nav 
          id="mobile-navigation" 
          className="mobile-navigation flex flex-col gap-4 p-6 bg-graphite border-b border-white/10" 
          aria-label="Mobile navigation" 
          onClick={event => { if (event.target.closest('a')) setMenuOpen(false); }}
        >
          {navLinks.map(link => (
            <Link key={link.path} to={link.path} className="text-lg py-1 border-b border-white/5">
              {link.label}
            </Link>
          ))}
          <div className="pt-4 flex flex-col gap-3">
            <a href={siteConfig.githubUrl || "https://github.com/Launchpad-Forge/sanjaya"} target="_blank" rel="noopener noreferrer" className="text-slate">
              GitHub ↗
            </a>
            {user ? (
              <Link to="/app">Workspace</Link>
            ) : (
              <Link to="/login">Sign in</Link>
            )}
            <Link to="/join" className="button-primary justify-center text-center mt-2">
              Join Sanjaya <Arrow />
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
