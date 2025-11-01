import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { findUserByCredentials } from '../data/mockUsers';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'student' | 'faculty';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Kiểm tra tài khoản mẫu
      const mockUser = findUserByCredentials(email, password);
      if (mockUser) {
        const userData: User = {
          id: Math.random().toString(36).substr(2, 9),
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }

      // Nếu không phải tài khoản mẫu, có thể thêm logic xác thực khác ở đây
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Khôi phục user từ localStorage khi component mount
  React.useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user
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
