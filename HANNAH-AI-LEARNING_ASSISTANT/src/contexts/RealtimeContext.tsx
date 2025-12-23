import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import realtimeService from '../service/realtimeService';
import { useAuth } from './AuthContext';

interface RealtimeContextType {
    isConnected: boolean;
    connectionState: string | null;
    joinSubjectGroup: (subjectId: number) => Promise<void>;
    leaveSubjectGroup: (subjectId: number) => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export const useRealtimeContext = () => {
    const context = useContext(RealtimeContext);
    if (!context) {
        throw new Error('useRealtimeContext must be used within a RealtimeProvider');
    }
    return context;
};

interface RealtimeProviderProps {
    children: ReactNode;
}

/**
 * Provider component that manages the SignalR real-time connection.
 * Automatically connects when user is authenticated and disconnects on logout.
 */
export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let mounted = true;

        const connect = async () => {
            if (isAuthenticated && user) {
                console.log('[RealtimeProvider] User authenticated, attempting connection...', { userId: user.id, role: user.role });
                try {
                    await realtimeService.connect();
                    if (mounted) {
                        const connected = realtimeService.isConnected;
                        console.log('[RealtimeProvider] Connection result:', connected);
                        setIsConnected(connected);
                    }
                } catch (error) {
                    console.error('[RealtimeProvider] Failed to connect:', error);
                }
            } else {
                console.log('[RealtimeProvider] Not authenticated, skipping connection');
            }
        };

        const disconnect = async () => {
            try {
                await realtimeService.disconnect();
                if (mounted) {
                    setIsConnected(false);
                }
            } catch (error) {
                console.error('[RealtimeProvider] Failed to disconnect:', error);
            }
        };

        if (isAuthenticated && user) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            mounted = false;
        };
    }, [isAuthenticated, user]);

    // Update connection status periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setIsConnected(realtimeService.isConnected);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const value: RealtimeContextType = {
        isConnected,
        connectionState: realtimeService.connectionState?.toString() ?? null,
        joinSubjectGroup: (subjectId: number) => realtimeService.joinSubjectGroup(subjectId),
        leaveSubjectGroup: (subjectId: number) => realtimeService.leaveSubjectGroup(subjectId),
    };

    return (
        <RealtimeContext.Provider value={value}>
            {children}
        </RealtimeContext.Provider>
    );
};

export default RealtimeProvider;
