import { useAuth } from '../../providers/AuthProvider';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { profile } = useAuth();

  return (
    <header className="fixed top-0 left-0 lg:left-80 w-full lg:w-[calc(100%-20rem)] z-40 bg-[#0e0e0e]/80 backdrop-blur-3xl flex justify-between items-center px-6 h-16 shadow-[0_4px_30px_rgba(0,252,155,0.08)] transition-all duration-300">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="lg:hidden material-symbols-outlined text-primary hover:text-white transition-colors cursor-pointer"
        >
          menu
        </button>
        <span className="material-symbols-outlined text-primary lg:hidden" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
        <h1 className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary uppercase lg:hidden">
          ADVISEHUB
        </h1>
      </div>
      
      <div className="flex items-center gap-4 ml-auto">
        <div className="hidden md:flex flex-col items-end mr-2">
          <span className="text-xs font-bold text-white">{profile?.displayName || 'Użytkownik'}</span>
          <span className="text-[10px] uppercase tracking-widest text-primary font-bold">{profile?.plan === 'premium' ? 'Plan Premium' : 'Plan Free'}</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-outline-variant/15 flex items-center justify-center overflow-hidden">
          {profile?.email ? (
            <span className="font-bold text-sm text-on-surface-variant">{profile.email.charAt(0).toUpperCase()}</span>
          ) : (
            <span className="material-symbols-outlined text-on-surface-variant">person</span>
          )}
        </div>
      </div>
    </header>
  );
}
