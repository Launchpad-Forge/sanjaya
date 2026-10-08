import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export default function Try() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-void text-paper flex flex-col items-center justify-center p-side-mob md:p-side-desk relative overflow-hidden">
      <Link to="/" className="absolute top-8 left-8 text-small font-medium hover:underline">
        ← Back to Sanjaya
      </Link>

      {isMobile ? (
        <div className="max-w-[400px] w-full flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-mist/10 rounded-full flex items-center justify-center mb-8">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
          </div>
          
          <h1 className="text-heading-3 mb-4">Sanjaya needs your camera</h1>
          <p className="text-body text-slate mb-12">
            Sanjaya builds the map from your camera stream. Frames are processed to update the map and then immediately discarded.
          </p>
          
          <button className="bg-trace text-void w-full py-4 rounded-pill font-semibold text-body-large mb-4">
            Allow camera
          </button>
          <p className="text-small text-slate">Session lasts 60 seconds</p>
        </div>
      ) : (
        <div className="max-w-[600px] w-full flex flex-col items-center text-center">
          <h1 className="text-heading-2 mb-6">Scan to start mapping</h1>
          <p className="text-body-large text-slate mb-12">
            Sanjaya's live capture works on mobile devices. Scan this code with your phone's camera to begin a session.
          </p>
          
          <div className="bg-paper p-8 rounded-3xl mb-12">
            <QRCodeSVG value={typeof window !== 'undefined' ? window.location.href : 'https://sanjaya.dev/try'} size={240} bgColor="#FFFFFF" fgColor="#000000" level="Q" />
          </div>

          <Link to="/research" className="text-body font-medium hover:underline underline-offset-4 text-trace">
            Watch a recorded mission instead
          </Link>
        </div>
      )}
    </div>
  );
}