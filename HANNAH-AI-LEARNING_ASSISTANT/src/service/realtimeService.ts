import * as signalR from '@microsoft/signalr';

// SignalR Hub URL - needs absolute URL, not relative /api path
// In production: use VITE_SIGNALR_URL or construct from window.location
// In development: use localhost
const getHubUrl = (): string => {
    // Check for explicit SignalR URL env var
    const signalrUrl = import.meta.env.VITE_SIGNALR_URL;
    if (signalrUrl) {
        return `${signalrUrl}/hubs/realtime`;
    }

    // In production, construct from current origin
    if (import.meta.env.PROD) {
        return `${window.location.origin}/hubs/realtime`;
    }

    // Local development
    return 'http://localhost:5001/hubs/realtime';
};

const REALTIME_HUB_URL = getHubUrl();

console.log('[Realtime] Hub URL:', REALTIME_HUB_URL);

export type RealtimeEventType =
    | 'FlagCreated'
    | 'FlagResolved'
    | 'FlagAssigned'
    | 'QuizCompleted'
    | 'QuizFlagged'
    | 'DocumentUploaded'
    | 'DocumentProcessed'
    | 'DocumentDeleted'
    | 'DocumentApproved'
    | 'DocumentRejected'
    | 'AnalyticsUpdated'
    // 🆕 Studio generation events (from command handlers)
    | 'QuizGenerated'
    | 'FlashcardGenerated'
    | 'MindmapGenerated'
    // Course Management events
    | 'SubjectAddedToSemester'
    | 'SubjectRemovedFromSemester'
    | 'SubjectCreated'
    | 'SubjectUpdated'
    // Suggestion events (Learning Outcomes & Common Challenges)
    | 'SuggestionCreated'
    | 'SuggestionApproved'
    | 'SuggestionRejected'
    | 'SuggestionDeleted'
    // 🆕 Learning Progress events (Quiz score < 50% recommendations)
    | 'SessionProgressUpdated';

export interface RealtimeEvent<T = unknown> {
    type: RealtimeEventType;
    data: T;
    timestamp: Date;
}

type EventCallback<T = unknown> = (data: T) => void;

class RealtimeService {
    private connection: signalR.HubConnection | null = null;
    private eventListeners: Map<RealtimeEventType, Set<EventCallback>> = new Map();
    private isConnecting = false;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;

    /**
     * Initialize and connect to the SignalR hub
     */
    async connect(): Promise<void> {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            console.log('[Realtime] Already connected');
            return;
        }

        if (this.isConnecting) {
            console.log('[Realtime] Connection already in progress');
            return;
        }

        const token = localStorage.getItem('access_token');
        if (!token) {
            console.warn('[Realtime] No auth token found, skipping connection');
            return;
        }

        this.isConnecting = true;

