import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import chatService from '../../../service/chatService';
import conversationService from '../../../service/conversationService';
import messageService from '../../../service/messageService';
import type { Message, BigPictureTopic } from '../types';
import { parseAssistantResponse } from '../utils/messageHelpers';
import { cacheMessageData, getCachedMessageData } from '../utils/messageCache';

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
            if (!initialQuery || !conversationId || !user?.userId) return;

            console.log('🚀 Checking conversation before auto-send:', initialQuery);
            hasAutoSentRef.current = true;

            try {
                const conversationDetails = await conversationService.getConversation(conversationId, user.userId);

                // Extract subjectId from conversation if not already set
                if (conversationDetails.subjectId && !subjectId) {
                    setSubjectId(conversationDetails.subjectId);
                    console.log('📚 Subject ID from conversation:', conversationDetails.subjectId);
                }

                if (conversationDetails.messages.length > 0) {
                    console.log('⏭️ Skipping auto-send: conversation already has', conversationDetails.messages.length, 'messages');

                    const transformedMessages: Message[] = conversationDetails.messages.map(msg => {
                        // Try to get interactiveElements from backend or cache
                        let interactiveElements = msg.interactiveElements || msg.interactive_elements || msg.metadata?.interactive_elements || msg.metadata?.interactiveElements;

                        // Try to restore from cache if not provided by backend
                        if (!interactiveElements && msg.messageId && conversationId) {
                            const cached = getCachedMessageData(conversationId, msg.messageId);
                            if (cached) {
                                console.log(`  💾 ✅ AUTO-SEND: Restored from cache for message ${msg.messageId}:`, cached);
                                interactiveElements = cached;
                            }
                        }

                        const parsed = msg.role === 'assistant' ? parseAssistantResponse(msg.content, interactiveElements) : {};

                        return {
                            messageId: msg.messageId,
                            type: msg.role === 'user' || msg.role === 'student' ? 'user' : 'assistant',
                            content: msg.content,
                            isStreaming: false,
                            isFlagged: false,
                            suggestedQuestions: [],
                            images: msg.images || [],
                            ...parsed
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
                    conversationId,
                    initialQuery,
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

                // Cache interactive elements for persistence
                if (response.assistantMessage.messageId && conversationId) {
                    console.log('💾 SAVING TO CACHE:', {
                        conversationId,
                        messageId: response.assistantMessage.messageId,
                        data: {
                            interactiveList: parsedResponse.interactiveList,
                            suggestedQuestions: parsedResponse.suggestedQuestions,
                            outline: parsedResponse.outline,
                            youtubeResources: parsedResponse.youtubeResources
                        }
                    });
                    cacheMessageData(conversationId, response.assistantMessage.messageId, {
                        interactiveList: parsedResponse.interactiveList,
                        suggestedQuestions: parsedResponse.suggestedQuestions,
                        outline: parsedResponse.outline,
                        youtubeResources: parsedResponse.youtubeResources
                    });
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
                        images: response.assistantMessage.images || []
                    };
                    console.log('🖼️ Images in message:', newMessages[1].images);
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
        if (locationState?.conversationId) {
            setConversationId(locationState.conversationId);
        }
    }, [locationState]);

    // Reload messages when conversationId changes
    useEffect(() => {
        if (conversationId && !initialQuery && user?.userId) {
            const loadConversationHistory = async () => {
                try {
                    console.log('📥 Loading conversation history for ID:', conversationId);

                    const conversationDetails = await conversationService.getConversation(conversationId, user.userId);
                    console.log('✅ Loaded conversation:', conversationDetails);

                    // Extract subjectId from conversation if not already set
                    if (conversationDetails.subjectId && !subjectId) {
                        setSubjectId(conversationDetails.subjectId);
                        console.log('📚 Subject ID from loaded conversation:', conversationDetails.subjectId);
                    }

                    const transformedMessages: Message[] = conversationDetails.messages.map((msg, index) => {
                        console.log(`🔍 Processing message ${index}:`, msg);
                        console.log(`  - role:`, msg.role);
                        console.log(`  - content type:`, typeof msg.content);
                        console.log(`  - content:`, msg.content);
                        console.log(`  - interactiveElements:`, msg.interactiveElements);
                        console.log(`  - interactive_elements:`, msg.interactive_elements);
                        console.log(`  - metadata:`, msg.metadata);

                        let interactiveElements = msg.interactiveElements || msg.interactive_elements || msg.metadata?.interactive_elements || msg.metadata?.interactiveElements;

                        // Try to restore from cache if not provided by backend
                        if (!interactiveElements && msg.messageId && conversationId) {
                            console.log(`  🔍 CACHE LOOKUP for message ${msg.messageId} in conversation ${conversationId}`);
                            const cached = getCachedMessageData(conversationId, msg.messageId);
                            if (cached) {
                                console.log(`  💾 ✅ RESTORED FROM CACHE:`, cached);
                                interactiveElements = cached;
                            } else {
                                console.log(`  💾 ❌ NO CACHE FOUND`);
                            }
                        }

                        console.log(`  - extracted interactiveElements:`, interactiveElements);

                        const parsed = msg.role === 'assistant'
                            ? parseAssistantResponse(msg.content, interactiveElements)
                            : {};

                        console.log(`  - parsed result:`, parsed);

                        return {
                            messageId: msg.messageId,
                            type: msg.role === 'user' || msg.role === 'student' ? 'user' : 'assistant',
                            content: msg.content,
                            isStreaming: false,
                            isFlagged: false,
                            suggestedQuestions: [],
                            ...parsed
                        };
                    });

                    setMessages(transformedMessages);
                    setBigPictureData([]);

                    transformedMessages.forEach(msg => {
                        if (msg.type === 'assistant' && msg.outline && msg.outline.length > 0) {
                            setBigPictureData(msg.outline);
                        }
                    });
                } catch (error) {
                    console.error('❌ Failed to load conversation:', error);
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
        if (!conversationId || !user?.userId) {
            console.error('No conversation ID or user ID available');
            return;
        }

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

        try {
            const isFirstMessageInConversation = initialQuery ? messages.length === 1 : messages.length === 0;

            if (isFirstMessageInConversation) {
                console.log('📝 Updating conversation title...');
                const conversationTitle = userMessage.length > 50
                    ? userMessage.substring(0, 50) + '...'
                    : userMessage;
                await conversationService.updateConversation(conversationId, {
                    userId: user.userId,
                    title: conversationTitle
                });
            }

            console.log('🤖 Sending to chat API...');
            console.log('📚 Using Subject ID:', subjectId);
            const response = await chatService.sendTextMessage(
                conversationId,
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

            // Cache interactive elements for persistence
            if (response.assistantMessage.messageId && conversationId) {
                cacheMessageData(conversationId, response.assistantMessage.messageId, {
                    interactiveList: parsedResponse.interactiveList,
                    suggestedQuestions: parsedResponse.suggestedQuestions,
                    outline: parsedResponse.outline,
                    youtubeResources: parsedResponse.youtubeResources
                });
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
                    images: response.assistantMessage.images || []
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
                response.assistantMessage.interactiveElements  // ✅ FIX: Pass interactiveElements
            );

            if (parsedResponse.outline && parsedResponse.outline.length > 0) {
                setBigPictureData(parsedResponse.outline);
            }

            // Cache interactive elements for persistence
            if (response.assistantMessage.messageId && conversationId) {
                console.log('💾 SAVING TO CACHE (interactive item):', {
                    conversationId,
                    messageId: response.assistantMessage.messageId,
                    data: {
                        interactiveList: parsedResponse.interactiveList,
                        suggestedQuestions: parsedResponse.suggestedQuestions,
                        outline: parsedResponse.outline,
                        youtubeResources: parsedResponse.youtubeResources
                    }
                });
                cacheMessageData(conversationId, response.assistantMessage.messageId, {
                    interactiveList: parsedResponse.interactiveList,
                    suggestedQuestions: parsedResponse.suggestedQuestions,
                    outline: parsedResponse.outline,
                    youtubeResources: parsedResponse.youtubeResources
                });
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
                    images: response.assistantMessage.images || []
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
