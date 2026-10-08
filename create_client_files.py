import os

files = {
    "client/package.json": """{
  "name": "sanjaya-client",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.89.0",
    "three": "^0.158.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "vite": "^5.0.0"
  }
}""",
    "client/vite.config.js": """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})""",
    "client/tailwind.config.js": """/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}""",
    "client/postcss.config.js": """export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}""",
    "client/.env.example": """VITE_API_URL=http://localhost:3000/api
VITE_ENGINE_WS_URL=ws://localhost:8000/ws
VITE_VISER_URL=http://localhost:8080""",
    "client/index.html": """<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SANJAYA</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>""",
    "client/src/index.css": """@tailwind base;
@tailwind components;
@tailwind utilities;""",
    "client/src/main.jsx": """import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)""",
    "client/src/App.jsx": """import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
export default App;""",
    "client/src/routes.jsx": """import { Routes, Route } from 'react-router-dom';
// Public
import Landing from './pages/public/Landing';
import Try from './pages/public/Try';
// App
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
      <Route path="/capture/:sessionId" element={<Capture />} />
      <Route element={<AppLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/live/new" element={<LiveNew />} />
        <Route path="/live/:sessionId" element={<LiveView />} />
      </Route>
    </Routes>
  );
}""",
    "client/src/api/auth.js": """// TODO: Auth API endpoints""",
    "client/src/context/AuthContext.jsx": """import { createContext, useContext, useState } from 'react';
const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);""",
    "client/src/components/layout/AppLayout.jsx": """import { Outlet } from 'react-router-dom';
export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 bg-gray-800 text-white">SANJAYA Navbar</header>
      <main className="flex-1"><Outlet /></main>
      <footer className="p-4 bg-gray-900 text-gray-400">Footer</footer>
    </div>
  );
}""",
    "client/src/pages/public/Landing.jsx": """export default function Landing() { return <div><h1>SANJAYA</h1><p>Single-camera 3D mapping engine.</p></div>; }""",
    "client/src/pages/public/Try.jsx": """export default function Try() { return <div>Try SANJAYA (Guest)</div>; }""",
    "client/src/pages/app/Home.jsx": """export default function Home() { return <div>Dashboard Home</div>; }""",
    "client/src/pages/app/LiveNew.jsx": """export default function LiveNew() { return <div>Generate QR Code for Pairing</div>; }""",
    "client/src/pages/app/LiveView.jsx": """// TODO: Laptop viewer (iframe for Viser + r3f fallback)
export default function LiveView() { return <div>Live View (Viewer mode A/B)</div>; }""",
    "client/src/pages/app/Capture.jsx": """// TODO: Phone capture page
export default function Capture() { return <div>Phone Camera Capture (ws push)</div>; }"""
}

# Also touch some empty stub files as requested
stub_files = [
    "client/src/api/missions.js", "client/src/api/sessions.js", "client/src/api/ideas.js",
    "client/src/hooks/useCamera.js", "client/src/hooks/useEngineSocket.js", "client/src/hooks/useDeviceMotion.js",
    "client/src/lib/frameEncoder.js", "client/src/lib/qr.js",
    "client/src/components/layout/PublicLayout.jsx", "client/src/components/layout/Navbar.jsx",
    "client/src/components/layout/Footer.jsx", "client/src/components/layout/ProtectedRoute.jsx", "client/src/components/layout/RoleRoute.jsx",
    "client/src/components/viewer/MapViewer3D.jsx", "client/src/components/viewer/SceneGraphView.jsx", "client/src/components/viewer/TrajectoryLine.jsx",
    "client/src/components/live/PairingQR.jsx", "client/src/components/live/CaptureControls.jsx", "client/src/components/live/EngineStatusBadge.jsx", "client/src/components/live/QueueNotice.jsx",
    "client/src/components/landing/Hero.jsx", "client/src/components/landing/HowItWorks.jsx", "client/src/components/landing/LiveDemoCTA.jsx",
    "client/src/components/landing/UseCases.jsx", "client/src/components/landing/ResearchFoundations.jsx", "client/src/components/landing/Benchmarks.jsx",
    "client/src/components/landing/StandardsAndPrinciples.jsx", "client/src/components/landing/Roadmap.jsx", "client/src/components/landing/OpenResearch.jsx",
    "client/src/components/landing/Team.jsx", "client/src/components/landing/FAQ.jsx",
    "client/src/pages/public/Research.jsx", "client/src/pages/public/Docs.jsx", "client/src/pages/public/Contribute.jsx",
    "client/src/pages/public/Community.jsx", "client/src/pages/public/ResponsibleUse.jsx", "client/src/pages/public/Privacy.jsx",
    "client/src/pages/public/Terms.jsx", "client/src/pages/public/Security.jsx", "client/src/pages/public/Accessibility.jsx",
    "client/src/pages/public/Login.jsx", "client/src/pages/public/Register.jsx", "client/src/pages/public/NotFound.jsx",
    "client/src/pages/app/Missions.jsx", "client/src/pages/app/MissionDetail.jsx", "client/src/pages/app/Compare.jsx",
    "client/src/pages/app/Ideas.jsx", "client/src/pages/app/Settings.jsx", "client/src/pages/admin/AdminDashboard.jsx"
]

for path, content in files.items():
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
    with open(path, "w") as f:
        f.write(content)

for path in stub_files:
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
    with open(path, "w") as f:
        f.write("// TODO: " + os.path.basename(path).split('.')[0] + "\n")

print("Client files created.")
