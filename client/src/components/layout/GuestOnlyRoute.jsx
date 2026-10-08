import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function GuestOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void text-slate font-mono text-sm">
        <span className="w-2 h-2 rounded-full bg-trace animate-ping mr-2" />
        Checking session...
      </div>
    );
  }

  if (user) {
    const next = searchParams.get('next') || '/app';
    return <Navigate to={next} replace />;
  }

  return children;
}
