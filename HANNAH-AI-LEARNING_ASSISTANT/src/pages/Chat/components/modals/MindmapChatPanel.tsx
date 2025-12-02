import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import chatService from '../../../../service/chatService';

interface MindmapChatPanelProps {
    selectedNode: string;
    conversationId: number;
    mindmapTopic: string;
}

export const MindmapChatPanel: React.FC<MindmapChatPanelProps> = ({
    selectedNode,
    conversationId,
    mindmapTopic
}) => {
    const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
    const [chatInput, setChatInput] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    // Clear chat when node changes
    useEffect(() => {
        setChatMessages([]);
        setChatInput('');
    }, [selectedNode]);

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isSendingMessage) return;

        const userMessage = chatInput.trim();
        setChatInput('');

        // Add user message
        const newMessages = [...chatMessages, { role: 'user' as const, content: userMessage }];
        setChatMessages(newMessages);

        // Add empty assistant message for streaming
        setChatMessages(prev => [...prev, { role: 'assistant' as const, content: '' }]);
        setIsSendingMessage(true);

        try {
            // Use streaming API
            await chatService.sendMindmapChatStream(
                conversationId,
                selectedNode,
                mindmapTopic,
                userMessage,
                chatMessages,  // Pass history for context
                (chunk) => {
                    // Update last message (assistant) with new chunk - IMMUTABLE
                    setChatMessages(prev => {
                        if (prev.length === 0) return prev;

                        const lastIndex = prev.length - 1;
                        const lastMsg = prev[lastIndex];

                        if (lastMsg.role !== 'assistant') return prev;

                        // Create NEW array with NEW object (immutable)
                        return [
                            ...prev.slice(0, lastIndex),
                            {
                                ...lastMsg,
                                content: lastMsg.content + chunk
                            }
                        ];
                    });
                }
            );
        } catch (error) {
            console.error('Failed to send message:', error);
            // Replace empty assistant message with error
            setChatMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant' as const, content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.' };
                return updated;
            });
        } finally {
            setIsSendingMessage(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Simple markdown formatter
    const formatMarkdown = (text: string) => {
        return text
            // Bold: **text** -> <strong>text</strong>
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            // Italic: *text* -> <em>text</em>
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            // Bullet points: * item -> • item
            .replace(/^\* (.+)$/gm, '• $1')
            // Line breaks
            .replace(/\n/g, '<br/>');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Chat Messages */}
            <div
                ref={chatContainerRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    marginBottom: '12px'
                }}
            >
                {chatMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#202124' }}>
                        <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>Hỏi AI về "{selectedNode}"</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button
                                onClick={() => setChatInput('Giải thích chi tiết hơn về khái niệm này')}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #dadce0',
                                    borderRadius: '16px',
                                    background: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    color: '#202124',
                                }}
                            >
                                Giải thích chi tiết hơn
                            </button>
                            <button
                                onClick={() => setChatInput('Cho tôi ví dụ thực tế về khái niệm này')}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #dadce0',
                                    borderRadius: '16px',
                                    background: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    color: '#202124',
                                }}
                            >
                                Cho ví dụ thực tế
                            </button>
                        </div>
                    </div>
                ) : (
                    chatMessages.map((msg, idx) => (
                        <div
                            key={idx}
                            style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%'
                            }}
                        >
                            <div
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                    backgroundColor: msg.role === 'user' ? '#1a73e8' : '#fff',
                                    color: msg.role === 'user' ? '#fff' : '#3c4043',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.5',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                    wordBreak: 'break-word'
                                }}
                                dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                            />
                        </div>
                    ))
                )}
                {isSendingMessage && (
                    <div style={{ alignSelf: 'flex-start' }}>
                        <div style={{ padding: '10px 14px', borderRadius: '16px', backgroundColor: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                            <div className="loading-spinner" style={{ width: '16px', height: '16px', border: '2px solid #f3f3f3', borderTop: '2px solid #1a73e8', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Chat Input */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Hỏi về ${selectedNode}...`}
                    disabled={isSendingMessage}
                    style={{
                        flex: 1,
                        padding: '10px 14px',
                        border: '1px solid #dadce0',
                        borderRadius: '24px',
                        fontSize: '0.9rem',
                        outline: 'none',
                        backgroundColor: '#fff',
                        color: '#202124'
                    }}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isSendingMessage}
                    style={{
                        padding: '10px',
                        border: 'none',
                        borderRadius: '50%',
                        background: chatInput.trim() && !isSendingMessage ? '#1a73e8' : '#dadce0',
                        color: '#fff',
                        cursor: chatInput.trim() && !isSendingMessage ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px'
                    }}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};
