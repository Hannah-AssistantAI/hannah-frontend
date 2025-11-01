import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getFlaggedConversations } from '../service/mockApi';

const AppContext = createContext<any>(undefined);

const initialState = {
  user: {
    name: "Nguyễn Văn A",
    avatar: "A",
    role: "faculty"
  },
  notifications: {
    flaggedCount: 0
  },
  loading: false,
  error: null
};

const appReducer = (state: { notifications: any; }, action: { type: any; payload: any; }) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_FLAGGED_COUNT':
      return { 
        ...state, 
        notifications: { 
          ...state.notifications, 
          flaggedCount: action.payload 
        } 
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load flagged conversations count on app start
  useEffect(() => {
    const loadFlaggedCount = async () => {
      try {
        const response = await getFlaggedConversations({ status: 'Mới' });
        dispatch({ type: 'SET_FLAGGED_COUNT', payload: response.data.length });
      } catch (error) {
        console.error('Error loading flagged count:', error);
      }
    };

    loadFlaggedCount();
  }, []);

  const setLoading = (loading: any) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: any) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearError = () => {
    dispatch({
      type: 'CLEAR_ERROR',
      payload: undefined
    });
  };

  const updateFlaggedCount = (count: any) => {
    dispatch({ type: 'SET_FLAGGED_COUNT', payload: count });
  };

  const showNotification = (message: string | null, type = 'info') => {
    // Simple notification system - in real app would use toast library
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
      ${type === 'success' ? 'background-color: #52c41a;' : ''}
      ${type === 'error' ? 'background-color: #ff4d4f;' : ''}
      ${type === 'warning' ? 'background-color: #faad14;' : ''}
      ${type === 'info' ? 'background-color: #1890ff;' : ''}
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  const value = {
    ...state,
    setLoading,
    setError,
    clearError,
    updateFlaggedCount,
    showNotification
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
