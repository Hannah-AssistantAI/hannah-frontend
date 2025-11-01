import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface FacultyContextType {
  flaggedConversationsCount: number;
  setFlaggedConversationsCount: (count: number) => void;
}

const FacultyContext = createContext<FacultyContextType | undefined>(undefined);

export const useFacultyContext = () => {
  const context = useContext(FacultyContext);
  if (!context) {
    throw new Error('useFacultyContext must be used within FacultyProvider');
  }
  return context;
};

interface FacultyProviderProps {
  children: ReactNode;
}

export const FacultyProvider: React.FC<FacultyProviderProps> = ({ children }) => {
  const [flaggedConversationsCount, setFlaggedConversationsCount] = useState(0);

  return (
    <FacultyContext.Provider value={{ flaggedConversationsCount, setFlaggedConversationsCount }}>
      {children}
    </FacultyContext.Provider>
  );
};
