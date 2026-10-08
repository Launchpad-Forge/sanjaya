import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function LongformLayout({ title, date, children }) {
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    // Generate simple ToC from h2 elements inside the content
    const elements = Array.from(document.querySelectorAll('main h2'));
    const items = elements.map((el) => {
      if (!el.id) {
        el.id = el.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }
      return { id: el.id, text: el.textContent };
    });
    setHeadings(items);
  }, [children]);

  return (
    <div className="min-h-screen bg-paper font-sans text-graphite selection:bg-trace selection:text-void flex flex-col">
      <div className="bg-void text-paper">
        <Navbar />
      </div>
      
      <div className="flex-1 max-w-site mx-auto w-full px-side-mob md:px-side-desk py-24 flex flex-col md:flex-row gap-16 relative">
        
        {/* Table of Contents - Desktop sticky */}
        <aside className="hidden md:block w-[240px] shrink-0">
          <div className="sticky top-32">
            <h4 className="text-small font-semibold mb-4 text-slate uppercase tracking-wider">Contents</h4>
            <ul className="flex flex-col gap-3 border-l border-slate/20 pl-4">
              {headings.map((h, i) => (
                <li key={i}>
                  <a href={`#${h.id}`} className="text-small text-slate hover:text-graphite transition-colors">
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="flex-1 max-w-text w-full">
          <h1 className="text-display mb-6">{title}</h1>
          {date && <p className="text-small text-slate mb-12">Last updated {date}</p>}
          
          <div className="prose prose-slate prose-lg max-w-none">
            {children}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
