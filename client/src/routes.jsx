import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import GuestOnlyRoute from './components/layout/GuestOnlyRoute';

// Public Pages
import Landing from './pages/public/Landing';
import Technology from './pages/public/Technology';
import Inspection from './pages/public/Inspection';
import Research from './pages/public/Research';
import Developers from './pages/public/Developers';
import Impact from './pages/public/Impact';
import About from './pages/public/About';
import Join from './pages/public/Join';
import Docs from './pages/public/Docs';
import Contribute from './pages/public/Contribute';
import Community from './pages/public/Community';
import Policy from './pages/public/Policy';
import Auth from './pages/public/Auth';
import AuthCallback from './pages/public/AuthCallback';
import NotFound from './pages/public/NotFound';

// Inspect Experience
const Mission = lazy(() => import('./pages/inspect/Mission'));
const Capture = lazy(() => import('./pages/app/Capture'));
const Inspect = lazy(() => import('./pages/inspect/Inspect'));
const InspectionResult = lazy(() => import('./pages/inspect/Inspection'));
const InspectionReport = lazy(() => import('./pages/inspect/Report'));

// App Workspace Pages
import Dashboard from './pages/app/Dashboard';
import Inspections from './pages/app/Inspections';
import Profile from './pages/app/Profile';
import Settings from './pages/app/Settings';

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="route-loading" role="status">Loading your workspace…</div>}>
    <Routes>
      {/* Public Pages with Standard Header/Footer */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/technology" element={<Technology />} />
        <Route path="/inspection" element={<Inspection />} />
        <Route path="/research" element={<Research />} />
        <Route path="/developers" element={<Developers />} />
        <Route path="/impact" element={<Impact />} />
        <Route path="/about" element={<About />} />
        <Route path="/join" element={<Join />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/contribute" element={<Contribute />} />
        <Route path="/community" element={<Community />} />
        
        {/* Policies */}
        <Route path="/responsible-use" element={<Policy title="Responsible Use Policy" />} />
        <Route path="/privacy" element={<Policy title="Privacy Policy" />} />
        <Route path="/terms" element={<Policy title="Terms of Service" />} />
        <Route path="/security" element={<Policy title="Vulnerability Disclosure" />} />
        <Route path="/accessibility" element={<Policy title="Accessibility Statement" />} />
      </Route>

      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Guest-only Authentication Routes */}
      <Route path="/login" element={<GuestOnlyRoute><Auth /></GuestOnlyRoute>} />
      <Route path="/register" element={<GuestOnlyRoute><Auth /></GuestOnlyRoute>} />

      {/* Inspection Experience (Guest or Authenticated) */}
      <Route path="/capture/:id" element={<Capture />} />
      <Route path="/missions/:id" element={<Mission />} />
      <Route path="/inspect" element={<Inspect />} />
      <Route path="/inspection/:id" element={<InspectionResult />} />
      <Route path="/reports/:id" element={<InspectionReport />} />
      <Route path="/try" element={<Navigate to="/inspect" replace />} />
      <Route path="/live/new" element={<Navigate to="/inspect" replace />} />

      {/* Authenticated App Workspace */}
      <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="inspections" element={<Inspections />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Legacy Route Redirects */}
      <Route path="/home" element={<Navigate to="/app" replace />} />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}