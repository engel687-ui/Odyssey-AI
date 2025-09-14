import { useState, useEffect } from 'react';
import { blink } from '../blink/client';

interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  });

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setAuthState({
        user: state.user ? {
          id: state.user.id,
          email: state.user.email,
          displayName: state.user.displayName,
          avatarUrl: state.user.avatarUrl
        } : null,
        isLoading: state.isLoading,
        isAuthenticated: state.isAuthenticated
      });
    });

    return unsubscribe;
  }, []);

  const login = () => {
    blink.auth.login();
  };

  const logout = () => {
    blink.auth.logout();
  };

  return {
    ...authState,
    login,
    logout
  };
};