        try {
            this.connection = new signalR.HubConnectionBuilder()
                .withUrl(REALTIME_HUB_URL, {
                    accessTokenFactory: () => token
                })
                .withAutomaticReconnect({
                    nextRetryDelayInMilliseconds: (retryContext) => {
                        // Exponential backoff: 0s, 2s, 4s, 8s, 16s, 32s, then cap at 30s
                        const delay = Math.min(Math.pow(2, retryContext.previousRetryCount) * 1000, 30000);
                        console.log(`[Realtime] Reconnecting in ${delay}ms (attempt ${retryContext.previousRetryCount + 1})`);
                        return delay;
                    }
                })
                .configureLogging(signalR.LogLevel.Information)
                .build();

            // Register all event handlers
            this.registerEventHandlers();

            // Connection state handlers
            this.connection.onreconnecting((error) => {
                console.warn('[Realtime] Reconnecting...', error);
            });

            this.connection.onreconnected((connectionId) => {
                console.log('[Realtime] Reconnected with ID:', connectionId);
                this.reconnectAttempts = 0;
            });

            this.connection.onclose((error) => {
                console.error('[Realtime] Connection closed:', error);
                this.isConnecting = false;
            });

            await this.connection.start();
            console.log('[Realtime] Connected successfully');
            this.reconnectAttempts = 0;
            this.isConnecting = false;

        } catch (error) {
            console.error('[Realtime] Connection failed:', error);
            this.isConnecting = false;

            // Retry connection
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, 30000);
                console.log(`[Realtime] Retrying connection in ${delay}ms`);
                setTimeout(() => this.connect(), delay);
            }
        }
    }

    /**
     * Disconnect from the SignalR hub
     */
    async disconnect(): Promise<void> {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
            console.log('[Realtime] Disconnected');
        }
    }

    /**
     * Register handlers for all event types
     * Note: SignalR JS client receives method names as lowercase
     */
    private registerEventHandlers(): void {
        if (!this.connection) return;

        const eventTypes: RealtimeEventType[] = [
            'FlagCreated',
            'FlagResolved',
            'FlagAssigned',
            'QuizCompleted',
            'QuizFlagged',
            'DocumentUploaded',
            'DocumentProcessed',
            'DocumentDeleted',
            'DocumentApproved',
            'DocumentRejected',
            'AnalyticsUpdated',
            // 🆕 Studio generation events
            'QuizGenerated',
            'FlashcardGenerated',
            'MindmapGenerated',
            // Course Management events
            'SubjectAddedToSemester',
            'SubjectRemovedFromSemester',
            'SubjectCreated',
            'SubjectUpdated',
            // Suggestion events (Learning Outcomes & Common Challenges)
            'SuggestionCreated',
            'SuggestionApproved',
            'SuggestionRejected',
            'SuggestionDeleted',
            // 🆕 Learning Progress events (Quiz score < 50% recommendations)
            'SessionProgressUpdated'
        ];

        eventTypes.forEach(eventType => {
            // Register BOTH PascalCase (sent by .NET) and lowercase versions
            // .NET SendAsync sends method name as-is (PascalCase)

            // 1. Register PascalCase (primary - from .NET)
            this.connection!.on(eventType, (data: unknown) => {
                console.log(`[Realtime] Received ${eventType}:`, data);
                this.notifyListeners(eventType, data);
            });

            // 2. Also register lowercase (fallback compatibility)
            const lowercaseEvent = eventType.toLowerCase();
            if (lowercaseEvent !== eventType) {
                this.connection!.on(lowercaseEvent, (data: unknown) => {
                    console.log(`[Realtime] Received ${lowercaseEvent} -> ${eventType}:`, data);
                    this.notifyListeners(eventType, data);
                });
            }
        });
    }

    /**
     * Notify all listeners for a specific event type
     */
    private notifyListeners(eventType: RealtimeEventType, data: unknown): void {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[Realtime] Error in ${eventType} listener:`, error);
                }
            });
        }
    }

    /**
     * Subscribe to a specific event type
     */
    on<T = unknown>(eventType: RealtimeEventType, callback: EventCallback<T>): () => void {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, new Set());
        }

        this.eventListeners.get(eventType)!.add(callback as EventCallback);

        // Return unsubscribe function
        return () => {
            this.eventListeners.get(eventType)?.delete(callback as EventCallback);
        };
    }

    /**
     * Unsubscribe from a specific event type
     */
    off<T = unknown>(eventType: RealtimeEventType, callback: EventCallback<T>): void {
        this.eventListeners.get(eventType)?.delete(callback as EventCallback);
    }

    /**
     * Join a subject group for targeted updates
     */
    async joinSubjectGroup(subjectId: number): Promise<void> {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            await this.connection.invoke('JoinSubjectGroup', subjectId);
            console.log(`[Realtime] Joined subject group: ${subjectId}`);
        }
    }

    /**
     * Leave a subject group
     */
    async leaveSubjectGroup(subjectId: number): Promise<void> {
        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            await this.connection.invoke('LeaveSubjectGroup', subjectId);
            console.log(`[Realtime] Left subject group: ${subjectId}`);
        }
    }

    /**
     * Check if connected
     */
    get isConnected(): boolean {
        return this.connection?.state === signalR.HubConnectionState.Connected;
    }

    /**
     * Get connection state
     */
    get connectionState(): signalR.HubConnectionState | null {
        return this.connection?.state ?? null;
    }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
export default realtimeService;
