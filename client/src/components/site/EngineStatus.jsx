import React, { useEffect, useState } from 'react';

export default function EngineStatus() {
  const [status, setStatus] = useState('offline'); // online | busy | offline
  const [queue, setQueue] = useState(0);

  useEffect(() => {
    // Mocking engine status check
    const checkStatus = async () => {
      try {
        // const healthRes = await fetch('/api/health');
        // const statusRes = await fetch('/api/engine/status');
        
        // Mock response
        setTimeout(() => {
          setStatus('offline');
        }, 1000);
      } catch (e) {
        setStatus('offline');
      }
    };
    checkStatus();
  }, []);

  return (
    <div className="flex items-center gap-3 text-small text-slate mt-6 font-mono">
      <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-trace' : status === 'busy' ? 'bg-yellow-500' : 'bg-slate/50'}`}></div>
      {status === 'online' && <span>Engine online</span>}
      {status === 'busy' && <span>Engine busy (Queue: {queue})</span>}
      {status === 'offline' && (
        <span className="flex items-center gap-3">
          Engine offline
          <span className="opacity-50">/</span>
          <a href="/research" className="underline hover:text-paper transition-colors">Watch a recorded mission instead</a>
        </span>
      )}
    </div>
  );
}
