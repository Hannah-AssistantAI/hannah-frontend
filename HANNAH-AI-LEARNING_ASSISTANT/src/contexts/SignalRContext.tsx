/**
 * SignalR Context Provider
 * Manages WebSocket connections for real-time updates across the app
 * Connects to both NotificationHub and RealtimeHub
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import * as signalR from '@microsoft/signalr';

// SignalR Hub URLs - use production origin or env variable
const getHubUrl = (hubName: string): string => {
    const baseUrl = import.meta.env.VITE_SIGNALR_URL
        || (import.meta.env.PROD ? window.location.origin : 'http://localhost:5001');
    return `${baseUrl}/hubs/${hubName}`;
};

// Event types from backend
export type SignalREventType =
    // Flag events
    | 'FlagCreated'
    | 'FlagResolved'
    | 'FlagAssigned'
    // Document events
    | 'DocumentUploaded'
    | 'DocumentProcessed'
    | 'DocumentDeleted'
    | 'DocumentApproved'
    | 'DocumentRejected'
    // Studio generation events
    | 'QuizGenerated'
    | 'FlashcardGenerated'
    | 'MindmapGenerated'
    | 'QuizCompleted'
    | 'QuizFlagged'
    // Subject events
    | 'SubjectCreated'
    | 'SubjectUpdated'
    | 'SubjectAddedToSemester'
    | 'SubjectRemovedFromSemester'
    // Suggestion events
    | 'SuggestionCreated'
    | 'SuggestionApproved'
    | 'SuggestionRejected'
    | 'SuggestionDeleted'
    // Analytics events
    | 'AnalyticsUpdated'
    // Notification hub
    | 'ReceiveNotification';

interface SignalRContextType {
    // Connection states
    isNotificationConnected: boolean;
    isRealtimeConnected: boolean;

    // Subscribe/unsubscribe to events
    subscribe: (event: SignalREventType, callback: (data: any) => void) => void;
    unsubscribe: (event: SignalREventType, callback: (data: any) => void) => void;

    // Join subject group for targeted updates
    joinSubjectGroup: (subjectId: number) => Promise<void>;
    leaveSubjectGroup: (subjectId: number) => Promise<void>;
}

const SignalRContext = createContext<SignalRContextType | null>(null);

interface Props {
    children: ReactNode;
}

export const SignalRProvider: React.FC<Props> = ({ children }) => {
    const [isNotificationConnected, setIsNotificationConnected] = useState(false);
    const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

    const notificationConnectionRef = useRef<signalR.HubConnection | null>(null);
    const realtimeConnectionRef = useRef<signalR.HubConnection | null>(null);
    const listenersRef = useRef<Map<SignalREventType, Set<(data: any) => void>>>(new Map());

    // Build connection with auth token
    const buildConnection = useCallback((hubName: string) => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            console.warn(`[SignalR] No auth token, skipping ${hubName} connection`);
            return null;
        }

        return new signalR.HubConnectionBuilder()
            .withUrl(getHubUrl(hubName), {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Retry intervals
            .configureLogging(signalR.LogLevel.Information)
            .build();
    }, []);

    // Dispatch event to all listeners
    const dispatchEvent = useCallback((event: SignalREventType, data: any) => {
        const callbacks = listenersRef.current.get(event);
        if (callbacks) {
            callbacks.forEach(cb => {
                try {
                    cb(data);
                } catch (error) {
                    console.error(`[SignalR] Error in ${event} callback:`, error);
                }
            });
        }
    }, []);

    // Setup event handlers on connection
    const setupEventHandlers = useCallback((connection: signalR.HubConnection, hubName: string) => {
        const events: SignalREventType[] = hubName === 'realtime'
            ? [
                'FlagCreated', 'FlagResolved', 'FlagAssigned',
                'DocumentUploaded', 'DocumentProcessed', 'DocumentDeleted', 'DocumentApproved', 'DocumentRejected',
                'QuizGenerated', 'FlashcardGenerated', 'MindmapGenerated', 'QuizCompleted', 'QuizFlagged',
                'SubjectCreated', 'SubjectUpdated', 'SubjectAddedToSemester', 'SubjectRemovedFromSemester',
                'SuggestionCreated', 'SuggestionApproved', 'SuggestionRejected', 'SuggestionDeleted',
                'AnalyticsUpdated'
            ]
            : ['ReceiveNotification'];

        events.forEach(event => {
            connection.on(event, (data) => {
                console.log(`[SignalR] ${hubName}/${event}:`, data);
                dispatchEvent(event, data);
            });
        });
    }, [dispatchEvent]);

    // Start connections
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        // Connect to Notification Hub
        const notificationConn = buildConnection('notifications');
        if (notificationConn) {
            notificationConnectionRef.current = notificationConn;
            setupEventHandlers(notificationConn, 'notifications');

            notificationConn.onreconnecting(() => {
                console.log('[SignalR] Notification hub reconnecting...');
                setIsNotificationConnected(false);
            });
            notificationConn.onreconnected(() => {
                console.log('[SignalR] Notification hub reconnected');
                setIsNotificationConnected(true);
            });
            notificationConn.onclose(() => {
                console.log('[SignalR] Notification hub closed');
                setIsNotificationConnected(false);
            });

            notificationConn.start()
                .then(() => {
                    console.log('[SignalR] Notification hub connected');
                    setIsNotificationConnected(true);
                })
                .catch(err => console.error('[SignalR] Notification hub error:', err));
        }

        // Connect to Realtime Hub
        const realtimeConn = buildConnection('realtime');
        if (realtimeConn) {
            realtimeConnectionRef.current = realtimeConn;
            setupEventHandlers(realtimeConn, 'realtime');

            realtimeConn.onreconnecting(() => {
                console.log('[SignalR] Realtime hub reconnecting...');
                setIsRealtimeConnected(false);
            });
            realtimeConn.onreconnected(() => {
                console.log('[SignalR] Realtime hub reconnected');
                setIsRealtimeConnected(true);
            });
            realtimeConn.onclose(() => {
                console.log('[SignalR] Realtime hub closed');
                setIsRealtimeConnected(false);
            });

            realtimeConn.start()
                .then(() => {
                    console.log('[SignalR] Realtime hub connected');
                    setIsRealtimeConnected(true);
                })
                .catch(err => console.error('[SignalR] Realtime hub error:', err));
        }

        return () => {
            notificationConnectionRef.current?.stop();
            realtimeConnectionRef.current?.stop();
        };
    }, [buildConnection, setupEventHandlers]);

    // API: Subscribe to event
    const subscribe = useCallback((event: SignalREventType, callback: (data: any) => void) => {
        if (!listenersRef.current.has(event)) {
            listenersRef.current.set(event, new Set());
        }
        listenersRef.current.get(event)!.add(callback);
    }, []);

    // API: Unsubscribe from event
    const unsubscribe = useCallback((event: SignalREventType, callback: (data: any) => void) => {
        listenersRef.current.get(event)?.delete(callback);
    }, []);

    // API: Join subject group for targeted updates
    const joinSubjectGroup = useCallback(async (subjectId: number) => {
        if (realtimeConnectionRef.current?.state === signalR.HubConnectionState.Connected) {
            try {
                await realtimeConnectionRef.current.invoke('JoinSubjectGroup', subjectId);
                console.log(`[SignalR] Joined subject group: ${subjectId}`);
            } catch (error) {
                console.error(`[SignalR] Failed to join subject group ${subjectId}:`, error);
            }
        }
    }, []);

    // API: Leave subject group
    const leaveSubjectGroup = useCallback(async (subjectId: number) => {
        if (realtimeConnectionRef.current?.state === signalR.HubConnectionState.Connected) {
            try {
                await realtimeConnectionRef.current.invoke('LeaveSubjectGroup', subjectId);
                console.log(`[SignalR] Left subject group: ${subjectId}`);
            } catch (error) {
                console.error(`[SignalR] Failed to leave subject group ${subjectId}:`, error);
            }
        }
    }, []);

    const value: SignalRContextType = {
        isNotificationConnected,
        isRealtimeConnected,
        subscribe,
        unsubscribe,
        joinSubjectGroup,
        leaveSubjectGroup
    };

    return (
        <SignalRContext.Provider value={value}>
            {children}
        </SignalRContext.Provider>
    );
};

// Custom hook to use SignalR
export const useSignalRContext = () => {
    const context = useContext(SignalRContext);
    if (!context) {
        throw new Error('useSignalRContext must be used within SignalRProvider');
    }
    return context;
};

// Convenience hook to subscribe to specific event
export const useSignalREvent = (event: SignalREventType, callback: (data: any) => void) => {
    const { subscribe, unsubscribe } = useSignalRContext();

    useEffect(() => {
        subscribe(event, callback);
        return () => unsubscribe(event, callback);
    }, [event, callback, subscribe, unsubscribe]);
};

export default SignalRProvider;
