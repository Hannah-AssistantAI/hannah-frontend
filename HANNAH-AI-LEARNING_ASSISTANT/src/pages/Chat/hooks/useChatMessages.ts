import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import chatService from '../../../service/chatService';
import conversationService from '../../../service/conversationService';
import messageService from '../../../service/messageService';
import type { Message, BigPictureTopic } from '../types';
import { parseAssistantResponse } from '../utils/messageHelpers';


interface UseChatMessagesParams {
    initialQuery: string;
    initialConversationId: number | null;
    user: any;
    locationState: any;
    setBigPictureData: (data: BigPictureTopic[]) => void;
    setShowFlagModal: (show: boolean) => void;
    setFlaggingMessageId: (id: number | null) => void;
    setIsFlaggingMessage: (isFlagging: boolean) => void;
}

export const useChatMessages = ({
    initialQuery,
    initialConversationId,
    user,
    locationState,
    setBigPictureData,
    setShowFlagModal,
    setFlaggingMessageId,
    setIsFlaggingMessage
}: UseChatMessagesParams) => {
    const [conversationId, setConversationId] = useState<number | null>(initialConversationId);
    const [subjectId, setSubjectId] = useState<number | null>(locationState?.subjectId || null);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [messages, setMessages] = useState<Message[]>(initialQuery ? [{
        type: 'user',
        content: initialQuery
    }] : []);

    const hasAutoSentRef = useRef(false);

    // Auto-send initial query ONCE when component mounts
    useEffect(() => {
        const sendInitialQuery = async () => {
            if (hasAutoSentRef.current) return;
            if (!initialQuery || !user?.userId) return;

            // ✅ Block auto-send if coming from delete
            if (locationState?.preventAutoSend) {
                console.log('⛔ Auto-send blocked: preventAutoSend flag detected');
                hasAutoSentRef.current = true; // Mark as handled
                setMessages([]); // Clear any initial messages
                return;
            }

            console.log('🚀 Processing initial query:', initialQuery);
            hasAutoSentRef.current = true;

            try {
                // Create conversation if needed
                let currentConversationId = conversationId;
                if (!currentConversationId) {
                    console.log('📝 No conversation ID, creating new conversation...');
                    const newConv = await conversationService.createConversation({
                        userId: user.userId,
                        title: initialQuery.length > 50 ? initialQuery.substring(0, 50) + '...' : initialQuery,
                        subjectId: subjectId || undefined
                    });
                    currentConversationId = newConv.conversationId;
                    setConversationId(currentConversationId);
                    console.log('✅ Created new conversation:', currentConversationId);
                }

                const conversationDetails = await conversationService.getConversation(currentConversationId, user.userId);
                console.log('📥 Conversation details:', conversationDetails);

                // Defensive check for conversationDetails
                if (!conversationDetails) {
                    console.warn('⚠️ No conversation details returned');
                    return;
                }

                // Extract subjectId from conversation if not already set
                if (conversationDetails.subjectId && !subjectId) {
                    setSubjectId(conversationDetails.subjectId);
                    console.log('📚 Subject ID from conversation:', conversationDetails.subjectId);
                }

                if (conversationDetails.messages && conversationDetails.messages.length > 0) {
                    console.log('⏭️ Skipping auto-send: conversation already has', conversationDetails.messages.length, 'messages');

                    const transformedMessages: Message[] = conversationDetails.messages.map(msg => {
                        // Try to get interactiveElements from backend or cache
                        let interactiveElements = msg.interactiveElements || msg.interactive_elements || msg.metadata?.interactive_elements || msg.metadata?.interactiveElements;

                        const parsed = msg.role === 'assistant' ? parseAssistantResponse(msg.content, interactiveElements) : {};

                        return {
                            messageId: msg.messageId,
                            type: msg.role === 'user' || msg.role === 'student' ? 'user' : 'assistant',
                            content: msg.content,
                            isStreaming: false,
                            isFlagged: false,
                            suggestedQuestions: [],
                            ...parsed,
                            // Override with actual data to prevent parsed undefined from overriding
                            images: msg.images || msg.metadata?.images || (parsed as any).images || []
                        };
                    });

                    setMessages(transformedMessages);

                    transformedMessages.forEach(msg => {
                        if (msg.type === 'assistant' && msg.outline && msg.outline.length > 0) {
                            setBigPictureData(msg.outline);
                        }
                    });

                    return;
                }

                console.log('✅ Conversation empty, proceeding with auto-send');
                console.log('📚 Using Subject ID:', subjectId);
                setIsSendingMessage(true);

                setMessages(prev => [...prev, {
                    type: 'assistant',
                    content: 'Đang suy nghĩ...',
                    isStreaming: true
                }]);

                const response = await chatService.sendTextMessage(
                    currentConversationId,
                    initialQuery,
                    subjectId || undefined
                );

                // Save auto-detected subject_id from backend
                if (response.detectedSubjectId && !subjectId) {
                    console.log('💾 Saving detected subject_id:', response.detectedSubjectId);
                    setSubjectId(response.detectedSubjectId);
                }

                // 🌐 DEBUG: Log detected language
                console.log('🌐 Language Detection Debug:', {
                    detectedLanguage: response.detectedLanguage,
                    detected_language: response.detected_language,
                    fullResponse: response
                });

                const parsedResponse = parseAssistantResponse(
                    response.assistantMessage.content.data,
                    response.assistantMessage.interactiveElements
                );

                // 🔍 DEBUG: Log full response to see images
                console.log('🔍 Full Response Structure:', {
                    hasImages: !!response.assistantMessage.images,
                    hasMetadataImages: !!response.assistantMessage.metadata?.images,
                    hasInteractiveElementsImages: !!(response.assistantMessage.interactiveElements as any)?.images,
                    imagesCount: response.assistantMessage.images?.length || 0,
                    metadataImagesCount: response.assistantMessage.metadata?.images?.length || 0,
                    images: response.assistantMessage.images,
                    metadataImages: response.assistantMessage.metadata?.images,
                    fullResponse: response.assistantMessage
                });

                // 🔍 DEBUG: Check what images we're about to set
                const imagesToSet = response.assistantMessage.images || response.assistantMessage.metadata?.images || [];
                console.log('📸 Images to set in message:', imagesToSet);
                console.log('📸 Images array length:', imagesToSet.length);
                if (imagesToSet.length > 0) {
                    console.log('📸 First image:', imagesToSet[0]);
                }

                if (parsedResponse.outline && parsedResponse.outline.length > 0) {
                    setBigPictureData(parsedResponse.outline);
                }

                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[1] = {
                        messageId: response.assistantMessage.messageId,
                        type: 'assistant',
                        content: parsedResponse.content,
                        isStreaming: false,
                        isFlagged: false,
                        suggestedQuestions: parsedResponse.suggestedQuestions || response.assistantMessage.interactiveElements?.suggestedQuestions || [],
                        interactiveList: parsedResponse.interactiveList,
                        outline: parsedResponse.outline,
                        youtubeResources: parsedResponse.youtubeResources,
                        images: response.assistantMessage.images || response.assistantMessage.metadata?.images || [],
                        detectedLanguage: (response.detectedLanguage || response.detected_language) as 'vi' | 'en' | undefined
                    };

                    // 🔍 DEBUG: Verify images are set correctly
                    console.log('🖼️ Images in message object:', newMessages[1].images);
                    console.log('🖼️ Images count in message:', newMessages[1].images?.length || 0);
                    console.log('🖼️ Full message object:', newMessages[1]);

                    return newMessages;
                });
            } catch (error: any) {
                console.error('❌ Failed to get initial response:', error);
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[1] = {
                        type: 'assistant',
                        content: 'Xin lỗi, đã có lỗi xảy ra khi tải câu trả lời. Vui lòng thử lại.',
                        isStreaming: false,
                        suggestedQuestions: []
                    };
                    return newMessages;
                });
            } finally {
                setIsSendingMessage(false);
            }
        };

        sendInitialQuery();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Update conversationId when location state changes
    useEffect(() => {
        // Check if we have a timestamp (indicates intentional navigation, e.g., from New Chat or delete)
        const isIntentionalNavigation = locationState?.timestamp !== undefined;

        if (locationState?.conversationId) {
            setConversationId(locationState.conversationId);
        } else if (isIntentionalNavigation && locationState?.conversationId === null) {
            // ✅ Reset state when navigating to New Chat (conversationId explicitly set to null)
            console.log('🧹 Resetting chat state for New Chat');
            setConversationId(null);
            setMessages([]);
            setBigPictureData([]);
            setSubjectId(null);
            hasAutoSentRef.current = false; // Allow auto-send for next conversation
        } else if (locationState?.preventAutoSend) {
            // Legacy support: Reset state when navigating with preventAutoSend flag
            console.log('🧹 Resetting chat state due to preventAutoSend flag');
            setConversationId(null);
            setMessages([]);
            setBigPictureData([]);
        }
    }, [locationState, setBigPictureData]);

    // Reload messages when conversationId changes
    useEffect(() => {
        if (conversationId && !initialQuery && user?.userId) {
            // ✅ Prevent overwriting optimistic state when sending a message
            if (isSendingMessage) {
                console.log('⏳ Skipping history load while sending message...');
                return;
            }

            const loadConversationHistory = async () => {
                try {
                    console.log('📥 Loading conversation history for ID:', conversationId);

                    const conversationDetails = await conversationService.getConversation(conversationId, user.userId);
                    console.log('✅ Loaded conversation:', conversationDetails);

                    // Defensive check for conversationDetails
                    if (!conversationDetails) {
                        console.warn('⚠️ No conversation details returned');
                        return;
                    }

                    // Extract subjectId from conversation if not already set
                    if (conversationDetails.subjectId && !subjectId) {
                        setSubjectId(conversationDetails.subjectId);
                        console.log('📚 Subject ID from loaded conversation:', conversationDetails.subjectId);
                    }

                    const messages = conversationDetails.messages || [];
                    const transformedMessages: Message[] = messages.map((msg, index) => {
                        console.log(`🔍 Processing message ${index}:`, msg);
                        console.log(`  - role:`, msg.role);

                        // Try to get interactiveElements from backend
                        let interactiveElements = msg.interactiveElements || msg.interactive_elements || msg.metadata?.interactive_elements || msg.metadata?.interactiveElements;

                        const parsed = msg.role === 'assistant' ? parseAssistantResponse(msg.content, interactiveElements) : {};
                        console.log(`  - parsed result:`, parsed);

                        return {
                            messageId: msg.messageId,
                            type: msg.role === 'user' || msg.role === 'student' ? 'user' : 'assistant',
                            content: msg.content,
                            isStreaming: false,
                            isFlagged: false,
                            suggestedQuestions: [],
                            ...parsed,
                            // Override with actual data to prevent parsed undefined from overriding
                            images: msg.images || msg.metadata?.images || (parsed as any).images || []
                        };
                    });

                    setMessages(transformedMessages);
                    setBigPictureData([]);

                    transformedMessages.forEach(msg => {
                        if (msg.type === 'assistant' && msg.outline && msg.outline.length > 0) {
                            setBigPictureData(msg.outline);
                        }
                    });
                } catch (error: any) {
                    console.error('❌ Failed to load conversation:', error);

                    // Check if conversation was deleted (404 or similar)
                    if (error?.response?.status === 404 || error?.message?.includes('not found') || error?.message?.includes('deleted')) {
                        console.log('🧹 Conversation was deleted, resetting to empty state');
                        setConversationId(null);
                        setMessages([]);
                        setBigPictureData([]);
                        setSubjectId(null);
                        return;
                    }

                    setMessages([{
                        type: 'assistant',
                        content: 'Xin lỗi, không thể tải cuộc trò chuyện này. Vui lòng thử lại.',
                        isStreaming: false,
                        suggestedQuestions: []
                    }]);
                }
            };

            loadConversationHistory();
        }
    }, [conversationId, initialQuery, user?.userId, setBigPictureData]);

    const handleSend = async (userMessage: string) => {
        if (!userMessage.trim()) return;
        if (isSendingMessage) return;

        // ✅ 1. Update UI immediately (Optimistic UI)
        setMessages(prev => [...prev, {
            type: 'user',
            content: userMessage
        }]);

        const loadingMessageIndex = messages.length + 1;
        setMessages(prev => [...prev, {
            type: 'assistant',
            content: 'Đang suy nghĩ...',
            isStreaming: true
        }]);

        setIsSendingMessage(true);

        // ✅ 2. Lazy create conversation if needed (e.g., after delete)
        let currentConversationId = conversationId;

        if (!currentConversationId && user?.userId) {
            console.log('📝 No conversation ID, creating new conversation...');
            try {
                const newConv = await conversationService.createConversation({
                    userId: user.userId,
                    title: userMessage.length > 50
                        ? userMessage.substring(0, 50) + '...'
                        : userMessage,
                    subjectId: subjectId || undefined
                });
                currentConversationId = newConv.conversationId;
                setConversationId(currentConversationId);
                console.log('✅ Created new conversation:', currentConversationId);
            } catch (error) {
                console.error('Failed to create conversation:', error);
                // Remove the optimistic messages on failure
                setMessages(prev => prev.slice(0, -2));
                setIsSendingMessage(false);
                return;
            }
        }

        if (!currentConversationId || !user?.userId) {
            console.error('No conversation ID or user ID available');
            setMessages(prev => prev.slice(0, -2)); // Cleanup
            setIsSendingMessage(false);
            return;
        }

        try {
            const isFirstMessageInConversation = initialQuery ? messages.length === 1 : messages.length === 0;

            if (isFirstMessageInConversation) {
                console.log('📝 Updating conversation title...');
                const conversationTitle = userMessage.length > 50
                    ? userMessage.substring(0, 50) + '...'
                    : userMessage;
                await conversationService.updateConversation(currentConversationId, {
                    userId: user.userId,
                    title: conversationTitle
                });
            }

            console.log('🤖 Sending to chat API...');
            console.log('📚 Using Subject ID:', subjectId);
            const response = await chatService.sendTextMessage(
                currentConversationId,
                userMessage,
                subjectId || undefined
            );

            // Save auto-detected subject_id from backend
            if (response.detectedSubjectId && !subjectId) {
                console.log('💾 Saving detected subject_id:', response.detectedSubjectId);
                setSubjectId(response.detectedSubjectId);
            }

            const parsedResponse = parseAssistantResponse(
                response.assistantMessage.content.data,
                response.assistantMessage.interactiveElements
            );

            if (parsedResponse.outline && parsedResponse.outline.length > 0) {
                setBigPictureData(parsedResponse.outline);
            }

            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[loadingMessageIndex] = {
                    messageId: response.assistantMessage.messageId,
                    type: 'assistant',
                    content: parsedResponse.content,
                    isStreaming: false,
                    isFlagged: false,
                    suggestedQuestions: parsedResponse.suggestedQuestions || response.assistantMessage.interactiveElements?.suggestedQuestions || [],
                    interactiveList: parsedResponse.interactiveList,
                    outline: parsedResponse.outline,
                    youtubeResources: parsedResponse.youtubeResources,
                    images: response.assistantMessage.images || response.assistantMessage.metadata?.images || [],
                    detectedLanguage: (response.detectedLanguage || response.detected_language) as 'vi' | 'en' | undefined
                };
                return newMessages;
            });

            console.log('✅ Message sent successfully');
        } catch (error: any) {
            console.error('❌ Failed to send message:', error);
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[loadingMessageIndex] = {
                    type: 'assistant',
                    content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
                    isStreaming: false,
                    suggestedQuestions: []
                };
                return newMessages;
            });
        } finally {
            setIsSendingMessage(false);
        }
    };

    const handleInteractiveItemClick = async (itemTerm: string) => {
        if (isSendingMessage) return;
        if (!conversationId || !user?.userId) {
            console.error('Missing conversation ID or user ID');
            return;
        }

        setMessages(prev => [...prev, {
            type: 'user',
            content: itemTerm
        }]);

        const loadingMessageIndex = messages.length + 1;
        setMessages(prev => [...prev, {
            type: 'assistant',
            content: 'Đang suy nghĩ...',
            isStreaming: true
        }]);

        setIsSendingMessage(true);

        try {
            console.log('🤖 Sending interactive item query:', itemTerm);
            console.log('📚 Using Subject ID:', subjectId);
            const response = await chatService.sendTextMessage(
                conversationId,
                itemTerm,
                subjectId || undefined
            );

            // Save auto-detected subject_id from backend
            if (response.detectedSubjectId && !subjectId) {
                console.log('💾 Saving detected subject_id:', response.detectedSubjectId);
                setSubjectId(response.detectedSubjectId);
            }

            const parsedResponse = parseAssistantResponse(
                response.assistantMessage.content.data,
                response.assistantMessage.interactiveElements
            );

            if (parsedResponse.outline && parsedResponse.outline.length > 0) {
                setBigPictureData(parsedResponse.outline);
            }

            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[loadingMessageIndex] = {
                    messageId: response.assistantMessage.messageId,
                    type: 'assistant',
                    content: parsedResponse.content,
                    isStreaming: false,
                    isFlagged: false,
                    suggestedQuestions: parsedResponse.suggestedQuestions || response.assistantMessage.interactiveElements?.suggestedQuestions || [],
                    interactiveList: parsedResponse.interactiveList,
                    outline: parsedResponse.outline,
                    youtubeResources: parsedResponse.youtubeResources,
                    images: response.assistantMessage.images || response.assistantMessage.metadata?.images || [],
                    detectedLanguage: (response.detectedLanguage || response.detected_language) as 'vi' | 'en' | undefined
                };
                return newMessages;
            });

            console.log('✅ Interactive item query sent successfully');
        } catch (error: any) {
            console.error('❌ Failed to send interactive item query:', error);
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[loadingMessageIndex] = {
                    type: 'assistant',
                    content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
                    isStreaming: false,
                    suggestedQuestions: []
                };
                return newMessages;
            });
        } finally {
            setIsSendingMessage(false);
        }
    };

    const handleFlagMessage = async (flaggingMessageId: number, reason: string) => {
        if (!flaggingMessageId || !conversationId || !user?.userId) {
            toast.error('Thiếu thông tin cần thiết');
            return;
        }

        setIsFlaggingMessage(true);

        const requestData = {
            conversationId: conversationId,
            userId: user.userId,
            reason: reason.trim()
        };

        console.log('📤 Flag Request:', requestData);

        try {
            const response = await messageService.flagMessage(flaggingMessageId, requestData);
            console.log('✅ Success:', response);

            setMessages(prev => prev.map(msg =>
                msg.messageId === flaggingMessageId
                    ? { ...msg, isFlagged: true }
                    : msg
            ));

            toast.success('Đã báo cáo tin nhắn thành công!');
            setShowFlagModal(false);
            setFlaggingMessageId(null);
        } catch (error: any) {
            console.error('❌ Error:', error);
            const errorMessage = error?.message || 'Không thể báo cáo tin nhắn';
            toast.error(errorMessage);
        } finally {
            setIsFlaggingMessage(false);
        }
    };

    return {
        messages,
        setMessages,
        conversationId,
        setConversationId,
        isSendingMessage,
        handleSend,
        handleInteractiveItemClick,
        handleFlagMessage
    };
};
