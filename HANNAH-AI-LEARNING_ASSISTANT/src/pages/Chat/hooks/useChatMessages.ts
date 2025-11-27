import { useState, useEffect, useRef } from 'react';
import type { Message, BigPictureTopic } from '../types';
import chatService from '../../../service/chatService';
import conversationService from '../../../service/conversationService';
import messageService from '../../../service/messageService';
import { parseAssistantResponse } from '../utils/messageHelpers';
import toast from 'react-hot-toast';

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

                if (conversationDetails.messages.length > 0) {
                    console.log('⏭️ Skipping auto-send: conversation already has', conversationDetails.messages.length, 'messages');

                    const transformedMessages: Message[] = conversationDetails.messages.map(msg => {
                        const parsed = msg.role === 'assistant' ? parseAssistantResponse(msg.content) : {};

                        return {
                            messageId: msg.messageId,
                            type: msg.role === 'user' || msg.role === 'student' ? 'user' : 'assistant',
                            content: msg.content,
                            isStreaming: false,
                            isFlagged: false,
                            suggestedQuestions: [],
                            images: msg.metadata?.images || [],
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
                setIsSendingMessage(true);

                setMessages(prev => [...prev, {
                    type: 'assistant',
                    content: 'Đang suy nghĩ...',
                    isStreaming: true
                }]);

                const response = await chatService.sendTextMessage(conversationId, initialQuery);
                const parsedResponse = parseAssistantResponse(
                    response.assistantMessage.content.data,
                    response.assistantMessage.interactiveElements
                );

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
                        images: response.assistantMessage.metadata?.images || []
                    };
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

                    const transformedMessages: Message[] = conversationDetails.messages.map(msg => {
                        const interactiveElements = msg.interactiveElements || msg.interactive_elements || msg.metadata?.interactive_elements || msg.metadata?.interactiveElements;
                        const parsed = msg.role === 'assistant' 
                            ? parseAssistantResponse(msg.content, interactiveElements) 
                            : {};

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
            const response = await chatService.sendTextMessage(conversationId, userMessage);
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
                    images: response.assistantMessage.metadata?.images || []
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
            const response = await chatService.sendTextMessage(conversationId, itemTerm);
            const parsedResponse = parseAssistantResponse(response.assistantMessage.content.data);

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
                    images: response.assistantMessage.metadata?.images || []
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
