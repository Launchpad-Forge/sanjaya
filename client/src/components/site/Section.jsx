import React from 'react';

export default function Section({ tone = 'dark', children, className = '', fullBleed = false, ...props }) {
  const isDark = tone === 'dark';
  
  return (
    <section 
      className={`py-section-mob md:py-section-desk px-side-mob md:px-side-desk ${isDark ? 'bg-void text-paper' : 'bg-mist text-graphite'} ${className}`}
      {...props}
    >
      <div className={`mx-auto ${fullBleed ? 'max-w-none' : 'max-w-site'}`}>
        {children}
      </div>
    </section>
  );
}
