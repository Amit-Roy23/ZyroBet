import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../api/authApi';
import { useToast } from '@/components/ui/Toast';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isOnboarded,
    isLoading,
    signInAsGuest,
    signOut: storeSignOut,
    setIsOnboarded,
    setUser,
  } = useAuthStore();
  const { showToast } = useToast();

  const handleGuestSignIn = () => {
    signInAsGuest();
    showToast({ message: 'Welcome to ZyroBet! 1,000 Starting Coins added.', type: 'coin' });
  };

  const handleSignOut = async () => {
    await authApi.signOut();
    storeSignOut();
    showToast({ message: 'Signed out successfully.', type: 'info' });
  };

  return {
    user,
    isAuthenticated,
    isOnboarded,
    isLoading,
    signInAsGuest: handleGuestSignIn,
    signOut: handleSignOut,
    setIsOnboarded,
    setUser,
  };
}
