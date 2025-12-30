import { useState, useEffect } from 'react'
import { studioService } from '../../../service/studioService'
import studentService, { formatRoadmapAsMarkdown } from '../../../service/studentService'
import orientationService from '../../../service/orientationService'
import type { StudioItem } from '../types'
import { mockRoadmapContent } from '../../../data/mockData'
import { formatDateTimeVN } from '../../../utils/dateUtils'

/**
 * Extract a specific semester section from orientation document
 * Matches patterns like: 🟩 KỲ 1, 🟦 KỲ 2, etc.
 */
const extractSemesterSection = (content: string, semesterNumber: number): string | null => {
    if (!content || semesterNumber < 1 || semesterNumber > 9) {
        return null;
    }

    // Build regex to match semester header (with any emoji prefix)
    // Pattern: Any emoji(s) + "KỲ" + space + number
    const semesterPattern = new RegExp(
        `([\\p{Emoji}\\s]*KỲ\\s*${semesterNumber}[^\\n]*)`,
        'iu'
    );

    // Find start of target semester
    const startMatch = content.match(semesterPattern);
    if (!startMatch) {
        return null;
    }

    const startIndex = content.indexOf(startMatch[0]);

    // Find start of next semester (KỲ X+1 to KỲ 9)
    let endIndex = content.length;
    for (let nextSem = semesterNumber + 1; nextSem <= 9; nextSem++) {
        const nextPattern = new RegExp(`[\\p{Emoji}\\s]*KỲ\\s*${nextSem}`, 'iu');
        const nextMatch = content.substring(startIndex + startMatch[0].length).match(nextPattern);
        if (nextMatch) {
            endIndex = startIndex + startMatch[0].length + content.substring(startIndex + startMatch[0].length).indexOf(nextMatch[0]);
            break;
        }
    }

    // Extract the semester section
    const section = content.substring(startIndex, endIndex).trim();

    return section || null;
};

