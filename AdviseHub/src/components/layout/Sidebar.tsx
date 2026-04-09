import { NavLink } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { logout, profile } = useAuth();

  const navItems = [
    { icon: 'add_circle', label: 'Nowa Sesja', path: '/' },
    { icon: 'record_voice_over', label: 'Voice Chat', path: '/voice-setup' },
    { icon: 'account_balance', label: 'Baza Wiedzy', path: '/vault' },
    { icon: 'storefront', label: 'Marketplace', path: '/marketplace' },
    { icon: 'view_carousel', label: 'Szablony Rad', path: '/templates' },
    { icon: 'history', label: 'Historia Wywiadów', path: '/history' },
    { icon: 'track_changes', label: 'Tracker Decyzji', path: '/tracker' },
    { icon: 'group_add', label: 'Wspólne Sesje', path: '/shared' },
    { icon: 'group', label: 'Moja Rada', path: '/board' },
    { icon: 'settings', label: 'Ustawienia Systemu', path: '/settings' },
    { icon: 'workspace_premium', label: 'Cennik', path: '/pricing' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col py-8 px-4 bg-[#0e0e0e] h-full w-80 border-r border-[#131313]/50 shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-3 mb-10 px-4">
          <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
          <h2 className="text-primary font-headline font-black text-2xl uppercase tracking-tighter">AdviseHub</h2>
        </div>

        <nav className="flex flex-col gap-2 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose()}
              className={({ isActive }) => cn(
                "flex items-center gap-4 py-3 px-4 rounded-xl font-body tracking-wide text-sm font-semibold transition-all duration-300",
                isActive 
                  ? "bg-gradient-to-r from-primary/10 to-transparent text-primary border-l-4 border-primary" 
                  : "text-zinc-400 hover:text-white hover:bg-surface-container-low border-l-4 border-transparent"
              )}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4 pt-6 border-t border-white/5 mt-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              <span className="material-symbols-outlined text-primary text-3xl">account_circle</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-bold truncate">{profile?.displayName || profile?.email || 'Użytkownik'}</p>
              <p className="text-xs text-zinc-500 truncate">Plan {(profile?.plan === 'pro' || profile?.plan === 'premium') ? 'Pro' : 'Free'}</p>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="w-full text-zinc-400 hover:text-white px-4 py-3 flex items-center gap-3 font-body tracking-wide text-sm font-semibold transition-all rounded-xl hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span>Wyloguj</span>
          </button>
        </div>
      </aside>
    </>
  );
}
