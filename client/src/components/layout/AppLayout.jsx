import { Outlet } from 'react-router-dom';
export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 bg-gray-800 text-white">SANJAYA Navbar</header>
      <main className="flex-1"><Outlet /></main>
      <footer className="p-4 bg-gray-900 text-gray-400">Footer</footer>
    </div>
  );
}