import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden flex">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 lg:pl-80 transition-all duration-300">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        
        <main className="pt-24 pb-12 px-6 max-w-4xl mx-auto w-full min-h-[calc(100vh-80px)]">
          <Outlet />
        </main>
        
        {/* Footer */}
        <footer className="w-full py-6 px-6 border-t border-white/5 mt-auto">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <p>AdviseHub &copy; 2026 &ndash; Twoja osobista Rada Doradcza AI</p>
            <div className="flex items-center gap-4">
              <Link to="/board" className="hover:text-primary transition-colors">Moja Rada</Link>
              <Link to="/history" className="hover:text-primary transition-colors">Historia</Link>
            </div>
          </div>
        </footer>
      </div>

      {/* Ambient Decoration */}
      <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-secondary/5 rounded-full blur-[130px] pointer-events-none -z-10"></div>
    </div>
  );
}
