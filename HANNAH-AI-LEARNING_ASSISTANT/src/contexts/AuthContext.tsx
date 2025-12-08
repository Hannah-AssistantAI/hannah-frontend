import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import authService, { type UserData } from '../service/authService';
import userService from '../service/userService';

interface AuthContextType {
  user: UserData | null;
  login: (email: string, password: string) => Promise<UserData>;
  logout: () => void;
  updateUser: (updatedData: Partial<UserData>) => void;
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
    // Let the calling component handle errors (e.g., to show a toast)
    const loginResponse = await authService.login({ email, password });

    // Set the user state with the data from the response
    setUser(loginResponse.user);

    // Return the user data so the caller can use it (e.g., for role-based redirect)
    return loginResponse.user;
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

  const updateUser = (updatedData: Partial<UserData>) => {
    if (user) {
      const updatedUser = { ...user, ...updatedData };
      setUser(updatedUser);
      authService.saveUserData(updatedUser); // Save to localStorage
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
        if (isMounted && freshUser) {
          // Fetch user profile to get currentSemester
          try {
            const profile = await userService.getUserProfile(freshUser.userId.toString());
            const userWithSemester = {
              ...freshUser,
              currentSemester: profile.currentSemester
            };
            setUser(userWithSemester);
            authService.saveUserData(userWithSemester); // Persist to localStorage
          } catch (profileError) {
            // If profile fetch fails, still set user without semester
            console.warn('Could not fetch user profile for semester:', profileError);
            setUser(freshUser);
          }
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
    updateUser,
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
