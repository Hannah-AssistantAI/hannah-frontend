import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sparkles, Send, ThumbsUp, ThumbsDown, Share2, Upload, Book, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, Wand2, GitBranch, FileText, ClipboardCheck, StickyNote, Loader2, MoreVertical, Trash2, ChevronDown, ChevronUp, Link as LinkIcon, List, Pencil, Maximize2, Minimize2, User, LogOut, Share } from 'lucide-react'
import ProfileIcon from '../../components/ProfileIcon'
import { studioService } from '../../service/studioService'
import subjectService from '../../service/subjectService'
import type { Subject } from '../../service/subjectService'
import './Chat.css'

interface StudioItem {
    id: string
    type: 'mindmap' | 'report' | 'notecard' | 'quiz'
    title: string
    subtitle: string
    status: 'loading' | 'completed'
    timestamp: string
    content?: any  // Store generated content to avoid re-fetching
}

interface Source {
    id: string
    title: string
    url: string
    description: string
    icon?: string
}

interface RelatedContent {
    id: string
    title: string
    description: string
    url: string
    source: string
    sourceIcon?: string
    shortTitle?: string
}

interface Message {
    type: string
    content: string
    isStreaming?: boolean
    relatedContent?: RelatedContent[]
}

export default function Chat() {
    const location = useLocation()
    const navigate = useNavigate()
    const initialQuery = location.state?.query || ''

    const [inputValue, setInputValue] = useState('')
    const [isBigPictureOpen, setIsBigPictureOpen] = useState(true)
    const [isStudioOpen, setIsStudioOpen] = useState(true)
    const [studioItems, setStudioItems] = useState<StudioItem[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([]) // Store fetched subjects
    const [showReportModal, setShowReportModal] = useState(false)
    const [showReportFormatModal, setShowReportFormatModal] = useState(false)
    const [showMindmapModal, setShowMindmapModal] = useState(false)
    const [showNotecardModal, setShowNotecardModal] = useState(false)
    const [showQuizModal, setShowQuizModal] = useState(false)
    const [showQuizSideModal, setShowQuizSideModal] = useState(false)
    const [selectedMindmapId, setSelectedMindmapId] = useState<string | null>(null)
    const [selectedNotecardId, setSelectedNotecardId] = useState<string | null>(null)
    const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null)
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
    const [currentCardIndex, setCurrentCardIndex] = useState(0)
    const [isCardFlipped, setIsCardFlipped] = useState(false)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({})
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)

    // Studio Content State
    const [mindmapContent, setMindmapContent] = useState<any>(null)
    const [reportContent, setReportContent] = useState<any>(null)
    const [quizContent, setQuizContent] = useState<any>(null)
    const [flashcardContent, setFlashcardContent] = useState<any>(null)
    const [isLoadingContent, setIsLoadingContent] = useState(false)

    const [expandedSources, setExpandedSources] = useState<{ [key: string]: boolean }>({})
    const [showCustomizeModal, setShowCustomizeModal] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const [shareEmail, setShareEmail] = useState('')
    const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('view')
    const [notifyPeople, setNotifyPeople] = useState(true)
    const [generalAccess, setGeneralAccess] = useState<'restricted' | 'anyone'>('restricted')
    const [showAccessDropdown, setShowAccessDropdown] = useState(false)
    const shareModalRef = useRef<HTMLDivElement>(null)
    const accessDropdownRef = useRef<HTMLDivElement>(null)
    const [selectedFeatureType, setSelectedFeatureType] = useState<'mindmap' | 'notecard' | 'quiz' | null>(null)
    const [customizeTab, setCustomizeTab] = useState<'conversation' | 'course'>('conversation')
    const [cardQuantity, setCardQuantity] = useState<number>(6) // Default: 6 (Tiêu chuẩn)
    const [cardDifficulty, setCardDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
    const [cardTopic, setCardTopic] = useState('')
    const [selectedCourseCode, setSelectedCourseCode] = useState('')
    const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([])
    const [courseSearchQuery, setCourseSearchQuery] = useState('')
    const [showCourseDropdown, setShowCourseDropdown] = useState(false)
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

    const getIconForType = (type: string) => {
        switch (type) {
            case 'mindmap': return GitBranch
            case 'report': return FileText
            case 'notecard': return StickyNote
            case 'quiz': return ClipboardCheck
            default: return FileText
        }
    }

    const handleReportFormatSelect = (format: string) => {
        createStudioItem('report', `Báo cáo ${format}`)
        setShowReportFormatModal(false)
    }

    const handleStudioFeatureClick = (type: 'mindmap' | 'report' | 'notecard' | 'quiz', title: string) => {
        if (type === 'report') {
            setShowReportFormatModal(true)
        } else {
            createStudioItem(type, title)
        }
    }

    const createStudioItem = async (
        type: 'mindmap' | 'report' | 'notecard' | 'quiz',
        title: string,
        options?: {
            quantity?: number;
            topic?: string;
            courseCode?: string;
            documentIds?: number[];
            sourceType?: 'conversation' | 'documents' | 'hybrid';
        }
    ) => {
        const tempId = Date.now().toString()
        const newItem: StudioItem = {
            id: tempId,
            type,
            title,
            subtitle: 'Đang tạo...',
            status: 'loading',
            timestamp: 'Vừa xong'
        }

        setStudioItems(prev => [newItem, ...prev])

        try {
            // Hardcoded conversationId for now as per plan
            const conversationId = 3;
            let response;

            // Determine effective title with course code if provided
            let effectiveTitle = title;
            let generationContext = undefined;
            const effectiveCourseCode = options?.courseCode;

            if (effectiveCourseCode) {
                // When course code is selected, always include it in the title
                if (options?.topic) {
                    effectiveTitle = `${effectiveCourseCode} - ${options.topic}`;
                    generationContext = options.topic;
                } else {
                    // If no topic is provided, use course code as both title and context
                    effectiveTitle = effectiveCourseCode;
                    generationContext = effectiveCourseCode;
                }
            } else if (options?.topic) {
                // Normal conversation mode with topic
                effectiveTitle = options.topic;
                generationContext = options.topic;
            }

            const effectiveQuantity = options?.quantity || (type === 'quiz' ? 15 : 10);

            // Determine source type and documents
            let sourceDocumentIds: number[] | undefined = undefined;
            let sourceType: 'conversation' | 'documents' | 'hybrid' = 'conversation';

            // TEMPORARY: Force conversation mode to avoid Gemini API quota errors
            // TODO: Re-enable documents mode when quota is available
            // Use explicitly selected documentIds from dropdown
            // if (options?.documentIds && options.documentIds.length > 0) {
            //     sourceDocumentIds = options.documentIds;
            //     sourceType = 'documents';
            //     console.log('Using selected document IDs:', sourceDocumentIds);
            // }

            const sourceSubjectIds = undefined; // Will need to implement subject ID mapping

            switch (type) {
                case 'mindmap':
                    response = await studioService.generateMindMap({
                        conversationId,
                        title: effectiveTitle,
                        topic: generationContext || effectiveTitle,
                        sourceType,
                        documentIds: sourceDocumentIds,
                        topKChunks: 5
                    });
                    break;
                case 'report':
                    response = await studioService.generateReport({
                        conversationId,
                        title: effectiveTitle,
                        reportType: 'standard', // Default report type
                        sourceSubjectIds,
                        sourceDocumentIds
                    });
                    break;
                case 'quiz':
                    response = await studioService.generateQuiz({
                        conversationId,
                        title: effectiveTitle,
                        difficulty: 'medium',
                        questionCount: effectiveQuantity,
                        topics: generationContext ? [generationContext] : [],
                        sourceSubjectIds,
                        sourceDocumentIds
                    });
                    break;
                case 'notecard':
                    response = await studioService.generateFlashcard({
                        conversationId,
                        title: effectiveTitle,
                        cardCount: effectiveQuantity,
                        sourceSubjectIds,
                        sourceDocumentIds
                    });
                    break;
            }

            console.log('=== STUDIO API RESPONSE ===');
            console.log('Full response:', response);
            console.log('Response.data:', response?.data);
            console.log('===========================');

            if (response && response.data) {
                // Handle both mindmapId and mindmapIdMongo (Python API uses MongoDB IDs)
                // Also handle wrapped data structure (response.data.data)
                const responseData = response.data.data || response.data;

                const realId = responseData.mindmapId ||
                    responseData.mindmapIdMongo ||
                    responseData.reportId ||
                    responseData.quizId ||
                    responseData.flashcardSetId ||
                    tempId;

                console.log('Extracted ID:', realId);

                // Store content directly to avoid re-fetching
                setStudioItems(prev => prev.map(item => {
                    if (item.id === tempId) {
                        return {
                            ...item,
                            id: realId.toString(),
                            status: 'completed' as const,
                            subtitle: 'Đã tạo xong',
                            content: responseData  // Save the unwrapped data
                        };
                    }
                    return item;
                }));
            }
        } catch (error) {
            console.error("=== STUDIO API ERROR ===");
            console.error("Error object:", error);
            console.error("Error message:", (error as any)?.message);
            console.error("Error status:", (error as any)?.status);
            console.error("========================");
            setStudioItems(prev => prev.map(item =>
                item.id === tempId
                    ? { ...item, subtitle: 'Lỗi tạo nội dung', status: 'completed' }
                    : item
            ));
        }
    }

    const handleStudioItemClick = async (item: StudioItem) => {
        if (item.status !== 'completed') return;

        setIsLoadingContent(true);
        try {
            if (item.type === 'mindmap') {
                setSelectedMindmapId(item.id);

                // Use cached content if available, otherwise fetch from API
                if (item.content) {
                    console.log('Using cached mindmap content:', item.content);
                    setMindmapContent(item.content);
                } else {
                    console.log('Fetching mindmap content from API:', item.id);
                    const response = await studioService.getMindMapContent(item.id);
                    if (response.data) setMindmapContent(response.data.data || response.data);
                }
                setShowMindmapModal(true);
            } else if (item.type === 'notecard') {
                setSelectedNotecardId(item.id);

                // Use cached content if available
                if (item.content) {
                    console.log('Using cached flashcard content:', item.content);
                    setFlashcardContent(item.content);
                } else {
                    console.log('Fetching flashcard content from API:', item.id);
                    const response = await studioService.getFlashcardContent(item.id);
                    if (response.data) setFlashcardContent(response.data.data || response.data);
                }
                setCurrentCardIndex(0);
                setIsCardFlipped(false);
                setShowNotecardModal(true);
            } else if (item.type === 'quiz') {
                setSelectedQuizId(item.id);

                // Use cached content if available
                if (item.content) {
                    console.log('Using cached quiz content:', item.content);
                    setQuizContent(item.content);
                } else {
                    console.log('Fetching quiz content from API:', item.id);
                    const response = await studioService.getQuizContent(item.id);
                    if (response.data) setQuizContent(response.data.data || response.data);
                }
                setCurrentQuestionIndex(0);
                setSelectedAnswers({});
                setShowQuizSideModal(true);
            } else if (item.type === 'report') {
                setSelectedReportId(item.id);
                const response = await studioService.getReportContent(item.id);
                if (response.data) setReportContent(response.data.data);
                setShowReportModal(true);
            }
        } catch (error) {
            console.error("Failed to load content:", error);
        } finally {
            setIsLoadingContent(false);
        }
    }

    // Helper to build mindmap tree structure
    const getMindmapTree = () => {
        if (!mindmapContent?.content?.nodes) return null;

        const nodes = mindmapContent.content.nodes;
        const edges = mindmapContent.content.edges || [];

        // Find root: node with type 'root' or no incoming edges
        let root = nodes.find((n: any) => n.type === 'root');

        // If no explicit root type, find node with no incoming edges
        if (!root && edges.length > 0) {
            const targetIds = new Set(edges.map((e: any) => e.to || e.to_node));
            root = nodes.find((n: any) => !targetIds.has(n.id));
        }

        // Fallback to first node if still not found
        if (!root && nodes.length > 0) root = nodes[0];

        if (!root) return null;

        // Find direct children of root
        const childrenIds = edges
            .filter((e: any) => (e.from === root.id || e.from_node === root.id))
            .map((e: any) => e.to || e.to_node);

        const children = nodes.filter((n: any) => childrenIds.includes(n.id));

        return { root, children };
    };

    const handleCustomizeSubmit = () => {
        if (selectedFeatureType) {
            const featureTitles = {
                'mindmap': 'Bản đồ tư duy',
                'notecard': 'Thẻ ghi nhớ',
                'quiz': 'Bài kiểm tra'
            }

            const options = {
                quantity: cardQuantity,
                topic: cardTopic,
                courseCode: customizeTab === 'course' ? selectedCourseCode : undefined,
                documentIds: customizeTab === 'course' && selectedSubjectIds.length > 0 ? selectedSubjectIds : undefined,
                sourceType: (customizeTab === 'course' && selectedSubjectIds.length > 0) ? 'documents' as const : 'conversation' as const
            };

            createStudioItem(selectedFeatureType, featureTitles[selectedFeatureType], options)

            // Log the settings for debugging (remove in production)
            console.log('Creating item with settings:', {
                type: selectedFeatureType,
                quantity: cardQuantity,
                difficulty: cardDifficulty,
                topic: cardTopic,
                documentIds: selectedSubjectIds
            })
        }
        setShowCustomizeModal(false)
        // Reset form
        setCustomizeTab('conversation')
        setCardQuantity(6) // Reset to default 6
        setCardDifficulty('medium')
        setCardTopic('')
        setSelectedCourseCode('')
        setSelectedSubjectIds([])
        setCourseSearchQuery('')
        setShowCourseDropdown(false)
    }

    const handleDeleteItem = (itemId: string) => {
        setStudioItems(prev => prev.filter(item => item.id !== itemId))
        setOpenMenuId(null)
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
            // Close course dropdown when clicking outside
            if (!target.closest('.course-code-dropdown')) {
                setShowCourseDropdown(false)
            }

            // Close access dropdown when clicking outside
            if (accessDropdownRef.current && !accessDropdownRef.current.contains(target)) {
                setShowAccessDropdown(false)
            }
        }

        if (openMenuId || showCourseDropdown || showAccessDropdown) {
            document.addEventListener('click', handleClickOutside)
            return () => document.removeEventListener('click', handleClickOutside)
        }
    }, [openMenuId, showCourseDropdown, showAccessDropdown])

    const handleCopyLink = () => {
        const link = window.location.href
        navigator.clipboard.writeText(link)
        alert('Đã sao chép đường liên kết!')
    }

    // Handle keyboard navigation for notecards
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (!showNotecardModal) return

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

        if (showNotecardModal) {
            document.addEventListener('keydown', handleKeyPress)
            return () => document.removeEventListener('keydown', handleKeyPress)
        }
    }, [showNotecardModal])

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
                                        key={source.id}
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
                                    key={item.id}
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
                <aside className={`big-picture-sidebar ${isBigPictureOpen ? 'open' : 'closed'}`} style={{ order: 1, width: isBigPictureOpen ? '356px' : '56px', padding: '0 24px 0 0', flexShrink: 0 }}>
                    {/* Floating Toggle Button - Only show when sidebar is closed */}
                    {!isBigPictureOpen && (
                        <button
                            className="big-picture-toggle-floating"
                            onClick={() => setIsBigPictureOpen(true)}
                            aria-label="Hiện bức tranh toàn cảnh"
                            style={{
                                position: 'absolute',
                                top: '12px',
                                left: '12px',
                                zIndex: 1000,
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                border: '1px solid #dadce0',
                                backgroundColor: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                const target = e.target as HTMLButtonElement
                                target.style.backgroundColor = '#f8f9fa'
                                target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
                            }}
                            onMouseLeave={(e) => {
                                const target = e.target as HTMLButtonElement
                                target.style.backgroundColor = 'white'
                                target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.12)'
                            }}
                        >
                            <PanelLeft size={16} color="#5f6368" />
                        </button>
                    )}

                    <div className="big-picture-content">
                        <div className="big-picture-header">
                            <Book size={20} color="#5f6368" />
                            <h3 className="big-picture-title">Bức tranh toàn cảnh</h3>
                            {/* Big Picture Toggle Button */}
                            <button
                                className="big-picture-toggle-btn"
                                onClick={() => setIsBigPictureOpen(!isBigPictureOpen)}
                                aria-label={isBigPictureOpen ? 'Ẩn bức tranh toàn cảnh' : 'Hiện bức tranh toàn cảnh'}
                            >
                                {isBigPictureOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
                            </button>
                        </div>

                        <h4 className="big-picture-main-title">Lập trình Hướng đối tượng (OOP)</h4>

                        <div className="big-picture-topics">
                            {bigPictureTopics.map((topic, index) => (
                                <div key={index} className="big-picture-topic-item">
                                    <button className="big-picture-topic-button">
                                        <span className="big-picture-topic-title">{topic.title}</span>
                                    </button>
                                    <div className="big-picture-subtopics-list">
                                        {topic.subtopics.map((subtopic, subIndex) => (
                                            <button key={subIndex} className="big-picture-subtopic-button">
                                                {subtopic}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

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
                <aside className={`studio-sidebar ${isStudioOpen ? 'open' : 'closed'}`} style={{ order: 1, width: isStudioOpen ? '356px' : '56px', padding: '0 0 0 24px', flexShrink: 0 }}>
                    <div className="studio-content">
                        <div className="studio-header">
                            <Wand2 size={20} color="#5f6368" />
                            <h3 className="studio-title">Studio</h3>
                            {/* Studio Toggle Button */}
                            <button
                                className="studio-toggle-btn"
                                onClick={() => setIsStudioOpen(!isStudioOpen)}
                                aria-label={isStudioOpen ? 'Ẩn studio' : 'Hiện studio'}
                            >
                                {isStudioOpen ? <PanelRightClose size={18} /> : <PanelRight size={18} />}
                            </button>
                        </div>

                        <div className="studio-features">
                            {studioFeatures.map((feature, index) => {
                                const IconComponent = feature.icon
                                return (
                                    <div key={index} className="studio-feature-card-wrapper">
                                        <button
                                            className="studio-feature-card"
                                            onClick={() => handleStudioFeatureClick(feature.type, feature.title)}
                                            title={feature.note}
                                        >
                                            {feature.type !== 'report' && (
                                                <button
                                                    className="studio-feature-edit-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedFeatureType(feature.type)
                                                        setShowCustomizeModal(true)
                                                    }}
                                                    aria-label="Edit feature"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                            )}
                                            <IconComponent size={24} color="#5f6368" />
                                            <span className="feature-title">{feature.title}</span>
                                        </button>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Studio Items List or Empty State */}
                        {studioItems.length > 0 ? (
                            <div className="studio-items-list">
                                {studioItems.map((item) => {
                                    const IconComponent = getIconForType(item.type)
                                    return (
                                        <div key={item.id} className="studio-item">
                                            <div
                                                className="studio-item-clickable"
                                                onClick={() => handleStudioItemClick(item)}
                                                style={{ cursor: item.status === 'completed' && (item.type === 'mindmap' || item.type === 'notecard' || item.type === 'quiz' || item.type === 'report') ? 'pointer' : 'default' }}
                                            >
                                                <div className="studio-item-icon">
                                                    {item.status === 'loading' ? (
                                                        <Loader2 size={20} color="#5f6368" className="spinning" />
                                                    ) : (
                                                        <IconComponent size={20} color="#5f6368" />
                                                    )}
                                                </div>
                                                <div className="studio-item-content">
                                                    <h4 className="studio-item-title">{item.title}</h4>
                                                    <p className="studio-item-subtitle">
                                                        {item.subtitle} • {item.timestamp}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="studio-item-menu-container">
                                                <button
                                                    className="studio-item-menu"
                                                    aria-label="Thêm tùy chọn"
                                                    onClick={() => toggleMenu(item.id)}
                                                >
                                                    <MoreVertical size={20} color="#5f6368" />
                                                </button>
                                                {openMenuId === item.id && (
                                                    <div className="studio-item-dropdown">
                                                        <button
                                                            className="dropdown-item delete-item"
                                                            onClick={() => handleDeleteItem(item.id)}
                                                        >
                                                            <Trash2 size={16} />
                                                            <span>Xóa</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="studio-description">
                                <Wand2 size={40} color="#9aa0a6" className="studio-icon" />
                                <p className="studio-subtitle">Đầu ra của Studio sẽ được lưu ở đây.</p>
                                <p className="studio-text">
                                    Sau khi thêm nguồn, hãy nhập để thêm Tổng quan bảng âm thanh, Hướng dẫn học tập, Bản đồ tư duy và nhiều thông tin khác!
                                </p>
                            </div>
                        )}
                    </div>
                </aside>
            </main>

            {/* Report Format Selection Modal */}
            {showReportFormatModal && (
                <div className="modal-overlay" onClick={() => setShowReportFormatModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">Chọn định dạng báo cáo</h3>
                        <div className="report-formats">
                            <button
                                className="format-option"
                                onClick={() => handleReportFormatSelect('Tổng quan')}
                            >
                                <FileText size={24} />
                                <span>Tổng quan</span>
                            </button>
                            <button
                                className="format-option"
                                onClick={() => handleReportFormatSelect('Chi tiết')}
                            >
                                <FileText size={24} />
                                <span>Chi tiết</span>
                            </button>
                            <button
                                className="format-option"
                                onClick={() => handleReportFormatSelect('Tóm tắt')}
                            >
                                <FileText size={24} />
                                <span>Tóm tắt</span>
                            </button>
                        </div>
                        <button className="modal-close" onClick={() => setShowReportFormatModal(false)}>
                            Hủy
                        </button>
                    </div>
                </div>
            )}

            {/* Report Display Modal */}
            {showReportModal && (
                <div className="report-modal-overlay" onClick={() => setShowReportModal(false)}>
                    <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="report-modal-header">
                            <h2 className="report-modal-title">{reportContent?.title || 'Báo cáo'}</h2>
                            <p className="report-modal-subtitle">Được tạo bởi AI</p>
                            <button
                                className="report-modal-close"
                                onClick={() => setShowReportModal(false)}
                                aria-label="Đóng"
                            >
                                ×
                            </button>
                        </div>

                        <div className="report-content-container">
                            <div className="report-section">
                                <h3 className="report-section-title">Nội dung báo cáo</h3>
                                <div className="report-text" style={{ whiteSpace: 'pre-wrap' }}>
                                    {reportContent?.content || 'Đang tải nội dung...'}
                                </div>
                            </div>
                        </div>

                        <div className="report-modal-footer">
                            <button className="report-action-btn">
                                <ThumbsUp size={18} />
                                Nội dung hữu ích
                            </button>
                            <button className="report-action-btn">
                                <ThumbsDown size={18} />
                                Nội dung không phù hợp
                            </button>
                        </div>

                        <p className="report-modal-notice">
                            AI có thể đưa ra thông tin không chính xác; hãy kiểm tra kỹ nội dung báo cáo
                        </p>
                    </div>
                </div>
            )}

            {/* Mindmap Modal */}
            {showMindmapModal && (
                <div className="mindmap-modal-overlay" onClick={() => setShowMindmapModal(false)}>
                    <div className="mindmap-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="mindmap-modal-header">
                            <h2 className="mindmap-modal-title">{mindmapContent?.title || 'NỘI DUNG'}</h2>
                            <p className="mindmap-modal-subtitle">Dựa trên 1 nguồn</p>
                            <button
                                className="mindmap-modal-close"
                                onClick={() => setShowMindmapModal(false)}
                                aria-label="Đóng"
                            >
                                ×
                            </button>
                        </div>
                        <div className="mindmap-container">
                            <div className="mindmap-canvas">
                                {/* Root Node - Left Side */}
                                <div className="mindmap-root-node">
                                    <div className="mindmap-node mindmap-node-central">
                                        {getMindmapTree()?.root?.label || mindmapContent?.title || 'NỘI DUNG'}
                                    </div>
                                </div>

                                {/* SVG for drawing edges */}
                                <svg className="mindmap-svg">
                                    {getMindmapTree()?.children?.map((node: any, index: number) => {
                                        const children = getMindmapTree()?.children;
                                        const totalChildren = children?.length ?? 1;
                                        
                                        // Root position (left side, centered vertically)
                                        const rootX = 150;
                                        const rootY = 50; // percentage
                                        
                                        // Child nodes position (right side, distributed vertically)
                                        const childY = ((index + 1) / (totalChildren + 1)) * 100; // percentage
                                        const childX = 450;
                                        
                                        return (
                                            <line
                                                key={`edge-${index}`}
                                                x1={`${rootX}px`}
                                                y1={`${rootY}%`}
                                                x2={`${childX}px`}
                                                y2={`${childY}%`}
                                                stroke="#667eea"
                                                strokeWidth="2"
                                                opacity="0.6"
                                            />
                                        );
                                    })}
                                </svg>

                                {/* Child Nodes - Right Side */}
                                <div className="mindmap-children-container">
                                    {getMindmapTree()?.children?.map((node: any, index: number) => {
                                        const children = getMindmapTree()?.children;
                                        const totalChildren = children?.length ?? 1;
                                        const yPosition = ((index + 1) / (totalChildren + 1)) * 100;
                                        
                                        return (
                                            <div
                                                key={index}
                                                className="mindmap-child-wrapper"
                                                style={{
                                                    top: `${yPosition}%`,
                                                }}
                                            >
                                                <div className="mindmap-node mindmap-node-primary">
                                                    {node.label}
                                                    <button className="mindmap-expand-btn">›</button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {(!getMindmapTree()?.children || getMindmapTree()?.children.length === 0) && (
                                        <div className="mindmap-loading">
                                            {mindmapContent ? 'Không có nhánh con' : 'Đang tải...'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mindmap-modal-footer">
                            <button className="mindmap-action-btn">
                                <ThumbsUp size={18} />
                                Nội dung hay
                            </button>
                            <button className="mindmap-action-btn">
                                <ThumbsDown size={18} />
                                Nội dung không phù hợp
                            </button>
                        </div>
                        {/* <p className="mindmap-modal-notice">
                            Notebook.M có thể đưa ra thông tin không chính xác; hãy kiểm tra kỹ cảu trả lời mà bạn nhận được
                        </p> */}
                    </div>
                </div>
            )}

            {/* Notecard (Flashcard) Modal */}
            {showNotecardModal && (
                <div className="notecard-modal-overlay" onClick={() => setShowNotecardModal(false)}>
                    <div className="notecard-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="notecard-modal-header">
                            <h2 className="notecard-modal-title">{flashcardContent?.title || 'Thẻ ghi nhớ'}</h2>
                            <p className="notecard-modal-subtitle">Dựa trên {flashcardContent?.cardCount || 0} thẻ</p>
                            <button
                                className="notecard-modal-close"
                                onClick={() => setShowNotecardModal(false)}
                                aria-label="Đóng"
                            >
                                ×
                            </button>
                        </div>

                        <div className="notecard-instruction">
                            Nhấn phím cách để lật thẻ, nhấn phím mũi tên ←/→ để đi chuyển
                        </div>

                        <div className="notecard-container">
                            <button
                                className="notecard-nav-btn notecard-nav-prev"
                                onClick={() => {
                                    setCurrentCardIndex(prev => Math.max(0, prev - 1))
                                    setIsCardFlipped(false)
                                }}
                                disabled={currentCardIndex === 0}
                            >
                                ←
                            </button>

                            <div
                                className={`notecard ${isCardFlipped ? 'flipped' : ''}`}
                                onClick={() => setIsCardFlipped(!isCardFlipped)}
                            >
                                <div className="notecard-inner">
                                    <div className="notecard-front">
                                        <p className="notecard-text">
                                            {flashcardContent?.cards?.[currentCardIndex]?.front || 'Đang tải...'}
                                        </p>
                                        <button className="notecard-flip-hint">Xem câu trả lời</button>
                                    </div>
                                    <div className="notecard-back">
                                        <p className="notecard-text">
                                            {flashcardContent?.cards?.[currentCardIndex]?.back || ''}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="notecard-nav-btn notecard-nav-next"
                                onClick={() => {
                                    setCurrentCardIndex(prev => Math.min((flashcardContent?.cards?.length || 1) - 1, prev + 1))
                                    setIsCardFlipped(false)
                                }}
                                disabled={currentCardIndex === (flashcardContent?.cards?.length || 1) - 1}
                            >
                                →
                            </button>
                        </div>

                        <div className="notecard-progress">
                            <button className="notecard-shuffle-btn">
                                <span>🔄</span>
                                Bắt đầu lại
                            </button>
                            <span className="notecard-counter">{currentCardIndex + 1} / 105 thẻ</span>
                        </div>

                        <div className="notecard-modal-footer">
                            <button className="notecard-action-btn">
                                <ThumbsUp size={18} />
                                Nội dung hữu ích
                            </button>
                            <button className="notecard-action-btn">
                                <ThumbsDown size={18} />
                                Nội dung không phù hợp
                            </button>
                        </div>

                        <p className="notecard-modal-notice">
                            Notebook.M có thể đưa ra thông tin không chính xác; hãy kiểm tra kỹ câu trả lời mà bạn nhận được
                        </p>
                    </div>
                </div>
            )}

            {/* Quiz Modal */}
            {showQuizModal && (
                <div className="quiz-modal-overlay" onClick={() => setShowQuizModal(false)}>
                    <div className="quiz-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="quiz-modal-header">
                            <h2 className="quiz-modal-title">Triết học Trắc nghiệm</h2>
                            <p className="quiz-modal-subtitle">Dựa trên 1 nguồn</p>
                            <div className="quiz-modal-header-actions">
                                {selectedQuizId && (
                                    <button
                                        className="quiz-modal-minimize"
                                        onClick={() => {
                                            setShowQuizModal(false)
                                            setShowQuizSideModal(true)
                                        }}
                                        aria-label="Thu nhỏ"
                                        title="Thu nhỏ"
                                    >
                                        <Minimize2 size={20} />
                                    </button>
                                )}
                                {/* <button 
                                    className="quiz-modal-close" 
                                    onClick={() => setShowQuizModal(false)}
                                    aria-label="Đóng"
                                >
                                    ×
                                </button> */}
                            </div>
                        </div>

                        <div className="quiz-progress-bar">
                            <div className="quiz-progress-indicator">
                                {currentQuestionIndex + 1} / {quizContent?.questions?.length || 0}
                            </div>
                        </div>

                        <div className="quiz-container">
                            <div className="quiz-question">
                                <p className="quiz-question-text">
                                    {quizContent?.questions?.[currentQuestionIndex]?.question || 'Đang tải câu hỏi...'}
                                </p>
                            </div>

                            <div className="quiz-answers">
                                {quizContent?.questions?.[currentQuestionIndex]?.options?.map((option: string, idx: number) => {
                                    const label = String.fromCharCode(65 + idx); // A, B, C, D...
                                    return (
                                        <button
                                            key={idx}
                                            className={`quiz-answer-option ${selectedAnswers[currentQuestionIndex] === label ? 'selected' : ''}`}
                                            onClick={() => setSelectedAnswers({ ...selectedAnswers, [currentQuestionIndex]: label })}
                                        >
                                            <span className="quiz-answer-label">{label}.</span>
                                            <span className="quiz-answer-text">
                                                {option}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="quiz-navigation">
                            <button
                                className="quiz-nav-btn quiz-hint-btn"
                                onClick={() => {
                                    // Toggle hint functionality
                                }}
                            >
                                Gợi ý
                            </button>
                            <button
                                className="quiz-nav-btn quiz-next-btn"
                                onClick={() => {
                                    if (currentQuestionIndex < (quizContent?.questions?.length || 1) - 1) {
                                        setCurrentQuestionIndex(prev => prev + 1)
                                    }
                                }}
                            >
                                Tiếp theo
                            </button>
                        </div>

                        <div className="quiz-modal-footer">
                            <button className="quiz-feedback-btn">
                                <ThumbsUp size={18} />
                                Nội dung hữu ích
                            </button>
                            <button className="quiz-feedback-btn">
                                <ThumbsDown size={18} />
                                Nội dung không phù hợp
                            </button>
                        </div>

                        {/* <p className="quiz-modal-notice">
                            Notebook.M có thể đưa ra thông tin không chính xác; hãy kiểm tra kỹ câu trả lời mà bạn nhận được
                        </p> */}
                    </div>
                </div>
            )}

            {/* Quiz Side Modal - Positioned next to sidebar */}
            {showQuizSideModal && (
                <div className="quiz-side-modal-overlay">
                    <div className="quiz-side-modal-content">
                        <div className="quiz-side-modal-header">
                            <h2 className="quiz-side-modal-title">Bài kiểm tra</h2>
                            <div className="quiz-side-modal-actions">
                                <button
                                    className="quiz-side-expand-btn"
                                    onClick={() => {
                                        setShowQuizSideModal(false)
                                        setShowQuizModal(true)
                                    }}
                                    aria-label="Mở rộng"
                                >
                                    <Maximize2 size={18} />
                                </button>
                                <button
                                    className="quiz-side-modal-close"
                                    onClick={() => setShowQuizSideModal(false)}
                                    aria-label="Đóng"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="quiz-side-progress-bar">
                            <div className="quiz-side-progress-text">
                                Câu {currentQuestionIndex + 1} / {quizContent?.questions?.length || 0}
                            </div>
                        </div>

                        <div className="quiz-side-container">
                            <div className="quiz-side-question">
                                <p className="quiz-side-question-text">
                                    {quizContent?.questions?.[currentQuestionIndex]?.question || 'Đang tải câu hỏi...'}
                                </p>
                            </div>

                            <div className="quiz-side-answers">
                                {quizContent?.questions?.[currentQuestionIndex]?.options?.map((option: string, idx: number) => {
                                    const label = String.fromCharCode(65 + idx); // A, B, C, D...
                                    return (
                                        <button
                                            key={idx}
                                            className={`quiz-side-answer-option ${selectedAnswers[currentQuestionIndex] === label ? 'selected' : ''}`}
                                            onClick={() => setSelectedAnswers({ ...selectedAnswers, [currentQuestionIndex]: label })}
                                        >
                                            <span className="quiz-side-answer-label">{label}.</span>
                                            <span className="quiz-side-answer-text">
                                                {option}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="quiz-side-navigation">
                            <button
                                className="quiz-side-nav-btn quiz-side-hint-btn"
                                onClick={() => {
                                    // Toggle hint functionality
                                }}
                            >
                                Gợi ý
                            </button>
                            <button
                                className="quiz-side-nav-btn quiz-side-next-btn"
                                onClick={() => {
                                    if (currentQuestionIndex < (quizContent?.questions?.length || 1) - 1) {
                                        setCurrentQuestionIndex(prev => prev + 1)
                                    }
                                }}
                            >
                                Tiếp theo
                            </button>
                        </div>

                        <div className="quiz-side-modal-footer">
                            <button className="quiz-side-feedback-btn">
                                <ThumbsUp size={18} />
                                Hữu ích
                            </button>
                            <button className="quiz-side-feedback-btn">
                                <ThumbsDown size={18} />
                                Không phù hợp
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Customize Feature Modal */}
            {showCustomizeModal && (
                <div className="modal-overlay" onClick={() => setShowCustomizeModal(false)}>
                    <div className="customize-modal-content" style={{ maxWidth: '1000px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="customize-modal-header">
                            <div className="customize-modal-title-wrapper">
                                <ClipboardCheck size={24} color="#5f6368" />
                                <h3 className="customize-modal-title">Tùy chỉnh thẻ thông tin</h3>
                            </div>
                            <button
                                className="customize-modal-close"
                                onClick={() => setShowCustomizeModal(false)}
                                aria-label="Đóng"
                            >
                                ×
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="customize-tabs">
                            <button
                                className={`customize-tab ${customizeTab === 'conversation' ? 'active' : ''}`}
                                onClick={() => setCustomizeTab('conversation')}
                            >
                                Theo nội dung cuộc trò chuyện
                            </button>
                            <button
                                className={`customize-tab ${customizeTab === 'course' ? 'active' : ''}`}
                                onClick={() => setCustomizeTab('course')}
                            >
                                Theo mã môn học
                            </button>
                        </div>

                        <div className="customize-modal-body">
                            {customizeTab === 'conversation' ? (
                                <>
                                    {/* Số lượng thẻ */}
                                    <div className="customize-section">
                                        <h4 className="customize-section-title">Số lượng thẻ</h4>
                                        <div className="customize-options" style={{ maxWidth: '50%' }}>
                                            <button
                                                className={`customize-option-btn ${cardQuantity === 3 ? 'selected' : ''}`}
                                                onClick={() => setCardQuantity(3)}
                                            >
                                                Ít hơn
                                            </button>
                                            <button
                                                className={`customize-option-btn ${cardQuantity === 6 ? 'selected' : ''}`}
                                                onClick={() => setCardQuantity(6)}
                                            >
                                                Tiêu chuẩn
                                            </button>
                                            <button
                                                className={`customize-option-btn ${cardQuantity === 9 ? 'selected' : ''}`}
                                                onClick={() => setCardQuantity(9)}
                                            >
                                                Nhiều hơn
                                            </button>
                                        </div>
                                    </div>

                                    {/* Chủ đề nên là gì */}
                                    <div className="customize-section">
                                        <h4 className="customize-section-title">Mô tả</h4>
                                        <textarea
                                            className="customize-textarea"
                                            style={{ maxWidth: '98%' }}
                                            placeholder="Mô tả ngắn gọn về chủ đề"
                                            value={cardTopic}
                                            onChange={(e) => setCardTopic(e.target.value)}
                                            rows={6}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Số lượng thẻ và Mã môn học trên cùng một hàng */}
                                    <div className="customize-row">
                                        {/* Số lượng thẻ */}
                                        <div className="customize-section">
                                            <h4 className="customize-section-title">Số lượng thẻ</h4>
                                            <div className="customize-options">
                                                <button
                                                    className={`customize-option-btn ${cardQuantity === 3 ? 'selected' : ''}`}
                                                    onClick={() => setCardQuantity(3)}
                                                >
                                                    Ít hơn
                                                </button>
                                                <button
                                                    className={`customize-option-btn ${cardQuantity === 6 ? 'selected' : ''}`}
                                                    onClick={() => setCardQuantity(6)}
                                                >
                                                    Tiêu chuẩn
                                                </button>
                                                <button
                                                    className={`customize-option-btn ${cardQuantity === 9 ? 'selected' : ''}`}
                                                    onClick={() => setCardQuantity(9)}
                                                >
                                                    Nhiều hơn
                                                </button>
                                            </div>
                                        </div>


                                        {/* Môn học */}
                                        <div className="customize-section">
                                            <h4 className="customize-section-title">Chọn môn học</h4>
                                            <div className="course-code-dropdown">
                                                <input
                                                    type="text"
                                                    className="course-code-search"
                                                    placeholder="Tìm kiếm môn học (VD: SUB101, PRO...)"
                                                    value={courseSearchQuery}
                                                    onChange={(e) => {
                                                        setCourseSearchQuery(e.target.value)
                                                        setShowCourseDropdown(true)
                                                    }}
                                                    onFocus={() => setShowCourseDropdown(true)}
                                                />
                                                {courseSearchQuery && showCourseDropdown && (
                                                    <div className="course-code-options">
                                                        {subjects
                                                            .filter((subject: Subject) =>
                                                                subject.code?.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
                                                                subject.name?.toLowerCase().includes(courseSearchQuery.toLowerCase())
                                                            )
                                                            .map((subject: Subject) => (
                                                                <button
                                                                    key={subject.subjectId}
                                                                    className="course-code-option"
                                                                    onClick={() => {
                                                                        setSelectedSubjectIds([subject.subjectId])
                                                                        setSelectedCourseCode(subject.code)
                                                                        setCourseSearchQuery(`${subject.code} - ${subject.name}`)
                                                                        setShowCourseDropdown(false)
                                                                    }}
                                                                >
                                                                    <span className="course-code">{subject.code}</span>
                                                                    <span className="course-name">{subject.name}</span>
                                                                </button>
                                                            ))
                                                        }
                                                        {subjects.filter((subject: Subject) =>
                                                            subject.code?.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
                                                            subject.name?.toLowerCase().includes(courseSearchQuery.toLowerCase())
                                                        ).length === 0 && (
                                                                <div className="course-code-no-results">
                                                                    Không tìm thấy môn học
                                                                </div>
                                                            )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mô tả */}
                                    <div className="customize-section">
                                        <h4 className="customize-section-title">Mô tả</h4>
                                        <textarea
                                            className="customize-textarea"
                                            style={{ maxWidth: '98%' }}
                                            placeholder="Mô tả ngắn gọn về chủ đề"
                                            value={cardTopic}
                                            onChange={(e) => setCardTopic(e.target.value)}
                                            rows={6}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="customize-modal-footer">
                            <button
                                className="customize-create-btn"
                                onClick={handleCustomizeSubmit}
                            >
                                Tạo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {showShareModal && (
                <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
                    <div className="share-modal-content" onClick={(e) => e.stopPropagation()} ref={shareModalRef}>
                        <div className="share-modal-header">
                            <div className="share-modal-title-section">
                                <Share2 size={20} color="#5f6368" />
                                <h3 className="share-modal-title">Chia sẻ cuộc trò chuyện</h3>
                            </div>
                            <button
                                className="share-modal-close"
                                onClick={() => setShowShareModal(false)}
                                aria-label="Đóng"
                            >
                                ×
                            </button>
                        </div>

                        <div className="share-modal-body">
                            {/* Add people input */}
                            <div className="share-input-section">
                                <input
                                    type="email"
                                    className="share-email-input"
                                    placeholder="Thêm người dùng và nhóm*"
                                    value={shareEmail}
                                    onChange={(e) => setShareEmail(e.target.value)}
                                />
                            </div>

                            {/* People with access */}
                            <div className="share-access-section">
                                <h4 className="share-section-title">Người có quyền truy cập</h4>
                                <div className="share-user-item">
                                    <div className="share-user-avatar">
                                        <img
                                            src="https://ui-avatars.com/api/?name=Ha+Nguyen&background=4285F4&color=fff&size=40"
                                            alt="Hà Nguyễn"
                                        />
                                    </div>
                                    <div className="share-user-info">
                                        <div className="share-user-name">Ha Nguyen</div>
                                        <div className="share-user-email">khanhhanguyen1123@gmail...</div>
                                    </div>
                                    <div className="share-user-role">
                                        <select className="share-role-select" disabled>
                                            <option value="owner">Chủ sở hữu</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* General access */}
                            <div className="share-general-section">
                                <h4 className="share-section-title">Quyền truy cập chung</h4>
                                <div className="share-access-control" ref={accessDropdownRef}>
                                    <div className="share-access-icon">
                                        {generalAccess === 'restricted' ? '🔒' : '🌐'}
                                    </div>
                                    <div className="share-access-info">
                                        <div className="share-access-title">
                                            {generalAccess === 'restricted' ? 'Bị hạn chế' : 'Bất kỳ ai có đường liên kết'}
                                        </div>
                                        <div className="share-access-description">
                                            {generalAccess === 'restricted'
                                                ? 'Chỉ những người có quyền truy cập mới có thể mở bằng đường liên kết này'
                                                : 'Bất kỳ ai có đường liên kết đều có thể xem'
                                            }
                                        </div>
                                    </div>
                                    <button
                                        className="share-access-dropdown"
                                        onClick={() => setShowAccessDropdown(!showAccessDropdown)}
                                    >
                                        <ChevronDown size={20} />
                                    </button>

                                    {/* Access Dropdown Menu */}
                                    {showAccessDropdown && (
                                        <div className="share-access-dropdown-menu">
                                            <button
                                                className={`share-access-option ${generalAccess === 'restricted' ? 'active' : ''}`}
                                                onClick={() => {
                                                    setGeneralAccess('restricted')
                                                    setShowAccessDropdown(false)
                                                }}
                                            >
                                                <div className="share-access-option-icon">🔒</div>
                                                <div className="share-access-option-info">
                                                    <div className="share-access-option-title">Bị hạn chế</div>
                                                    <div className="share-access-option-desc">
                                                        Chỉ những người được thêm mới có quyền truy cập
                                                    </div>
                                                </div>
                                                {generalAccess === 'restricted' && (
                                                    <div className="share-access-option-check">✓</div>
                                                )}
                                            </button>
                                            <button
                                                className={`share-access-option ${generalAccess === 'anyone' ? 'active' : ''}`}
                                                onClick={() => {
                                                    setGeneralAccess('anyone')
                                                    setShowAccessDropdown(false)
                                                }}
                                            >
                                                <div className="share-access-option-icon">🌐</div>
                                                <div className="share-access-option-info">
                                                    <div className="share-access-option-title">Bất kỳ ai có đường liên kết</div>
                                                    <div className="share-access-option-desc">
                                                        Bất kỳ ai có đường liên kết đều có thể xem
                                                    </div>
                                                </div>
                                                {generalAccess === 'anyone' && (
                                                    <div className="share-access-option-check">✓</div>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="share-modal-footer">
                            <button className="share-copy-link-btn" onClick={handleCopyLink}>
                                <LinkIcon size={18} />
                                Sao chép đường liên kết
                            </button>
                            <button
                                className="share-done-btn"
                                onClick={() => setShowShareModal(false)}
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
