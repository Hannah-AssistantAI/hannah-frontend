import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import authService, { type UserData } from '../service/authService';

interface AuthContextType {
  user: UserData | null;
  login: (email: string, password: string) => Promise<UserData>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start true to check session

  const login = async (email: string, password: string): Promise<UserData> => {
    // No try-catch here, let the caller handle it.
    const response = await authService.login({ email, password });
    // After successful login, authService saves user data. We can trust it's in localStorage.
    // Or better, just use the response directly.
    setUser(response.user);
    return response.user;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed but clearing session anyway:', error);
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component

    const checkSession = async () => {
      setIsLoading(true);
      try {
        // First, try to get user data from local storage for a faster UI response
        const cachedUser = authService.getUserData();
        if (isMounted && cachedUser) {
          setUser(cachedUser);
        }

        // Then, verify with the server
        const freshUser = await authService.getCurrentUser();
        if (isMounted) {
          setUser(freshUser);
        }
      } catch (error) {
        // If token is invalid or expired, clear session
        if (isMounted) {
          setUser(null);
          authService.clearTokens(); // Ensure everything is cleared
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
