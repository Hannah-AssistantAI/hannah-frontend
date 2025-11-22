import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sparkles, Send, ThumbsUp, ThumbsDown, Share2, Upload, Book, GitBranch, FileText, ClipboardCheck, StickyNote, ChevronDown, ChevronUp, Link as LinkIcon, List, User, LogOut, Share } from 'lucide-react'
import ProfileIcon from '../../components/ProfileIcon'
import subjectService, { type Subject } from '../../service/subjectService'
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
import type { Message, RelatedContent, Source } from './types'
import './Chat.css'



export default function Chat() {
    const location = useLocation()
    const navigate = useNavigate()
    const initialQuery = location.state?.query || ''

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
    const [messages, setMessages] = useState<Message[]>([
        {
            type: 'user',
            content: initialQuery
        },
        {
            type: 'assistant',
            content: `**Lập trình Hướng đối tượng (OOP)** là một mô hình lập trình cấu trúc phần mềm xung quanh **các đối tượng**, thay vì các hàm hoặc logic. Hãy nghĩ về nó như việc mô hình hóa các thực thể trong thế giới thực và các tương tác của chúng trong code của bạn.

### Bức tranh toàn cảnh

#### Hiểu khái niệm cốt lõi của OOP và lợi ích của nó

**Chuyển đổi mô hình**
OOP đại diện cho một cách suy nghĩ khác về lập trình - tập trung vào dữ liệu và hành vi cùng nhau.

**Mô hình hóa thực tế**
Các đối tượng phản ánh các thực thể trong thế giới thực, làm cho code trở nên trực quan và dễ bảo trì hơn.

OOP mang lại nhiều lợi thế, bao gồm:

[INTERACTIVE_LIST:Ưu điểm của OOP]
[SOURCE:1:Tính mô-đun:🔷:Code được tổ chức thành các đối tượng độc lập, giúp quản lý và hiểu dễ dàng hơn.:https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Object-oriented_programming]
[SOURCE:2:Khả năng tái sử dụng:🔄:Các đối tượng và lớp có thể được tái sử dụng trong nhiều phần khác nhau của chương trình hoặc trong các dự án khác, giảm thời gian phát triển.:https://www.geeksforgeeks.org/object-oriented-programming-oops-concept-in-java/]
[SOURCE:3:Dễ bảo trì:🔧:Thay đổi một đối tượng ít có khả năng ảnh hưởng đến các phần khác của chương trình.:https://stackoverflow.com/questions/1031273/what-is-polymorphism-what-is-it-for-and-how-is-it-used]
[/INTERACTIVE_LIST]

**Lợi ích của OOP**
- Tổ chức code tốt hơn
- Khả năng tái sử dụng thông qua kế thừa
- Bảo trì và cập nhật dễ dàng hơn
- Thiết kế trực quan hơn

[VIDEO_CONTENT:Giải thích về Lập trình Hướng đối tượng:https://www.youtube.com/embed/pTB0EiLXUC8]

[RELATED_CONTENT:Khám phá nội dung liên quan]
[CONTENT:1:Lập trình hướng đối tượng là một mô hình lập trình:Tìm hiểu tổng quan về lập trình hướng đối tượng trên Wikipedia.:https://en.wikipedia.org/wiki/Object-oriented_programming:Wikipedia:W:OOP]
[CONTENT:2:Java OOP (Lập trình Hướng đối tượng):Khám phá cách OOP được triển khai trong Java.:https://www.w3schools.com/java/java_oop.asp:W3Schools:W:Java OOP (Lập trình Hướng...]
[CONTENT:3:Thuật ngữ OOP:Tra cứu các thuật ngữ và định nghĩa chính của OOP.:https://www.geeksforgeeks.org/object-oriented-programming-oops-concept-in-java/:GeeksforGeeks:G:OOP]
[/RELATED_CONTENT]`,
            isStreaming: false
        }
    ])

    const courseCodes = [
        { code: 'CSD', name: 'Cấu trúc dữ liệu và giải thuật' },
        { code: 'CSI', name: 'Cơ sở dữ liệu' },
        { code: 'PRO', name: 'Lập trình hướng đối tượng' },
        { code: 'PRM', name: 'Quản lý dự án' },
        { code: 'WEB', name: 'Phát triển Web' },
        { code: 'MAD', name: 'Phát triển ứng dụng di động' },
        { code: 'DBI', name: 'Thiết kế cơ sở dữ liệu' },
        { code: 'OSG', name: 'Hệ điều hành' },
        { code: 'SUB101', name: 'Tự học' }
    ]

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

    const handleSend = () => {
        if (!inputValue.trim()) return

        // Add user message
        setMessages(prev => [...prev, {
            type: 'user',
            content: inputValue
        }])

        // Simulate assistant response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                type: 'assistant',
                content: 'Đây là phản hồi mô phỏng. Trong ứng dụng thực tế, nội dung này sẽ được thay thế bằng lời gọi API đến dịch vụ AI.',
                isStreaming: false
            }])
        }, 500)

        setInputValue('')
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

    const renderMessageContent = (content: string, messageIndex: number) => {
        const parts = parseInteractiveList(content)

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
            <header className="chat-header">
                <div className="chat-header-left">
                    <div className="chat-logo" onClick={() => navigate('/learn')}>
                        <Sparkles size={24} color="#4285F4" />
                        <span className="chat-logo-text">Hannah Assistant</span>
                    </div>
                    <img src="https://daihoc.fpt.edu.vn/wp-content/uploads/2023/04/cropped-cropped-2021-FPTU-Long.png" alt="Hannah Logo" className="header-logo-image" />
                </div>
                <div className="chat-header-right">
                    <button className="share-btn" onClick={() => setShowShareModal(true)}>
                        <Share2 size={20} />
                        <span>Chia sẻ</span>
                    </button>
                    <ProfileIcon />
                </div>
            </header>

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
                                    {renderMessageContent(message.content, index)}
                                    {message.type === 'assistant' && (
                                        <>
                                            <div className="message-actions-container">
                                                <div className="message-suggestions">
                                                    <button className="suggestion-btn">
                                                        <span className="suggestion-icon">≡</span>
                                                        <span>Đơn giản hóa</span>
                                                    </button>
                                                    <button className="suggestion-btn">
                                                        <span className="suggestion-icon">≡</span>
                                                        <span>Tìm hiểu sâu hơn</span>
                                                    </button>
                                                    <button className="suggestion-btn">
                                                        <span className="suggestion-icon">🖼</span>
                                                        <span>Lấy hình ảnh</span>
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
                                            <div className="follow-up-questions">
                                                <button className="follow-up-btn">Cho tôi biết thêm về lớp và đối tượng.</button>
                                                <button className="follow-up-btn">Giải thích chi tiết hơn về đóng gói.</button>
                                                <button className="follow-up-btn">Một số ngôn ngữ lập trình sử dụng OOP là gì?</button>
                                            </div>
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
                onExpand={() => {
                    studio.setShowQuizSideModal(false)
                    studio.setShowQuizModal(true)
                }}
            />

            {/* Customize Feature Modal */}
            <CustomizeFeatureModal
                isOpen={studio.showCustomizeModal}
                onClose={() => studio.setShowCustomizeModal(false)}
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
