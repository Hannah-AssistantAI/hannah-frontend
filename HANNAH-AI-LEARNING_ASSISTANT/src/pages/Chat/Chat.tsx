import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sparkles, Send, ThumbsUp, ThumbsDown, Share2, Upload, Book, GitBranch, FileText, ClipboardCheck, StickyNote, ChevronDown, ChevronUp, Link as LinkIcon, List } from 'lucide-react'
import subjectService, { type Subject } from '../../service/subjectService'
import chatService from '../../service/chatService'
import { useStudio } from './hooks/useStudio'
import { useQuiz } from './hooks/useQuiz'
import { ReportFormatModal } from './components/modals/ReportFormatModal'
import { ReportModal } from './components/modals/ReportModal'
import { MindmapModal } from './components/modals/MindmapModal'
import { NotecardModal } from './components/modals/NotecardModal'
import { QuizDisplayModal } from './components/modals/QuizDisplayModal'
import { QuizSideModal } from './components/modals/QuizSideModal'
import { CustomizeFeatureModal } from './components/modals/CustomizeFeatureModal'
import { ShareModal } from './components/modals/ShareModal'
import { BigPictureSidebar } from './components/BigPictureSidebar'
import { StudioSidebar } from './components/StudioSidebar'
import { HistorySidebar } from '../../components/HistorySidebar'
import { Header } from '../../components/Header'
import type { Message, RelatedContent, Source } from './types'
import './Chat.css'

