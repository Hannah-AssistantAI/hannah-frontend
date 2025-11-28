/**
 * Message Cache Utility
 * Caches interactive elements for messages to persist across page reloads
 * This is a workaround for the backend not returning interactiveElements in conversation history
 */

interface CachedMessageData {
    interactiveList?: any[];
    suggestedQuestions?: string[];
    outline?: any[];
    youtubeResources?: any[];
    timestamp: number;
}

const CACHE_KEY_PREFIX = 'msg_cache_';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Cache interactive elements for a message
 */
export const cacheMessageData = (
    conversationId: number,
    messageId: number,
    data: {
        interactiveList?: any[];
        suggestedQuestions?: string[];
        outline?: any[];
        youtubeResources?: any[];
    }
) => {
    try {
        const cacheKey = `${CACHE_KEY_PREFIX}${conversationId}_${messageId}`;
        const cachedData: CachedMessageData = {
            ...data,
            timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(cachedData));
    } catch (error) {
        console.warn('Failed to cache message data:', error);
    }
};

/**
 * Retrieve cached interactive elements for a message
 */
export const getCachedMessageData = (
    conversationId: number,
    messageId: number
): Omit<CachedMessageData, 'timestamp'> | null => {
    try {
        const cacheKey = `${CACHE_KEY_PREFIX}${conversationId}_${messageId}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (!cached) return null;
        
        const data: CachedMessageData = JSON.parse(cached);
        
        // Check if cache is expired
        if (Date.now() - data.timestamp > CACHE_EXPIRY_MS) {
            localStorage.removeItem(cacheKey);
            return null;
        }
        
        // Return data without timestamp
        const { timestamp, ...messageData } = data;
        return messageData;
    } catch (error) {
        console.warn('Failed to retrieve cached message data:', error);
        return null;
    }
};

/**
 * Clear all cached message data for a conversation
 */
export const clearConversationCache = (conversationId: number) => {
    try {
        const keys = Object.keys(localStorage);
        const prefix = `${CACHE_KEY_PREFIX}${conversationId}_`;
        
        keys.forEach(key => {
            if (key.startsWith(prefix)) {
                localStorage.removeItem(key);
            }
        });
    } catch (error) {
        console.warn('Failed to clear conversation cache:', error);
    }
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = () => {
    try {
        const keys = Object.keys(localStorage);
        const now = Date.now();
        
        keys.forEach(key => {
            if (key.startsWith(CACHE_KEY_PREFIX)) {
                const cached = localStorage.getItem(key);
                if (cached) {
                    const data: CachedMessageData = JSON.parse(cached);
                    if (now - data.timestamp > CACHE_EXPIRY_MS) {
                        localStorage.removeItem(key);
                    }
                }
            }
        });
    } catch (error) {
        console.warn('Failed to clear expired cache:', error);
    }
};
