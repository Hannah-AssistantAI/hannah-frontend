import { useState, useEffect, useRef, useCallback } from 'react';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8001';

export interface MonitoringData {
    system: {
        cpu: number;
        memory: { used: number; total: number; percent: number };
        disk: { used: number; total: number; percent: number };
        uptime: string;
    };
    database: {
        mongodb: {
            status: string;
            activeConnections: number;
            maxConnections: number;
            totalOperations: number;
            size: string;
            collections: number;
        };
        elasticsearch: {
            status?: string;
            indexedDocuments: number;
            avgSearchTime: number;
            indexSize: string;
        };
    };
    infrastructure: {
        rabbitmq: {
            status: string;
            connected: boolean;
            queues: Array<{ name: string; messages: number; consumers: number }>;
            totalMessages: number;
            totalConsumers: number;
        };
        minio: {
            status: string;
            connected?: boolean;
            buckets?: Array<{ name: string; objects: number; size: string }>;
            totalBuckets?: number;
            totalObjects?: number;
            totalSize?: string;
            message?: string;
        };
    };
}

interface WebSocketMessage {
    type: string;
    timestamp: string;
    data: MonitoringData;
}

interface UseMonitoringWebSocketResult {
    data: MonitoringData | null;
    isConnected: boolean;
    error: string | null;
    reconnect: () => void;
}

export function useMonitoringWebSocket(): UseMonitoringWebSocketResult {
    const [data, setData] = useState<MonitoringData | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    const connect = useCallback(() => {
        try {
            const ws = new WebSocket(`${WS_BASE_URL}/api/v1/monitoring/ws`);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('[Monitoring WS] Connected');
                setIsConnected(true);
                setError(null);
                reconnectAttempts.current = 0;
            };

            ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);
                    if (message.type === 'metrics_update') {
                        setData(message.data);
                    }
                } catch (e) {
                    console.error('[Monitoring WS] Parse error:', e);
                }
            };

            ws.onerror = (event) => {
                console.error('[Monitoring WS] Error:', event);
                setError('WebSocket connection error');
            };

            ws.onclose = (event) => {
                console.log('[Monitoring WS] Disconnected:', event.code, event.reason);
                setIsConnected(false);
                wsRef.current = null;

                // Auto-reconnect with exponential backoff
                if (reconnectAttempts.current < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                    console.log(`[Monitoring WS] Reconnecting in ${delay}ms...`);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttempts.current++;
                        connect();
                    }, delay);
                } else {
                    setError('Max reconnection attempts reached. Click to retry.');
                }
            };
        } catch (e) {
            console.error('[Monitoring WS] Connection error:', e);
            setError('Failed to connect to monitoring service');
        }
    }, []);

    const reconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
        }
        reconnectAttempts.current = 0;
        setError(null);
        connect();
    }, [connect]);

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    return { data, isConnected, error, reconnect };
}
