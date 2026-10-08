import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function QrTry() {
  const url = typeof window !== 'undefined' ? `${window.location.origin}/try` : 'https://sanjaya.dev/try';
  
  return (
    <div className="flex flex-col items-center md:items-start">
      <div className="hidden md:flex p-4 bg-paper rounded-2xl w-max">
        <QRCodeSVG value={url} size={160} bgColor="#FFFFFF" fgColor="#000000" level="Q" />
      </div>
      <div className="md:hidden w-full">
        <a href="/try" className="flex justify-center items-center w-full py-4 px-8 bg-trace text-void rounded-pill font-semibold text-body-large">
          Start a 60-second map
        </a>
      </div>
    </div>
  );
}
