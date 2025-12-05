import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Send, Upload, GitBranch, FileText, ClipboardCheck, StickyNote, Map } from 'lucide-react'
import subjectService, { type Subject } from '../../service/subjectService'
import flaggingService from '../../service/flaggingService'
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
import { FlagMessageModal } from './components/modals/FlagMessageModal'
import { FlagQuizModal } from './components/modals/FlagQuizModal'
import { RoadmapModal } from './components/modals/RoadmapModal'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import { BigPictureSidebar } from './components/BigPictureSidebar'
import { StudioSidebar } from './components/StudioSidebar'
import { HistorySidebar } from '../../components/HistorySidebar'
import { Header } from '../../components/Header'
import { useAuth } from '../../contexts/AuthContext'
import type { Message, BigPictureTopic } from './types'
import { parseInteractiveList } from './utils/messageHelpers'
import { MessageDisplay } from './components/MessageDisplay/MessageDisplay'
import { useChatMessages } from './hooks/useChatMessages'
import './Chat.css'
import './css/youtube-resources.css'

export default function Chat() {
    const location = useLocation()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { conversationId: paramConversationId } = useParams<{ conversationId?: string }>()
    const initialQuery = location.state?.query || ''
    const initialConversationId = location.state?.conversationId || (paramConversationId ? parseInt(paramConversationId) : null)

    const [inputValue, setInputValue] = useState('')
    const [isBigPictureOpen, setIsBigPictureOpen] = useState(true)
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [currentCardIndex, setCurrentCardIndex] = useState(0)
    const [isCardFlipped, setIsCardFlipped] = useState(false)
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [expandedSources, setExpandedSources] = useState<{ [key: string]: boolean }>({})
    const [showShareModal, setShowShareModal] = useState(false)
    const [showHistorySidebar, setShowHistorySidebar] = useState(false)
    const [showFlagModal, setShowFlagModal] = useState(false)
    const [flaggingMessageId, setFlaggingMessageId] = useState<number | null>(null)
    const [isFlaggingMessage, setIsFlaggingMessage] = useState(false)
    const [showFlagQuizModal, setShowFlagQuizModal] = useState(false)
    const [flaggingQuizId, setFlaggingQuizId] = useState<string | null>(null)
    const [flaggingAttemptId, setFlaggingAttemptId] = useState<number | null>(null)
    const [isFlaggingQuiz, setIsFlaggingQuiz] = useState(false)
    const [bigPictureData, setBigPictureData] = useState<BigPictureTopic[]>([])

    // Use custom hook for message management
    const {
        messages,
        setMessages,
        conversationId,
        setConversationId,
        isSendingMessage,
        handleSend: sendMessage,
        handleInteractiveItemClick,
        handleFlagMessage: flagMessage
    } = useChatMessages({
        initialQuery,
        initialConversationId,
        user,
        locationState: location.state,
        setBigPictureData,
        setShowFlagModal,
        setFlaggingMessageId,
        setIsFlaggingMessage
    });

    // Use hooks for state management
    const studio = useStudio(conversationId)
    const quiz = useQuiz()

    const studioFeatures = [
        { icon: GitBranch, title: 'Bản đồ tư duy', description: 'Mind map', type: 'mindmap' as const, note: 'Tạo bản đồ tư duy dựa vào nội dung cuộc trò chuyện' },
        { icon: FileText, title: 'Báo cáo', description: 'Report', type: 'report' as const, note: 'Tạo báo cáo dựa vào nội dung cuộc trò chuyện' },
        { icon: StickyNote, title: 'Thẻ ghi nhớ', description: 'Note cards', type: 'notecard' as const, note: 'Tạo thẻ ghi nhớ dựa vào nội dung cuộc trò chuyện' },
        { icon: ClipboardCheck, title: 'Bài kiểm tra', description: 'Quiz', type: 'quiz' as const, note: 'Tạo bài kiểm tra dựa vào nội dung cuộc trò chuyện' },
        { icon: Map, title: 'Tư vấn lộ trình', description: 'Roadmap', type: 'roadmap' as const, note: 'Tạo lộ trình học tập dựa vào nội dung cuộc trò chuyện' }
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
                'quiz': 'Bài kiểm tra',
                'roadmap': 'Tư vấn lộ trình'
            }

            const options = {
                quantity: data.cardQuantity,
                topic: data.cardTopic,
                courseCode: data.customizeTab === 'course' ? data.selectedCourseCode : undefined,
                sourceSubjectIds: data.customizeTab === 'course' && data.selectedSubjectIds.length > 0 ? data.selectedSubjectIds : undefined,
                documentIds: undefined,
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

    const handleFlagQuiz = (itemId: string) => {
        setFlaggingQuizId(itemId)
        setFlaggingAttemptId(null) // Sidebar flagging doesn't have attemptId
        setShowFlagQuizModal(true)
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

    // Wrapper for sendMessage to handle input field clearing
    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMessage = inputValue;
        setInputValue(''); // Clear input immediately

        await sendMessage(userMessage);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
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



    return (
        <div className="chat-container">
            {/* Header */}
            <Header
                onToggleHistory={() => setShowHistorySidebar(!showHistorySidebar)}
                showShareButton={true}
                onShareClick={() => setShowShareModal(true)}
                showNotifications={true}
            />

            {/* History Sidebar */}
            <HistorySidebar
                isOpen={showHistorySidebar}
                onClose={() => setShowHistorySidebar(false)}
                currentConversationId={conversationId}
            />



            <main className="chat-main" style={{ display: 'flex', gap: '0', padding: '24px', alignItems: 'stretch' }}>
                {/* Big Picture Sidebar - Left */}
                < BigPictureSidebar
                    isOpen={isBigPictureOpen}
                    onToggle={() => setIsBigPictureOpen(!isBigPictureOpen)}
                    topics={bigPictureData}
                    hideFloatingButton={showHistorySidebar}
                    onTopicClick={handleInteractiveItemClick}
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
                            <MessageDisplay
                                key={index}
                                message={message}
                                messageIndex={index}
                                messages={messages}
                                expandedSources={expandedSources}
                                onToggleSource={(key) => setExpandedSources(prev => ({
                                    ...prev,
                                    [key]: !prev[key]
                                }))}
                                onInteractiveItemClick={handleInteractiveItemClick}
                                onFlagMessage={(messageId) => {
                                    setFlaggingMessageId(messageId);
                                    setShowFlagModal(true);
                                }}
                            />
                        ))}
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
                                disabled={!inputValue.trim() || isSendingMessage}
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
                    onEditFeature={(type: 'mindmap' | 'notecard' | 'quiz' | 'roadmap') => {
                        studio.setSelectedFeatureType(type)
                        studio.setShowCustomizeModal(true)
                    }}
                    onItemClick={handleStudioItemClick}
                    onDeleteItem={handleDeleteItem}
                    onFlagItem={handleFlagQuiz}
                    openMenuId={openMenuId}
                    onToggleMenu={toggleMenu}
                />
            </main >

            {/* Report Format Selection Modal */}
            < ReportFormatModal
                isOpen={studio.showReportFormatModal}
                onClose={() => studio.setShowReportFormatModal(false)}
                onSelectFormat={studio.handleReportFormatSelect}
            />

            {/* Report Modal */}
            < ReportModal
                isOpen={studio.showReportModal}
                onClose={() => studio.setShowReportModal(false)}
                content={studio.reportContent}
            />

            {/* Mindmap Modal */}
            < MindmapModal
                isOpen={studio.showMindmapModal}
                onClose={() => studio.setShowMindmapModal(false)}
                content={studio.mindmapContent}
            />



            {/* Notecard Modal */}
            < NotecardModal
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
                onFlag={() => {
                    if (quiz.quizResults?.attemptId && quiz.selectedQuizId) {
                        setFlaggingQuizId(`quiz-${quiz.selectedQuizId}`);
                        setFlaggingAttemptId(quiz.quizResults.attemptId);
                        setShowFlagQuizModal(true);
                    }
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
                onFlag={() => {
                    if (quiz.quizResults?.attemptId && quiz.selectedQuizId) {
                        setFlaggingQuizId(`quiz-${quiz.selectedQuizId}`);
                        setFlaggingAttemptId(quiz.quizResults.attemptId);
                        setShowFlagQuizModal(true);
                    }
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
                conversationId={conversationId}
            />

            {/* Flag Message Modal */}
            <FlagMessageModal
                isOpen={showFlagModal}
                onClose={() => {
                    setShowFlagModal(false);
                    setFlaggingMessageId(null);
                }}
                onSubmit={(reason) => {
                    if (flaggingMessageId) {
                        flagMessage(flaggingMessageId, reason);
                    }
                }}
                isSubmitting={isFlaggingMessage}
            />

            {/* Flag Quiz Modal */}
            <FlagQuizModal
                isOpen={showFlagQuizModal}
                onClose={() => {
                    setShowFlagQuizModal(false);
                    setFlaggingQuizId(null);
                    setFlaggingAttemptId(null);
                }}
                onSubmit={async (reason) => {
                    if (!flaggingQuizId) return;

                    setIsFlaggingQuiz(true);
                    try {
                        // Extract numeric ID from quiz-XXX format
                        const numericId = parseInt(flaggingQuizId.replace('quiz-', ''));

                        // Use flaggingService instead of direct fetch
                        await flaggingService.flagQuiz(numericId, reason, flaggingAttemptId || undefined);

                        toast.success('Báo cáo quiz đã được gửi thành công!');
                        setShowFlagQuizModal(false);
                        setFlaggingQuizId(null);
                        setFlaggingAttemptId(null);
                    } catch (error: any) {
                        console.error('Error flagging quiz:', error);
                        toast.error(error.message || 'Không thể gửi báo cáo. Vui lòng thử lại.');
                    } finally {
                        setIsFlaggingQuiz(false);
                    }
                }}
                isSubmitting={isFlaggingQuiz}
                quizTitle={studio.studioItems.find(item => item.id === flaggingQuizId)?.title}
            />

            {/* Roadmap Modal */}
            <RoadmapModal
                isOpen={studio.showRoadmapModal}
                onClose={() => studio.setShowRoadmapModal(false)}
                content={studio.roadmapContent}
            />

            {/* Delete Confirm Modal */}
            <ConfirmModal
                isOpen={studio.showDeleteConfirmModal}
                onClose={() => studio.setShowDeleteConfirmModal(false)}
                onConfirm={studio.confirmDeleteItem}
                title="Xác nhận xóa"
                message={`Bạn có chắc muốn xóa "${studio.studioItems.find(item => item.id === studio.itemToDelete)?.title}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                type="danger"
            />
        </div>
    )
}
