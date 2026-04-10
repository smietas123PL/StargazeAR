import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { loadEnv } from 'vite';
import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    test: {
      environment: 'jsdom',
      globals: true,
      css: true,
      setupFiles: './src/test/setup.ts',
      coverage: {
        provider: 'v8',
        all: true,
        reporter: ['text', 'html'],
        include: [
          'src/App.tsx',
          'src/main.tsx',
          'src/pages/DecisionTracker.tsx',
          'src/pages/Home.tsx',
          'src/pages/Marketplace.tsx',
          'src/pages/SessionLive.tsx',
          'src/pages/VoiceChat.tsx',
          'src/components/auth/ProtectedRoute.tsx',
          'src/components/features/AdvisorCard.tsx',
          'src/components/features/AdvisorPill.tsx',
          'src/components/features/AdvisorSelectionCard.tsx',
          'src/components/features/AdvisorTemplateCard.tsx',
          'src/components/features/ExportPDFButton.tsx',
          'src/components/features/FinalVerdictCard.tsx',
          'src/components/features/MarketplaceTemplateCard.tsx',
          'src/components/features/MessageBubble.tsx',
          'src/components/features/PeerReviewCard.tsx',
          'src/components/features/PricingCard.tsx',
          'src/components/features/ShareSessionModal.tsx',
          'src/components/features/UpgradeModal.tsx',
          'src/components/layout/Header.tsx',
          'src/components/layout/MainLayout.tsx',
          'src/components/layout/Sidebar.tsx',
          'src/components/ui/badge.tsx',
          'src/components/ui/button.tsx',
          'src/components/ui/card.tsx',
          'src/components/ui/dialog.tsx',
          'src/components/ui/input.tsx',
          'src/components/ui/label.tsx',
          'src/components/ui/select.tsx',
          'src/components/ui/sheet.tsx',
          'src/components/ui/skeleton.tsx',
          'src/components/ui/sonner.tsx',
          'src/components/ui/switch.tsx',
          'src/components/ui/textarea.tsx',
          'src/hooks/useAdvisors.ts',
          'src/hooks/useContinueConversation.ts',
          'src/hooks/useCreateSession.ts',
          'src/hooks/useCustomAdvisors.ts',
          'src/hooks/useExportPDF.ts',
          'src/hooks/useDecisionFollowUp.ts',
          'src/hooks/useRunChairman.ts',
          'src/hooks/useRunCouncil.ts',
          'src/hooks/useRunPeerReview.ts',
          'src/hooks/useSession.ts',
          'src/hooks/useSettings.ts',
          'src/hooks/useSharedSessions.ts',
          'src/hooks/useUserPlan.ts',
          'src/hooks/useUserSessions.ts',
          'src/hooks/useVoiceChat.ts',
          'src/lib/utils.ts',
          'src/providers/AuthProvider.tsx',
          'src/services/ai/liveVoiceService.ts',
          'src/services/audio/AudioPlayer.ts',
          'src/services/audio/AudioRecorder.ts',
          'src/services/firebase/voiceChatDb.ts',
        ],
        exclude: [
          ...coverageConfigDefaults.exclude,
          'src/test/**',
        ],
        thresholds: {
          lines: 100,
          functions: 100,
          statements: 100,
          branches: 100,
        },
      },
    },
  };
});



