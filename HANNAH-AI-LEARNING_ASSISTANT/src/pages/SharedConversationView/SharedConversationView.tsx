import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Book } from 'lucide-react'
import conversationService from '../../service/conversationService'
import { MessageDisplay } from '../Chat/components/MessageDisplay/MessageDisplay'
import type { Message as ChatMessage, BigPictureTopic } from '../Chat/types'
import { parseAssistantResponse } from '../Chat/utils/messageHelpers'
import '../Chat/Chat.css'

export default function SharedConversationView() {
    const { shareToken } = useParams<{ shareToken: string }>()
    const [conversation, setConversation] = useState<{
        conversationId: number
        title: string
        messageCount: number
        createdAt: string
        messages: ChatMessage[]
    } | null>(null)
    const [outlineTopics, setOutlineTopics] = useState<BigPictureTopic[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchSharedConversation = async () => {
            if (!shareToken) {
                setError('Link không hợp lệ')
                setIsLoading(false)
                return
            }

            try {
                const data = await conversationService.getSharedConversation(shareToken)

                // Transform messages to match ChatMessage type
                const transformedMessages: ChatMessage[] = data.messages.map(msg => {
                    // Try to get interactiveElements from various possible locations
                    const interactiveElements = msg.interactiveElements || msg.interactive_elements || msg.metadata?.interactive_elements || msg.metadata?.interactiveElements || (msg.metadata?.interactiveList ? { interactiveList: msg.metadata.interactiveList } : undefined);

                    console.log('🔍 SharedView Transform - msg:', msg.messageId, msg.role);
                    console.log('  - msg.metadata:', msg.metadata);
                    console.log('  - interactiveElements:', interactiveElements);

                    const parsed = msg.role === 'assistant' ? parseAssistantResponse(msg.content, interactiveElements) : {} as any;

                    console.log('  - parsed result:', parsed);
                    console.log('  - parsed.youtubeResources:', parsed.youtubeResources);

                    return {
                        messageId: msg.messageId,
                        type: msg.role === 'user' || msg.role === 'student' ? 'user' : 'assistant',
                        content: parsed.content || msg.content,
                        isFlagged: false,
                        images: msg.images || msg.metadata?.images || [],
                        ...parsed,
                        interactiveList: parsed.interactiveList || msg.metadata?.interactiveList,
                        youtubeResources: parsed.youtubeResources || msg.metadata?.youtubeResources || msg.metadata?.youtube_resources,
                        outline: parsed.outline || msg.metadata?.outline,
                    };
                })

                // Extract outline from messages
                let outline: BigPictureTopic[] = []
                for (const msg of transformedMessages) {
                    if (msg.type === 'assistant' && msg.outline && msg.outline.length > 0) {
                        outline = msg.outline
                        break
                    }
                }
                setOutlineTopics(outline)

                setConversation({
                    ...data,
                    messages: transformedMessages
                })
            } catch (err: any) {
                console.error('Error fetching shared conversation:', err)
                setError(err?.message || 'Không thể tải cuộc trò chuyện. Link có thể đã hết hạn hoặc không còn được chia sẻ.')
            } finally {
                setIsLoading(false)
            }
        }

        fetchSharedConversation()
    }, [shareToken])

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: '#f8f9fa'
            }}>
                <div style={{ fontSize: '18px', color: '#666', marginBottom: '12px' }}>
                    Đang tải cuộc trò chuyện...
                </div>
            </div>
        )
    }

    if (error || !conversation) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: '#f8f9fa'
            }}>
                <div style={{ fontSize: '24px', marginBottom: '12px' }}>⚠️</div>
                <div style={{ fontSize: '18px', color: '#d32f2f', marginBottom: '8px' }}>
                    Không thể truy cập cuộc trò chuyện
                </div>
                <div style={{ fontSize: '14px', color: '#666', textAlign: 'center', maxWidth: '500px' }}>
                    {error}
                </div>
            </div>
        )
    }

    return (
        <div className="chat-container">
            <div className="chat-main" style={{ display: 'flex', gap: '0', padding: '24px', alignItems: 'stretch', justifyContent: 'center' }}>
                {/* Big Picture Panel - Only show if outline exists */}
                {outlineTopics.length > 0 && (
                    <aside className="big-picture-sidebar open" style={{ order: 1, width: '320px', padding: '0 24px 0 0', flexShrink: 0 }}>
                        <div className="big-picture-content">
                            <div className="big-picture-header">
                                <Book size={20} color="#5f6368" />
                                <h3 className="big-picture-title">Bức tranh toàn cảnh</h3>
                            </div>

                            <div className="big-picture-topics">
                                {outlineTopics.map((topic, index) => (
                                    <div key={index} className="big-picture-topic-item">
                                        <div className="big-picture-topic-button" style={{ cursor: 'default' }}>
                                            <span className="big-picture-topic-title">{topic.title}</span>
                                        </div>
                                        <div className="big-picture-subtopics-list">
                                            {topic.subtopics.map((subtopic, subIndex) => (
                                                <div
                                                    key={subIndex}
                                                    className="big-picture-subtopic-button"
                                                    style={{ cursor: 'default' }}
                                                >
                                                    {subtopic}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                )}

                <div className="chat-content" style={{ order: 2, flex: 1, padding: '0', minWidth: 0, maxWidth: '900px' }}>
                    {/* Header for Shared View */}
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '20px 24px',
                        marginBottom: '24px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <img
                            src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg"
                            alt="Hannah"
                            style={{ width: '32px', height: '32px' }}
                        />
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: '600', margin: 0, color: '#202124' }}>
                                {conversation.title}
                            </h1>
                            <div style={{ fontSize: '14px', color: '#5f6368', marginTop: '4px' }}>
                                Cuộc trò chuyện được chia sẻ (chỉ xem) • {conversation.messageCount} tin nhắn
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="messages-container">
                        {conversation.messages.map((message, index) => (
                            <MessageDisplay
                                key={index}
                                message={message}
                                messageIndex={index}
                                messages={conversation.messages}
                                expandedSources={{}}
                                onToggleSource={() => { }}
                                onInteractiveItemClick={() => { }}
                                onFlagMessage={() => { }}
                                isReadOnly={true}
                            />
                        ))}
                    </div>

                    {/* Footer Notice */}
                    <div className="chat-notice" style={{ marginTop: '24px' }}>
                        Đây là cuộc trò chuyện được chia sẻ công khai từ Hannah AI Learning Assistant.<br />
                        Bạn chỉ có thể xem, không thể chat hoặc chỉnh sửa.
                    </div>
                </div>
            </div>
        </div>
    )
}