export const useStudio = (conversationId: number | null) => {
    const [isStudioOpen, setIsStudioOpen] = useState(true)
    const [studioItems, setStudioItems] = useState<StudioItem[]>([])
    const [isLoadingContent, setIsLoadingContent] = useState(false)
    const [selectedFeatureType, setSelectedFeatureType] = useState<'mindmap' | 'notecard' | 'quiz' | 'roadmap' | null>(null)

    // Modal States
    const [showReportModal, setShowReportModal] = useState(false)
    const [showReportFormatModal, setShowReportFormatModal] = useState(false)
    const [showMindmapModal, setShowMindmapModal] = useState(false)
    const [showNotecardModal, setShowNotecardModal] = useState(false)
    const [showQuizModal, setShowQuizModal] = useState(false)
    const [showQuizSideModal, setShowQuizSideModal] = useState(false)
    const [showCustomizeModal, setShowCustomizeModal] = useState(false)
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
    const [showRoadmapModal, setShowRoadmapModal] = useState(false)
    const [showRoadmapOptionsModal, setShowRoadmapOptionsModal] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<string | null>(null)

    // Content States
    const [selectedMindmapId, setSelectedMindmapId] = useState<string | null>(null)
    const [selectedNotecardId, setSelectedNotecardId] = useState<string | null>(null)
    const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null)
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
    const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null)

    const [mindmapContent, setMindmapContent] = useState<any>(null)
    const [reportContent, setReportContent] = useState<any>(null)
    const [quizContent, setQuizContent] = useState<any>(null)
    const [flashcardContent, setFlashcardContent] = useState<any>(null)
    const [roadmapContent, setRoadmapContent] = useState<any>(null)

    // Fetch studio items when conversationId changes
    useEffect(() => {
        const fetchStudioItems = async () => {
            // Only fetch if we have a valid conversationId
            if (!conversationId) {
                console.log('No conversationId available, skipping studio items fetch');
                setStudioItems([]);
                return;
            }

            try {
                console.log(`Fetching studio items for conversation ${conversationId}`);

                // Fetch all studio item types for the CURRENT CONVERSATION
                const [mindmapsRes, quizzesRes, flashcardsRes, reportsRes] = await Promise.all([
                    studioService.listMindMaps(conversationId).catch(() => ({ data: { data: [] } })),
                    studioService.listQuizzes(conversationId).catch(() => ({ data: { data: [] } })),
                    studioService.listFlashcards(conversationId).catch(() => ({ data: { data: [] } })),
                    studioService.listReports(conversationId).catch(() => ({ data: { data: [] } })),
                    // ROADMAP API DISABLED - UI only
                    // studioService.listRoadmaps(conversationId).catch(() => ({ data: { data: [] } })),
                ]);
                const roadmapsRes = { data: { data: [] } }; // Mock empty roadmap list

                // Transform backend data to StudioItem format (with raw timestamp for sorting)
                interface RawStudioItem extends Omit<StudioItem, 'timestamp'> {
                    rawTimestamp: string;
                }
                const rawItems: RawStudioItem[] = [];

                // Add mindmaps
                if (mindmapsRes.data && mindmapsRes.data.data) {
                    rawItems.push(...mindmapsRes.data.data.map((m: any) => ({
                        id: `mindmap-${m.mindmapId}`,
                        type: 'mindmap' as const,
                        title: m.title,
                        subtitle: m.topic,
                        status: 'completed' as const,
                        rawTimestamp: m.generatedAt,
                        content: null
                    })));
                }

                // Add quizzes
                if (quizzesRes.data && quizzesRes.data.data) {
                    rawItems.push(...quizzesRes.data.data.map((q: any) => ({
                        id: `quiz-${q.quizId}`,
                        type: 'quiz' as const,
                        title: q.title,
                        subtitle: `${q.questionCount} câu hỏi • ${q.difficulty}`,
                        status: 'completed' as const,
                        rawTimestamp: q.generatedAt,
                        content: null
                    })));
                }

                // Add flashcards
                console.log('=== FLASHCARDS DEBUG ===');
                console.log('flashcardsRes:', flashcardsRes);
                console.log('flashcardsRes.data:', flashcardsRes.data);
                console.log('flashcardsRes.data.data:', flashcardsRes.data?.data);

                if (flashcardsRes.data && flashcardsRes.data.data) {
                    console.log(`Processing ${flashcardsRes.data.data.length} flashcard sets`);
                    rawItems.push(...flashcardsRes.data.data.map((f: any) => {
                        console.log('Flashcard item:', f);
                        return {
                            id: `notecard-${f.flashcardSetId}`,
                            type: 'notecard' as const,
                            title: f.title,
                            subtitle: `${f.cardCount} thẻ`,
                            status: 'completed' as const,
                            rawTimestamp: f.generatedAt,
                            content: null
                        };
                    }));
                    console.log(`Added ${flashcardsRes.data.data.length} flashcard items`);
                } else {
                    console.log('No flashcard data found');
                }
                console.log('======================');

                // Add reports
                if (reportsRes.data && reportsRes.data.data) {
                    rawItems.push(...reportsRes.data.data.map((r: any) => ({
                        id: `report-${r.reportId}`,
                        type: 'report' as const,
                        title: r.title,
                        subtitle: 'Báo cáo',
                        status: 'completed' as const,
                        rawTimestamp: r.generatedAt,
                        content: null
                    })));
                }

                // Add roadmaps
                if (roadmapsRes.data && roadmapsRes.data.data) {
                    rawItems.push(...roadmapsRes.data.data.map((rm: any) => ({
                        id: `roadmap-${rm.roadmapId}`,
                        type: 'roadmap' as const,
                        title: rm.title,
                        subtitle: 'Lộ trình học tập',
                        status: 'completed' as const,
                        rawTimestamp: rm.generatedAt,
                        content: null
                    })));
                }

                // Sort by raw timestamp (newest first)
                rawItems.sort((a, b) => new Date(b.rawTimestamp).getTime() - new Date(a.rawTimestamp).getTime());

                // Format timestamps for display and remove rawTimestamp
                const items: StudioItem[] = rawItems.map(({ rawTimestamp, ...rest }) => ({
                    ...rest,
                    timestamp: formatDateTimeVN(rawTimestamp)
                }));

                setStudioItems(items);

                console.log(`Fetched ${items.length} studio items for conversation ${conversationId}`);
            } catch (error) {
                console.error('Failed to fetch studio items:', error);
            }
        };

        fetchStudioItems();
    }, [conversationId]); // Re-fetch when conversationId changes

    const createStudioItem = async (
        type: 'mindmap' | 'report' | 'notecard' | 'quiz' | 'roadmap',
        title: string,
        options?: {
            quantity?: number;
            topic?: string;
            courseCode?: string;
            documentIds?: number[];
            sourceType?: 'conversation' | 'documents' | 'hybrid';
            sourceSubjectIds?: number[];
            reportType?: 'summary' | 'detailed' | 'analysis';
            // 🆕 Phase 1: Session range for personalized generation
            sessionFrom?: number;
            sessionTo?: number;
        }
    ) => {
        // Validate conversationId exists
        if (!conversationId) {
            console.error('Cannot create studio item: No active conversation');
            return;
        }

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
            // Use the conversationId from the hook parameter
            console.log(`Creating ${type} for conversation ${conversationId}`);
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

            // Enable document mode when documents OR subjects are selected
            if ((options?.documentIds && options.documentIds.length > 0) ||
                (options?.sourceSubjectIds && options.sourceSubjectIds.length > 0)) {

                if (options?.documentIds && options.documentIds.length > 0) {
                    sourceDocumentIds = options.documentIds;
                }
                sourceType = 'documents';
                console.log('Using document mode. Docs:', sourceDocumentIds, 'Subjects:', options?.sourceSubjectIds);
            }

            switch (type) {
                case 'mindmap':
                    response = await studioService.generateMindMap({
                        conversationId,
                        title: effectiveTitle,
                        topic: generationContext || effectiveTitle,
                        sourceType,
                        documentIds: sourceDocumentIds,
                        topKChunks: 5,
                        // 🆕 Phase 1: Session filtering
                        sourceSubjectIds: options?.sourceSubjectIds,
                        sessionFrom: options?.sessionFrom,
                        sessionTo: options?.sessionTo
                    });
                    break;
                case 'report':
                    response = await studioService.generateReport({
                        conversationId,
                        title: effectiveTitle,
                        reportType: options?.reportType || 'summary',
                        sourceType,
                        sourceSubjectIds: options?.sourceSubjectIds,
                        sourceDocumentIds: sourceDocumentIds
                    });
                    break;
                case 'quiz':
                    response = await studioService.generateQuiz({
                        conversationId,
                        title: effectiveTitle,
                        difficulty: 'medium',
                        questionCount: effectiveQuantity,
                        topics: generationContext ? [generationContext] : [],
                        sourceType,
                        sourceSubjectIds: options?.sourceSubjectIds,
                        documentIds: sourceDocumentIds,
                        // 🆕 Phase 1: Session filtering
                        sessionFrom: options?.sessionFrom,
                        sessionTo: options?.sessionTo
                    });
                    break;
                case 'notecard':
                    response = await studioService.generateFlashcard({
                        conversationId,
                        title: effectiveTitle,
                        topic: generationContext || effectiveTitle,
                        cardCount: effectiveQuantity,
                        sourceType,
                        sourceDocumentIds: sourceDocumentIds,
                        // 🆕 Phase 1: Session filtering
                        sourceSubjectIds: options?.sourceSubjectIds,
                        sessionFrom: options?.sessionFrom,
                        sessionTo: options?.sessionTo
                    });
                    break;
                case 'roadmap':
                    // Fetch admin-edited Course Overview content from Orientation API
                    try {
                        const orientationData = await orientationService.getContent();
                        response = {
                            data: {
                                data: {
                                    roadmapId: `roadmap-${Date.now()}`,
                                    title: orientationData.subjectName || 'Định hướng',
                                    content: orientationData.content || 'Chưa có nội dung. Vui lòng liên hệ Admin để cập nhật.'
                                }
                            }
                        };
                    } catch (error) {
                        console.error('Failed to fetch orientation content, using fallback:', error);
                        // Fallback message if API fails
                        response = {
                            data: {
                                data: {
                                    roadmapId: `fallback-${Date.now()}`,
                                    title: 'Định hướng',
                                    content: 'Không thể tải nội dung định hướng. Vui lòng thử lại sau.'
                                }
                            }
                        };
                    }
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

                const rawId = responseData.mindmapId ||
                    responseData.mindmapIdMongo ||
                    responseData.reportId ||
                    responseData.quizId ||
                    responseData.flashcardSetId ||
                    responseData.roadmapId ||
                    tempId;

                // Add type prefix to ID to ensure uniqueness across different item types
                const realId = `${type === 'notecard' ? 'notecard' : type}-${rawId}`;

                console.log('Extracted ID:', realId);

                // Store content directly to avoid re-fetching
                setStudioItems(prev => prev.map(item => {
                    if (item.id === tempId) {
                        return {
                            ...item,
                            id: realId,
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

    // Helper function to extract numeric ID from prefixed ID (e.g., "mindmap-10" -> "10")
    const extractNumericId = (prefixedId: string): string => {
        const parts = prefixedId.split('-');
        return parts.length > 1 ? parts.slice(1).join('-') : prefixedId;
    };

    const handleStudioItemClick = async (item: StudioItem) => {
        if (item.status !== 'completed') return;

        setIsLoadingContent(true);
        try {
            // Extract numeric ID for API calls (backend expects numeric IDs)
            const numericId = extractNumericId(item.id);

            if (item.type === 'mindmap') {
                setSelectedMindmapId(item.id);

                // Use cached content if available, otherwise fetch from API
                if (item.content) {
                    console.log('Using cached mindmap content:', item.content);
                    setMindmapContent(item.content);
                } else {
                    console.log('Fetching mindmap content from API:', numericId);
                    const response = await studioService.getMindMapContent(numericId);
                    if (response.data) setMindmapContent(response.data.data || response.data);
                }
                setShowMindmapModal(true);
            } else if (item.type === 'notecard') {
                setSelectedNotecardId(item.id);

                // Use cached content if available
                if (item.content) {
                    console.log('Using cached flashcard content:', item.content);
                    // Transform flashcards to cards format for modal
                    const transformedContent = {
                        ...item.content,
                        cards: item.content.flashcards?.map((fc: any) => ({
                            front: fc.term,
                            back: fc.definition
                        })) || []
                    };
                    setFlashcardContent(transformedContent);
                } else {
                    console.log('Fetching flashcard content from API:', numericId);
                    const response = await studioService.getFlashcardContent(numericId);
                    if (response.data) {
                        const rawContent = response.data.data || response.data;
                        // Transform flashcards to cards format for modal
                        const transformedContent = {
                            ...rawContent,
                            cards: rawContent.flashcards?.map((fc: any) => ({
                                front: fc.term,
                                back: fc.definition
                            })) || []
                        };
                        setFlashcardContent(transformedContent);
                    }
                }
                setShowNotecardModal(true);
            } else if (item.type === 'quiz') {
                setSelectedQuizId(item.id);

                // Use cached content if available
                if (item.content) {
                    console.log('Using cached quiz content:', item.content);
                    setQuizContent(item.content);
                } else {
                    console.log('Fetching quiz content from API:', numericId);
                    const response = await studioService.getQuizContent(numericId);
                    if (response.data) setQuizContent(response.data.data || response.data);
                }
                setShowQuizSideModal(true);
            } else if (item.type === 'report') {
                setSelectedReportId(item.id);
                const response = await studioService.getReportContent(numericId);
                if (response.data) setReportContent(response.data.data);
                setShowReportModal(true);
            } else if (item.type === 'roadmap') {
                setSelectedRoadmapId(item.id);

                // Use cached content if available
                if (item.content) {
                    console.log('Using cached roadmap content:', item.content);
                    setRoadmapContent(item.content);
                } else {
                    // ROADMAP API DISABLED - UI only with mock data
                    console.log('Loading mock roadmap content');
                    // const response = await studioService.getRoadmapContent(numericId);
                    // if (response.data) setRoadmapContent(response.data.data || response.data);
                    setRoadmapContent(mockRoadmapContent);
                }
                setShowRoadmapModal(true);
            }
        } catch (error) {
            console.error("Failed to load content:", error);
        } finally {
            setIsLoadingContent(false);
        }
    }

    const handleReportFormatSelect = (format: string) => {
        let reportType: 'summary' | 'detailed' | 'analysis' = 'summary';

        if (format.toLowerCase().includes('chi tiết') || format.toLowerCase() === 'detailed') {
            reportType = 'detailed';
        } else if (format.toLowerCase().includes('phân tích') || format.toLowerCase() === 'analysis') {
            reportType = 'analysis';
        }

        createStudioItem('report', `Báo cáo ${format}`, { reportType })
        setShowReportFormatModal(false)
    }

    const handleStudioFeatureClick = (type: 'mindmap' | 'report' | 'notecard' | 'quiz' | 'roadmap', title: string) => {
        if (type === 'report') {
            setShowReportFormatModal(true)
        } else if (type === 'roadmap') {
            // For roadmap, show options modal instead of creating item
            setShowRoadmapOptionsModal(true)
        } else {
            createStudioItem(type, title)
        }
    }

    // Handle roadmap option selection
    const handleRoadmapOptionSelect = async (option: 'all' | 'current') => {
        setShowRoadmapOptionsModal(false)
        setIsLoadingContent(true)

        try {
            let content: any;
            let title: string;

            if (option === 'all') {
                // Fetch Course Overview from Orientation API
                const orientationData = await orientationService.getContent();
                title = orientationData.subjectName || 'Định hướng';
                content = {
                    title,
                    content: orientationData.content || 'Chưa có nội dung. Vui lòng liên hệ Admin để cập nhật.'
                };
            } else {
                // Fetch orientation document and extract current semester section
                const orientationData = await orientationService.getContent();
                const fullContent = orientationData.content || '';

                // Get current semester from localStorage (key is 'user_data' per STORAGE_KEYS)
                const storedUser = localStorage.getItem('user_data');
                const parsedUser = storedUser ? JSON.parse(storedUser) : null;

                // Debug log to see what we're getting
                console.log('=== Semester Debug ===');
                console.log('storedUser raw:', storedUser);
                console.log('parsedUser:', parsedUser);
                console.log('parsedUser?.currentSemester:', parsedUser?.currentSemester);

                // Parse semester number - handle both "4" and "HK4" formats
                let currentSemesterNumber = 1;
                const semesterStr = parsedUser?.currentSemester;
                if (semesterStr) {
                    // Extract number from string (e.g., "4", "HK4", "Kỳ 4" -> 4)
                    const numMatch = semesterStr.toString().match(/\d+/);
                    if (numMatch) {
                        currentSemesterNumber = parseInt(numMatch[0], 10);
                    }
                }

                console.log('Final currentSemesterNumber:', currentSemesterNumber);

                // Extract the section for current semester using regex
                // Pattern matches: emoji + KỲ X (where X is the semester number)
                const semesterSection = extractSemesterSection(fullContent, currentSemesterNumber);

                if (semesterSection) {
                    title = `Lộ trình Kỳ ${currentSemesterNumber}`;
                    content = {
                        title,
                        content: semesterSection
                    };
                } else {
                    title = `Kỳ ${currentSemesterNumber}`;
                    content = {
                        title,
                        content: `Không tìm thấy nội dung cho Kỳ ${currentSemesterNumber} trong tài liệu định hướng.`
                    };
                }
            }

            setRoadmapContent(content);
            setShowRoadmapModal(true);
        } catch (error) {
            console.error('Failed to fetch roadmap content:', error);
            setRoadmapContent({
                title: 'Lỗi',
                content: 'Không thể tải nội dung. Vui lòng thử lại sau.'
            });
            setShowRoadmapModal(true);
        } finally {
            setIsLoadingContent(false);
        }
    }

    const handleDeleteItem = (itemId: string) => {
        // Open confirmation modal instead of window.confirm
        setItemToDelete(itemId);
        setShowDeleteConfirmModal(true);
    }

    const confirmDeleteItem = async () => {
        if (!itemToDelete) return;

        // Parse item type and ID from prefixed ID (e.g., "quiz-123" -> type="quiz", id="123")
        const [itemType, ...idParts] = itemToDelete.split('-');
        const actualId = idParts.join('-'); // Handle IDs that might contain dashes

        try {
            // Call the appropriate delete API based on item type
            switch (itemType) {
                case 'quiz':
                    await studioService.deleteQuiz(parseInt(actualId));
                    break;
                case 'mindmap':
                    await studioService.deleteMindMap(parseInt(actualId));
                    break;
                case 'notecard':
                    await studioService.deleteFlashcard(actualId); // Flashcard uses string ID
                    break;
                case 'report':
                    await studioService.deleteReport(actualId); // Report uses string ID
                    break;
                case 'roadmap':
                    await studioService.deleteRoadmap(actualId); // Roadmap uses string ID
                    break;
                default:
                    console.error(`Unknown item type: ${itemType}`);
                    return;
            }

            // Remove from UI after successful deletion
            setStudioItems(prev => prev.filter(item => item.id !== itemToDelete));

            console.log(`Successfully deleted ${itemType} with ID ${actualId}`);
        } catch (error: any) {
            console.error(`Failed to delete ${itemType}:`, error);

            // Show user-friendly error messages
            let errorMessage = 'Không thể xóa item này.';

            if (error.response?.status === 404) {
                errorMessage = 'Item không tồn tại.';
            } else if (error.response?.status === 403) {
                errorMessage = 'Bạn không có quyền xóa item này.';
            } else if (error.response?.status === 400) {
                errorMessage = 'Lỗi: Dữ liệu không hợp lệ.';
            }

            alert(errorMessage);
        } finally {
            // Close modal and reset state
            setShowDeleteConfirmModal(false);
            setItemToDelete(null);
        }
    }

    return {
        isStudioOpen,
        setIsStudioOpen,
        studioItems,
        setStudioItems,
        isLoadingContent,
        selectedFeatureType,
        setSelectedFeatureType,
        showReportModal,
        setShowReportModal,
        showReportFormatModal,
        setShowReportFormatModal,
        showMindmapModal,
        setShowMindmapModal,
        showNotecardModal,
        setShowNotecardModal,
        showQuizModal,
        setShowQuizModal,
        showQuizSideModal,
        setShowQuizSideModal,
        showCustomizeModal,
        setShowCustomizeModal,
        selectedMindmapId,
        selectedNotecardId,
        selectedQuizId,
        selectedReportId,
        mindmapContent,
        reportContent,
        quizContent,
        flashcardContent,
        createStudioItem,
        handleStudioItemClick,
        handleReportFormatSelect,
        handleStudioFeatureClick,
        handleDeleteItem,
        showDeleteConfirmModal,
        setShowDeleteConfirmModal,
        itemToDelete,
        confirmDeleteItem,
        showRoadmapModal,
        setShowRoadmapModal,
        showRoadmapOptionsModal,
        setShowRoadmapOptionsModal,
        handleRoadmapOptionSelect,
        selectedRoadmapId,
        roadmapContent
    }
}