export default function Chat() {
    const location = useLocation()
    const navigate = useNavigate()
    const initialQuery = location.state?.query || ''
    const initialConversationId = location.state?.conversationId || null

    // Use hooks for state management
    const studio = useStudio()
    const quiz = useQuiz()
    const [inputValue, setInputValue] = useState('')
    const [isBigPictureOpen, setIsBigPictureOpen] = useState(true)
    const [subjects, setSubjects] = useState<Subject[]>([]) // Store fetched subjects
    const [currentCardIndex, setCurrentCardIndex] = useState(0)
    const [isCardFlipped, setIsCardFlipped] = useState(false)
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [expandedSources, setExpandedSources] = useState<{ [key: string]: boolean }>({})
    const [showShareModal, setShowShareModal] = useState(false)
    const [showHistorySidebar, setShowHistorySidebar] = useState(false)
    const [conversationId, setConversationId] = useState<number | null>(initialConversationId)
    const [isSendingMessage, setIsSendingMessage] = useState(false)
    const hasAutoSentRef = useRef(false) // Track if we already auto-sent initial query
    const [messages, setMessages] = useState<Message[]>(initialQuery ? [
        {
            type: 'user',
            content: initialQuery
        }
    ] : [])

    const bigPictureTopics = [
        {
            title: 'Hiểu khái niệm cốt lõi của OOP và lợi ích của nó',
            subtopics: [
                'Chuyển đổi mô hình',
                'Mô hình hóa thực tế',
                'Lợi ích của OOP'
            ]
        },
        {
            title: 'Mô tả các khối xây dựng cơ bản của OOP: Đối tượng và Lớp',
            subtopics: [
                'Đối tượng',
                'Lớp',
                'Thực thể'
            ]
        },
        {
            title: 'Giải thích các nguyên tắc chính của OOP',
            subtopics: [
                'Đóng gói',
                'Trừu tượng hóa',
                'Kế thừa',
                'Đa hình'
            ]
        }
    ]

    const studioFeatures = [
        { icon: GitBranch, title: 'Bản đồ tư duy', description: 'Mind map', type: 'mindmap' as const, note: 'Tạo bản đồ tư duy dựa vào nội dung cuộc trò chuyện' },
        { icon: FileText, title: 'Báo cáo', description: 'Report', type: 'report' as const, note: 'Tạo báo cáo dựa vào nội dung cuộc trò chuyện' },
        { icon: StickyNote, title: 'Thẻ ghi nhớ', description: 'Note cards', type: 'notecard' as const, note: 'Tạo thẻ ghi nhớ dựa vào nội dung cuộc trò chuyện' },
        { icon: ClipboardCheck, title: 'Bài kiểm tra', description: 'Quiz', type: 'quiz' as const, note: 'Tạo bài kiểm tra dựa vào nội dung cuộc trò chuyện' }
    ]

    // Fetch subjects on component mount
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const response = await subjectService.getAllSubjects();
                if (response && response.items) {
                    setSubjects(response.items);
                    console.log('Fetched subjects:', response.items);
                }
            } catch (error) {
                console.error('Failed to fetch subjects:', error);
            }
        };

        fetchSubjects();
    }, []);

    // Helper to parse assistant response which might be a JSON string
    const parseAssistantResponse = (responseContent: string) => {
        try {
            // Try to parse the content as JSON
            const parsed = JSON.parse(responseContent);

            // Check if it has the expected structure
            if (parsed.content && (parsed.interactive_list || parsed.suggested_questions || parsed.outline)) {
                return {
                    content: parsed.content,
                    interactiveList: parsed.interactive_list,
                    suggestedQuestions: parsed.suggested_questions,
                    outline: parsed.outline
                };
            }

            // If it's JSON but doesn't have the specific structure, treat as plain text (or handle otherwise)
            return { content: responseContent };
        } catch (e) {
            // Not JSON, treat as plain text
            return { content: responseContent };
        }
    };

    // Auto-send initial query ONCE when component mounts
    useEffect(() => {
        const sendInitialQuery = async () => {
            // Prevent duplicate sends (React Strict Mode runs effects twice)
            if (hasAutoSentRef.current) return;
            if (!initialQuery || !conversationId) return;

            console.log('🚀 Auto-sending initial query:', initialQuery);
            hasAutoSentRef.current = true; // Mark as sent immediately
            setIsSendingMessage(true);

            // Add loading message
            setMessages(prev => [...prev, {
                type: 'assistant',
                content: 'Đang suy nghĩ...',
                isStreaming: true
            }]);

            try {
                const response = await chatService.sendTextMessage(
                    conversationId,
                    initialQuery
                );

                const parsedResponse = parseAssistantResponse(response.assistantMessage.content.data);

                // Replace loading message with actual response
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[1] = {
                        type: 'assistant',
                        content: parsedResponse.content,
                        isStreaming: false,
                        suggestedQuestions: parsedResponse.suggestedQuestions || response.assistantMessage.interactiveElements?.suggestedQuestions || [],
                        interactiveList: parsedResponse.interactiveList,
                        outline: parsedResponse.outline
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
    }, []); // Empty deps - only run once on mount

    const handleCustomizeSubmit = (data: any) => {
        if (studio.selectedFeatureType) {
            const featureTitles = {
                'mindmap': 'Bản đồ tư duy',
                'notecard': 'Thẻ ghi nhớ',
                'quiz': 'Bài kiểm tra'
            }

            const options = {
                quantity: data.cardQuantity,
                topic: data.cardTopic,
                courseCode: data.customizeTab === 'course' ? data.selectedCourseCode : undefined,
                documentIds: data.customizeTab === 'course' && data.selectedSubjectIds.length > 0 ? data.selectedSubjectIds : undefined,
                sourceType: (data.customizeTab === 'course' && data.selectedSubjectIds.length > 0) ? 'documents' as const : 'conversation' as const
            };

            studio.createStudioItem(studio.selectedFeatureType, featureTitles[studio.selectedFeatureType], options)
        }
        studio.setShowCustomizeModal(false)
    }

    const handleDeleteItem = (itemId: string) => {
        studio.handleDeleteItem(itemId)
        setOpenMenuId(null)
    }

    // Custom handler for studio item clicks to integrate with useQuiz hook
    const handleStudioItemClick = async (item: any) => {
        if (item.type === 'quiz') {
            // Extract numeric ID for quiz loading
            const numericId = item.id.replace('quiz-', '')
            await quiz.loadQuiz(numericId)
            // Open the quiz modal after loading
            studio.setShowQuizModal(true)
        } else {
            // Delegate to studio's handler for other types
            await studio.handleStudioItemClick(item)
        }
    }

    const toggleMenu = (itemId: string) => {
        setOpenMenuId(openMenuId === itemId ? null : itemId)
    }


    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (!target.closest('.studio-item-menu-container')) {
                setOpenMenuId(null)
            }
        }

        if (openMenuId) {
            document.addEventListener('click', handleClickOutside)
            return () => document.removeEventListener('click', handleClickOutside)
        }
    }, [openMenuId])

    // Handle keyboard navigation for notecards
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (!studio.showNotecardModal) return

            if (event.key === ' ' || event.key === 'Spacebar') {
                event.preventDefault()
                setIsCardFlipped(prev => !prev)
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault()
                setCurrentCardIndex(prev => Math.max(0, prev - 1))
                setIsCardFlipped(false)
            } else if (event.key === 'ArrowRight') {
                event.preventDefault()
                setCurrentCardIndex(prev => Math.min(104, prev + 1))
                setIsCardFlipped(false)
            }
        }

        if (studio.showNotecardModal) {
            document.addEventListener('keydown', handleKeyPress)
            return () => document.removeEventListener('keydown', handleKeyPress)
        }
    }, [studio.showNotecardModal])

    const handleSend = async () => {
        if (!inputValue.trim()) return
        if (isSendingMessage) return
        if (!conversationId) {
            console.error('No conversation ID available');
            return;
        }

        const userMessage = inputValue;
        setInputValue('');

        // Add user message
        setMessages(prev => [...prev, {
            type: 'user',
            content: userMessage
        }]);

        // Add loading message
        const loadingMessageIndex = messages.length + 1;
        setMessages(prev => [...prev, {
            type: 'assistant',
            content: 'Đang suy nghĩ...',
            isStreaming: true
        }]);

        setIsSendingMessage(true);
        try {
            const response = await chatService.sendTextMessage(
                conversationId,
                userMessage
            );

            const parsedResponse = parseAssistantResponse(response.assistantMessage.content.data);

            // Replace loading message with response
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[loadingMessageIndex] = {
                    type: 'assistant',
                    content: parsedResponse.content,
                    isStreaming: false,
                    suggestedQuestions: parsedResponse.suggestedQuestions || response.assistantMessage.interactiveElements?.suggestedQuestions || [],
                    interactiveList: parsedResponse.interactiveList,
                    outline: parsedResponse.outline
                };
                return newMessages;
            });
        } catch (error: any) {
            console.error('Failed to send message:', error);
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
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    // Parse interactive list and related content from content
    const parseInteractiveList = (content: string) => {
        const parts: Array<{ type: 'text' | 'interactive-list' | 'related-content' | 'video-content', content: string, title?: string, sources?: Source[], relatedItems?: RelatedContent[], videoUrl?: string, videoTitle?: string }> = []
        const interactiveListRegex = /\[INTERACTIVE_LIST:(.*?)\]([\s\S]*?)\[\/INTERACTIVE_LIST\]/g
        const relatedContentRegex = /\[RELATED_CONTENT:(.*?)\]([\s\S]*?)\[\/RELATED_CONTENT\]/g
        const videoContentRegex = /\[VIDEO_CONTENT:(.*?):(.*?)\]/g

        // Create a combined regex to find all special blocks
        const allMatches: Array<{ type: 'interactive-list' | 'related-content' | 'video-content', match: RegExpExecArray }> = []

        let match
        while ((match = interactiveListRegex.exec(content)) !== null) {
            allMatches.push({ type: 'interactive-list', match })
        }

        while ((match = relatedContentRegex.exec(content)) !== null) {
            allMatches.push({ type: 'related-content', match })
        }

        while ((match = videoContentRegex.exec(content)) !== null) {
            allMatches.push({ type: 'video-content', match })
        }

        // Sort by position
        allMatches.sort((a, b) => a.match.index - b.match.index)

        let lastIndex = 0

        for (const { type, match } of allMatches) {
            // Add text before this block
            if (match.index > lastIndex) {
                parts.push({
                    type: 'text',
                    content: content.substring(lastIndex, match.index)
                })
            }

            if (type === 'interactive-list') {
                const title = match[1]
                const listContent = match[2]
                const sources: Source[] = []

                // Parse sources
                const sourceRegex = /\[SOURCE:(\d+):(.*?):(.*?):(.*?):(.*?)\]/g
                let sourceMatch

                while ((sourceMatch = sourceRegex.exec(listContent)) !== null) {
                    sources.push({
                        id: sourceMatch[1],
                        title: sourceMatch[2],
                        icon: sourceMatch[3],
                        description: sourceMatch[4],
                        url: sourceMatch[5]
                    })
                }

                parts.push({
                    type: 'interactive-list',
                    content: listContent,
                    title,
                    sources
                })
            } else if (type === 'video-content') {
                const videoTitle = match[1]
                const videoUrl = match[2]

                parts.push({
                    type: 'video-content',
                    content: '',
                    videoTitle,
                    videoUrl
                })
            } else if (type === 'related-content') {
                const title = match[1]
                const contentBlock = match[2]
                const relatedItems: RelatedContent[] = []

                // Parse related content items: [CONTENT:id:title:description:url:source:sourceIcon:shortTitle]
                const contentRegex = /\[CONTENT:(\d+):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?)\]/g
                let contentMatch

                while ((contentMatch = contentRegex.exec(contentBlock)) !== null) {
                    relatedItems.push({
                        id: contentMatch[1],
                        title: contentMatch[2],
                        description: contentMatch[3],
                        url: contentMatch[4],
                        source: contentMatch[5],
                        sourceIcon: contentMatch[6],
                        shortTitle: contentMatch[7]
                    })
                }

                parts.push({
                    type: 'related-content',
                    content: contentBlock,
                    title,
                    relatedItems
                })
            }

            lastIndex = match.index + match[0].length
        }

        // Add remaining text
        if (lastIndex < content.length) {
            parts.push({
                type: 'text',
                content: content.substring(lastIndex)
            })
        }

        return parts.length > 0 ? parts : [{ type: 'text' as const, content }]
    }

    // Auto-expand all interactive lists when messages change
    useEffect(() => {
        const newExpandedState: { [key: string]: boolean } = {}

        messages.forEach((message, messageIndex) => {
            const parts = parseInteractiveList(message.content)

            parts.forEach((part, partIndex) => {
                if (part.type === 'interactive-list') {
                    newExpandedState[`${messageIndex}-${partIndex}`] = true
                }
            })
        })

        setExpandedSources(newExpandedState)
    }, [messages])

    const renderInteractiveList = (items: any[]) => {
        return (
            <div className="interactive-list-container">
                <div className="interactive-list-header">
                    <List size={20} className="interactive-list-icon" />
                    <span className="interactive-list-title">Interactive List</span>
                </div>
                <div className="interactive-list-items">
                    {items.map((item, index) => (
                        <div key={index} className="interactive-item-card">
                            <div className="interactive-item-icon-wrapper">
                                {item.icon ? (
                                    <span className="interactive-item-emoji">{item.icon}</span>
                                ) : (
                                    <div className="interactive-item-placeholder">
                                        <Book size={24} />
                                    </div>
                                )}
                            </div>
                            <div className="interactive-item-content">
                                <h4 className="interactive-item-term">{item.term}</h4>
                                <p className="interactive-item-definition">{item.definition}</p>
                            </div>
                            <div className="interactive-item-action">
                                <button className="interactive-item-link-btn" aria-label="Link">
                                    <LinkIcon size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const renderMessageContent = (content: string, messageIndex: number, message?: Message) => {
        const parts = parseInteractiveList(content)

        // If we have a structured interactive list in the message object, render it
        if (message?.interactiveList && message.interactiveList.length > 0) {
            return (
                <>
                    <div className="message-text">
                        {content.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                    </div>
                    {renderInteractiveList(message.interactiveList)}
                </>
            )
        }

        return parts.map((part, partIndex) => {
            if (part.type === 'interactive-list') {
                return (
                    <div key={`part-${partIndex}`} className="message-sources">
                        <button
                            className="sources-toggle"
                            onClick={() => setExpandedSources(prev => ({
                                ...prev,
                                [`${messageIndex}-${partIndex}`]: !prev[`${messageIndex}-${partIndex}`]
                            }))}
                        >
                            <List size={18} />
                            <span className="sources-label">Interactive List</span>
                            <span className="sources-title">{part.title}</span>
                            {expandedSources[`${messageIndex}-${partIndex}`] ? (
                                <ChevronUp size={18} className="sources-chevron" />
                            ) : (
                                <ChevronDown size={18} className="sources-chevron" />
                            )}
                        </button>

                        {expandedSources[`${messageIndex}-${partIndex}`] && (
                            <div className="sources-list">
                                {part.sources?.map((source) => (
                                    <a
                                        key={`${messageIndex}-${partIndex}-source-${source.id}`}
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="source-item"
                                    >
                                        <div className="source-icon-wrapper">
                                            {source.icon ? (
                                                <span className="source-icon-emoji">{source.icon}</span>
                                            ) : (
                                                <div className="source-icon-placeholder">
                                                    <Book size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="source-content">
                                            <h4 className="source-title">{source.title}</h4>
                                            <p className="source-description">{source.description}</p>
                                        </div>
                                        <button className="source-link-btn" aria-label="Open link">
                                            <LinkIcon size={20} />
                                        </button>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                )
            } else if (part.type === 'video-content') {
                return (
                    <div key={`part-${partIndex}`} className="video-content-container">
                        <h3 className="video-content-title">{part.videoTitle || 'Related Video'}</h3>
                        <div className="video-wrapper">
                            <iframe
                                src={part.videoUrl}
                                title={part.videoTitle || 'Video'}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="video-iframe"
                            />
                        </div>
                    </div>
                )
            } else if (part.type === 'related-content') {
                return (
                    <div key={`part-${partIndex}`} className="related-content">
                        <h3 className="related-content-title">{part.title}</h3>
                        <div className="related-content-carousel">
                            {part.relatedItems?.map((item) => (
                                <a
                                    key={`${messageIndex}-${partIndex}-related-${item.id}`}
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="related-content-card"
                                >
                                    <div className="related-card-content">
                                        <h4 className="related-card-title">{item.title}</h4>
                                        <p className="related-card-description">{item.description}</p>
                                    </div>
                                    <div className="related-card-footer">
                                        <div className="related-card-info">
                                            <div className="related-card-short-title">{item.shortTitle || item.title}</div>
                                            <div className="related-card-source">
                                                {item.sourceIcon && (
                                                    <span className="source-icon-badge">{item.sourceIcon}</span>
                                                )}
                                                {/* <span className="source-name">{item.source}</span> */}
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )
            } else {
                return (
                    <div key={`part-${partIndex}`} className="message-text">
                        {part.content.split('\n').map((line: string, i: number) => {
                            // Handle bold text
                            if (line.includes('**')) {
                                const parts = line.split('**')
                                return (
                                    <p key={i}>
                                        {parts.map((linePart: string, j: number) =>
                                            j % 2 === 1 ? <strong key={j}>{linePart}</strong> : linePart
                                        )}
                                    </p>
                                )
                            }
                            // Handle headings
                            if (line.startsWith('### ')) {
                                return <h3 key={i}>{line.replace('### ', '')}</h3>
                            }
                            if (line.startsWith('#### ')) {
                                return <h4 key={i}>{line.replace('#### ', '')}</h4>
                            }
                            // Handle list items
                            if (line.startsWith('- ')) {
                                return <li key={i}>{line.replace('- ', '')}</li>
                            }
                            // Regular paragraph
                            if (line.trim()) {
                                return <p key={i}>{line}</p>
                            }
                            return null
                        })}
                    </div>
                )
            }
        })
    }


    return (
        <div className="chat-container">
            {/* Header */}
            <Header
                onToggleHistory={() => setShowHistorySidebar(!showHistorySidebar)}
                showShareButton={true}
                onShareClick={() => setShowShareModal(true)}
            />

            {/* History Sidebar */}
            <HistorySidebar
                isOpen={showHistorySidebar}
                onClose={() => setShowHistorySidebar(false)}
                onItemClick={(topic) => {
                    setInputValue(topic);
                    setShowHistorySidebar(false);
                    // Optionally auto-send or just populate input
                }}
            />

            {/* Main Chat Area */}
            <main className="chat-main" style={{ display: 'flex', gap: '0', padding: '24px', alignItems: 'stretch' }}>
                {/* Big Picture Sidebar - Left */}
                <BigPictureSidebar
                    isOpen={isBigPictureOpen}
                    onToggle={() => setIsBigPictureOpen(!isBigPictureOpen)}
                    topics={bigPictureTopics}
                />

                <div className="chat-content" style={{ order: 2, flex: 1, padding: '0', minWidth: 0 }}>
                    {/* Welcome Banner */}
                    <div className="welcome-banner">
                        <div className="welcome-banner-icon">
                            <img src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" alt="Học về" />
                        </div>
                        <div className="welcome-banner-content">
                            <h2 className="welcome-banner-title">Chào mừng đến với Hannah Assistant</h2>
                            <p className="welcome-banner-description">
                                Nắm bắt các chủ đề mới và hiểu sâu hơn với công cụ học tập đàm thoại
                            </p>
                            <button className="topic-badge">OOP</button>
                        </div>
                        <button className="close-banner-btn" aria-label="Đóng">×</button>
                    </div>

                    {/* Messages */}
                    <div className="messages-container">
                        {messages.map((message, index) => (
                            <div key={index} className={`message ${message.type}-message`}>
                                {message.type === 'assistant' && (
                                    <div className="message-avatar">
                                        <Sparkles size={20} color="#4285F4" />
                                    </div>
                                )}
                                <div className="message-content">
                                    {renderMessageContent(message.content, index, message)}
                                    {message.type === 'assistant' && !message.isStreaming && (
                                        <>
                                            <div className="message-actions-container">
                                                <div className="message-suggestions">
                                                    <button
                                                        className="suggestion-btn"
                                                        onClick={() => {
                                                            setInputValue('Đơn giản hóa');
                                                            setTimeout(() => handleSend(), 100);
                                                        }}
                                                    >
                                                        <span className="suggestion-icon">≡</span>
                                                        <span>Đơn giản hóa</span>
                                                    </button>
                                                    <button
                                                        className="suggestion-btn"
                                                        onClick={() => {
                                                            setInputValue('Tìm hiểu sâu hơn');
                                                            setTimeout(() => handleSend(), 100);
                                                        }}
                                                    >
                                                        <span className="suggestion-icon">≡</span>
                                                        <span>Tìm hiểu sâu hơn</span>
                                                    </button>
                                                </div>
                                                <div className="message-actions">
                                                    <button className="action-btn" aria-label="Phản hồi tốt">
                                                        <ThumbsUp size={16} />
                                                    </button>
                                                    <button className="action-btn" aria-label="Phản hồi không tốt">
                                                        <ThumbsDown size={16} />
                                                    </button>
                                                    <button className="action-btn" aria-label="Chia sẻ">
                                                        <Share2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            {message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
                                                <div className="follow-up-questions">
                                                    {message.suggestedQuestions.map((question, qIndex) => (
                                                        <button
                                                            key={qIndex}
                                                            className="follow-up-btn"
                                                            onClick={() => {
                                                                setInputValue(question);
                                                                setTimeout(() => handleSend(), 100);
                                                            }}
                                                        >
                                                            {question}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Notice */}
                    <div className="chat-notice">
                        Hannah hiện chỉ khả dụng bằng tiếng Việt.
                    </div>

                    {/* Input Area */}
                    <div className="chat-input-container">
                        <div className="chat-input-wrapper">
                            <input
                                type="text"
                                placeholder="Nhập hoặc chia sẻ tệp tin..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="chat-input"
                            />
                            <button className="upload-file-btn" aria-label="Tải lên tệp tin">
                                <Upload size={20} />
                            </button>
                            <button
                                className={`send-btn ${inputValue.trim() ? 'active' : ''}`}
                                onClick={handleSend}
                                disabled={!inputValue.trim()}
                                aria-label="Gửi tin nhắn"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                        <p className="chat-disclaimer">
                            Phản hồi từ AI có thể không chính xác hoặc gây hiểu lầm. Hãy kiểm tra kỹ để đảm bảo độ chính xác.
                        </p>
                    </div>
                </div>

                {/* Studio Sidebar - Right */}
                <StudioSidebar
                    isOpen={studio.isStudioOpen}
                    onToggle={() => studio.setIsStudioOpen(!studio.isStudioOpen)}
                    items={studio.studioItems}
                    features={studioFeatures}
                    onFeatureClick={studio.handleStudioFeatureClick}
                    onEditFeature={(type: 'mindmap' | 'notecard' | 'quiz') => {
                        studio.setSelectedFeatureType(type)
                        studio.setShowCustomizeModal(true)
                    }}
                    onItemClick={handleStudioItemClick}
                    onDeleteItem={handleDeleteItem}
                    openMenuId={openMenuId}
                    onToggleMenu={toggleMenu}
                />
            </main>

            {/* Report Format Selection Modal */}
            <ReportFormatModal
                isOpen={studio.showReportFormatModal}
                onClose={() => studio.setShowReportFormatModal(false)}
                onSelectFormat={studio.handleReportFormatSelect}
            />

            {/* Report Modal */}
            <ReportModal
                isOpen={studio.showReportModal}
                onClose={() => studio.setShowReportModal(false)}
                content={studio.reportContent}
            />

            {/* Mindmap Modal */}
            <MindmapModal
                isOpen={studio.showMindmapModal}
                onClose={() => studio.setShowMindmapModal(false)}
                content={studio.mindmapContent}
            />



            {/* Notecard Modal */}
            <NotecardModal
                isOpen={studio.showNotecardModal}
                onClose={() => studio.setShowNotecardModal(false)}
                content={studio.flashcardContent}
                currentCardIndex={currentCardIndex}
                isCardFlipped={isCardFlipped}
                onFlip={() => setIsCardFlipped(!isCardFlipped)}
                onNext={() => {
                    setCurrentCardIndex(prev => Math.min((studio.flashcardContent?.cards?.length || 1) - 1, prev + 1))
                    setIsCardFlipped(false)
                }}
                onPrev={() => {
                    setCurrentCardIndex(prev => Math.max(0, prev - 1))
                    setIsCardFlipped(false)
                }}
                onShuffle={() => {
                    setCurrentCardIndex(0)
                    setIsCardFlipped(false)
                }}
            />

            {/* Quiz Display Modal */}
            <QuizDisplayModal
                isOpen={studio.showQuizModal}
                onClose={() => studio.setShowQuizModal(false)}
                content={quiz.quizContent}
                currentQuestionIndex={quiz.currentQuestionIndex}
                selectedAnswers={quiz.selectedAnswers}
                onAnswerSelect={quiz.selectAnswer}
                onNext={quiz.nextQuestion}
                onSubmit={quiz.submitQuiz}
                showResults={quiz.showQuizResults}
                results={quiz.quizResults}
                isSubmitting={quiz.isSubmittingQuiz}
                onMinimize={() => {
                    studio.setShowQuizModal(false)
                    studio.setShowQuizSideModal(true)
                }}
            />

            {/* Quiz Side Modal */}
            <QuizSideModal
                isOpen={studio.showQuizSideModal}
                onClose={() => studio.setShowQuizSideModal(false)}
                content={quiz.quizContent}
                currentQuestionIndex={quiz.currentQuestionIndex}
                selectedAnswers={quiz.selectedAnswers}
                onAnswerSelect={quiz.selectAnswer}
                onNext={quiz.nextQuestion}
                onSubmit={quiz.submitQuiz}
                isSubmitting={quiz.isSubmittingQuiz}
                showResults={quiz.showQuizResults}
                results={quiz.quizResults}
                onRetry={quiz.retryQuiz}
                onExpand={() => {
                    studio.setShowQuizSideModal(false)
                    studio.setShowQuizModal(true)
                }}
            />

            {/* Customize Feature Modal */}
            <CustomizeFeatureModal
                isOpen={studio.showCustomizeModal}
                onClose={() => studio.setShowCustomizeModal(false)}
                featureType={studio.selectedFeatureType}
                onSubmit={handleCustomizeSubmit}
                subjects={subjects}
            />

            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
            />
        </div>
    )
}
