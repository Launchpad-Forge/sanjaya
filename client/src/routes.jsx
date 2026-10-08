import { Routes, Route } from 'react-router-dom';

// Public Pages
import Landing from './pages/public/Landing';
import Try from './pages/public/Try';
import Auth from './pages/public/Auth';
import NotFound from './pages/public/NotFound';
import Research from './pages/public/Research';
import Docs from './pages/public/Docs';
import Contribute from './pages/public/Contribute';
import Community from './pages/public/Community';
import Policy from './pages/public/Policy';

// App Pages
import Home from './pages/app/Home';
import LiveNew from './pages/app/LiveNew';
import LiveView from './pages/app/LiveView';
import Capture from './pages/app/Capture';

// Layouts
import AppLayout from './components/layout/AppLayout';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/try" element={<Try />} />
      
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Auth />} />
      
      <Route path="/research" element={<Research />} />
      <Route path="/docs" element={<Docs />} />
      <Route path="/contribute" element={<Contribute />} />
      <Route path="/community" element={<Community />} />
      
      {/* Policies */}
      <Route path="/responsible-use" element={<Policy title="Responsible Use Policy" />} />
      <Route path="/privacy" element={<Policy title="Privacy Policy" />} />
      <Route path="/terms" element={<Policy title="Terms of Service" />} />
      <Route path="/security" element={<Policy title="Vulnerability Disclosure" />} />
      <Route path="/accessibility" element={<Policy title="Accessibility Statement" />} />
      
      {/* App Routes */}
      <Route path="/capture/:sessionId" element={<Capture />} />
      <Route element={<AppLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/live/new" element={<LiveNew />} />
        <Route path="/live/:sessionId" element={<LiveView />} />
      </Route>
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}