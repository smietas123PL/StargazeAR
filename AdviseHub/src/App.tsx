import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { Toaster } from './components/ui/sonner';
import Login from './pages/Login';
import Home from './pages/Home';
import SessionLive from './pages/SessionLive';
import History from './pages/History';
import DecisionTracker from './pages/DecisionTracker';
import SharedSessions from './pages/SharedSessions';
import Settings from './pages/Settings';
import CustomBoard from './pages/CustomBoard';
import Pricing from './pages/Pricing';
import Landing from './pages/Landing';
import AdvisorTemplates from './pages/AdvisorTemplates';
import Marketplace from './pages/Marketplace';
import VoiceChat from './pages/VoiceChat';
import VoiceSetup from './pages/VoiceSetup';
import KnowledgeVault from './pages/KnowledgeVault';

function AppRoutes() {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#001f2e] flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,252,155,0.15)] animate-pulse">
          <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
        </div>
        <h1 className="text-2xl font-headline font-bold text-white mb-2">AdviseHub</h1>
        <p className="text-on-surface-variant text-sm">Inicjalizacja środowiska...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      
      <Route 
        path="/" 
        element={user ? <MainLayout /> : <Landing />}
      >
        {user && (
          <>
            <Route index element={<Home />} />
            <Route path="session/:sessionId" element={<SessionLive />} />
            <Route path="history" element={<History />} />
            <Route path="tracker" element={<DecisionTracker />} />
            <Route path="shared" element={<SharedSessions />} />
            <Route path="board" element={<CustomBoard />} />
            <Route path="voice-setup" element={<VoiceSetup />} />
            <Route path="voice-chat" element={<VoiceChat />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="templates" element={<AdvisorTemplates />} />
            <Route path="vault" element={<KnowledgeVault />} />
            <Route path="settings" element={<Settings />} />
            <Route path="pricing" element={<Pricing />} />
          </>
        )}
      </Route>

      {/* Public Pricing route for unauthenticated users */}
      {!user && <Route path="/pricing" element={<Pricing />} />}

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster theme="dark" position="top-center" />
      </AuthProvider>
    </BrowserRouter>
  );
}
