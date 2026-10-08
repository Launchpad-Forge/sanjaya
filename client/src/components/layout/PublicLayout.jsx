import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../site/Navbar';
import Footer from '../site/Footer';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-void text-paper">
      <Navbar />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
