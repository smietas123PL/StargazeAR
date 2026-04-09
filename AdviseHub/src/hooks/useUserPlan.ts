import { useAuth } from '../providers/AuthProvider';
import { useUserSessions } from './useUserSessions';

export function useUserPlan() {
  const { profile } = useAuth();
  const { sessions } = useUserSessions();

  const plan = profile?.plan || 'free';
  const isPro = plan === 'pro' || plan === 'premium';

  // Calculate completed sessions this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  
  const completedSessionsThisMonth = sessions.filter(
    s => s.status === 'completed' && s.createdAt >= startOfMonth
  ).length;

  const MAX_FREE_SESSIONS = 5;
  const rateLimit = isPro ? 150 : 20;

  const checkFeatureAccess = (feature: 'documents' | 'customAdvisors' | 'unlimitedSessions') => {
    if (isPro) return true;

    switch (feature) {
      case 'documents':
        return false;
      case 'customAdvisors':
        return false;
      case 'unlimitedSessions':
        return completedSessionsThisMonth < MAX_FREE_SESSIONS;
      default:
        return false;
    }
  };

  return {
    plan,
    isPro,
    completedSessionsThisMonth,
    maxFreeSessions: MAX_FREE_SESSIONS,
    rateLimit,
    checkFeatureAccess
  };
}
