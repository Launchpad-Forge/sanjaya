import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Arrow } from '../site/Brand';

export default function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const navItems = [
    { label: 'Overview', path: '/app', icon: '⌘' },
    { label: 'Inspections', path: '/app/inspections', icon: '◫' },
    { label: 'Start Inspection', path: '/inspect', icon: '⊕', highlight: true },
    { label: 'Profile', path: '/app/profile', icon: '⊙' },
    { label: 'Settings', path: '/app/settings', icon: '⚙' },
  ];

  return (
    <div className="min-h-screen bg-void text-paper flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-graphite border-b border-white/10">
        <Link to="/app" className="font-mono text-sm font-bold text-trace tracking-wider">
          SANJAYA // WORKSPACE
        </Link>
        <button 
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="text-xs font-mono uppercase px-3 py-1 border border-white/20 rounded"
        >
          {mobileSidebarOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        ${mobileSidebarOpen ? 'block' : 'hidden'} 
        md:block w-full md:w-64 bg-graphite border-r border-white/10 flex flex-col justify-between p-6 shrink-0
      `}>
        <div className="space-y-8">
          <div className="hidden md:flex items-center justify-between">
            <Link to="/" className="font-mono text-sm font-bold text-trace tracking-wider">
              SANJAYA
            </Link>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate">
              WORKSPACE
            </span>
          </div>

          <div className="text-xs font-mono text-slate border-b border-white/5 pb-3">
            <div className="text-paper truncate font-medium">{user?.email || 'Authenticated User'}</div>
            <div className="text-[10px] uppercase text-emerald-400 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active Session
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              if (item.highlight) {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-trace text-void font-medium text-xs transition-opacity hover:opacity-95 my-3"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                    <span className="ml-auto"><Arrow /></span>
                  </Link>
                );
              }
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors
                    ${isActive ? 'bg-white/10 text-paper border-l-2 border-trace' : 'text-slate hover:text-paper hover:bg-white/5'}
                  `}
                >
                  <span className="font-mono">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-white/10 space-y-3">
          <Link to="/" className="block text-xs text-slate hover:text-paper transition-colors">
            ← Back to Public Site
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full text-left text-xs font-mono text-rose-400 hover:text-rose-300 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-void p-6 md:p-12">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}