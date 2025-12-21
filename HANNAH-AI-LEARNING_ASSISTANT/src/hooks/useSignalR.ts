import { useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';

const SIGNALR_HUB_URL = 'http://localhost:5000/hubs/notifications';

export const useSignalR = (onNotification: (notification: any) => void) => {
    const connectionRef = useRef<signalR.HubConnection | null>(null);

    const connect = useCallback(async () => {
        const token = localStorage.getItem('access_token');

        if (!token) {
            console.warn('No auth token found, skipping SignalR connection');
            return;
        }

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(SIGNALR_HUB_URL, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        connection.on('ReceiveNotification', (notification) => {
            console.log('Received notification via SignalR:', notification);
            onNotification(notification);
        });

        connection.onreconnecting((error) => {
            console.warn('SignalR reconnecting...', error);
        });

        connection.onreconnected((connectionId) => {
            console.log('SignalR reconnected:', connectionId);
        });

        connection.onclose((error) => {
            console.error('SignalR connection closed:', error);
        });

        try {
            await connection.start();
            console.log('SignalR Connected');
            connectionRef.current = connection;
        } catch (err) {
            console.error('SignalR Connection Error:', err);
            // Retry after 5 seconds
            setTimeout(connect, 5000);
        }
    }, [onNotification]);

    useEffect(() => {
        connect();

        return () => {
            if (connectionRef.current) {
                connectionRef.current.stop();
            }
        };
    }, [connect]);

    return connectionRef.current;
};
