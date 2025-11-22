import { useState, useEffect } from 'react'
import { studioService } from '../../../service/studioService'
import type { StudioItem } from '../types'

export const useStudio = () => {
    const [isStudioOpen, setIsStudioOpen] = useState(true)
    const [studioItems, setStudioItems] = useState<StudioItem[]>([])
    const [isLoadingContent, setIsLoadingContent] = useState(false)
    const [selectedFeatureType, setSelectedFeatureType] = useState<'mindmap' | 'notecard' | 'quiz' | null>(null)

    // Modal States
    const [showReportModal, setShowReportModal] = useState(false)
    const [showReportFormatModal, setShowReportFormatModal] = useState(false)
    const [showMindmapModal, setShowMindmapModal] = useState(false)
    const [showNotecardModal, setShowNotecardModal] = useState(false)
    const [showQuizModal, setShowQuizModal] = useState(false)
    const [showQuizSideModal, setShowQuizSideModal] = useState(false)
    const [showCustomizeModal, setShowCustomizeModal] = useState(false)

    // Content States
    const [selectedMindmapId, setSelectedMindmapId] = useState<string | null>(null)
    const [selectedNotecardId, setSelectedNotecardId] = useState<string | null>(null)
    const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null)
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null)

    const [mindmapContent, setMindmapContent] = useState<any>(null)
    const [reportContent, setReportContent] = useState<any>(null)
    const [quizContent, setQuizContent] = useState<any>(null)
    const [flashcardContent, setFlashcardContent] = useState<any>(null)

    // Fetch studio items on mount
    useEffect(() => {
        const fetchStudioItems = async () => {
            try {
                const conversationId = 1; // Using hardcoded conversation ID for now

                // Fetch all studio item types
                const [mindmapsRes, quizzesRes, flashcardsRes, reportsRes] = await Promise.all([
                    studioService.listMindMaps(conversationId).catch(() => ({ data: { data: [] } })),
                    studioService.listQuizzes(conversationId).catch(() => ({ data: { data: [] } })),
                    studioService.listFlashcards(conversationId).catch(() => ({ data: { data: [] } })),
                    studioService.listReports(conversationId).catch(() => ({ data: { data: [] } })),
                ]);

                // Transform backend data to StudioItem format
                const items: StudioItem[] = [];

                // Add mindmaps
                if (mindmapsRes.data && mindmapsRes.data.data) {
                    items.push(...mindmapsRes.data.data.map((m: any) => ({
                        id: m.mindmapId.toString(),
                        type: 'mindmap' as const,
                        title: m.title,
                        subtitle: m.topic,
                        status: 'completed' as const,
                        timestamp: m.generatedAt,
                        content: null
                    })));
                }

                // Add quizzes
                if (quizzesRes.data && quizzesRes.data.data) {
                    items.push(...quizzesRes.data.data.map((q: any) => ({
                        id: q.quizId.toString(),
                        type: 'quiz' as const,
                        title: q.title,
                        subtitle: `${q.questionCount} câu hỏi • ${q.difficulty}`,
                        status: 'completed' as const,
                        timestamp: q.generatedAt,
                        content: null
                    })));
                }

                // Add flashcards
                if (flashcardsRes.data && flashcardsRes.data.data) {
                    items.push(...flashcardsRes.data.data.map((f: any) => ({
                        id: f.flashcardSetId.toString(),
                        type: 'notecard' as const,
                        title: f.title,
                        subtitle: `${f.cardCount} thẻ`,
                        status: 'completed' as const,
                        timestamp: f.generatedAt,
                        content: null
                    })));
                }

                // Add reports
                if (reportsRes.data && reportsRes.data.data) {
                    items.push(...reportsRes.data.data.map((r: any) => ({
                        id: r.reportId.toString(),
                        type: 'report' as const,
                        title: r.title,
                        subtitle: 'Báo cáo',
                        status: 'completed' as const,
                        timestamp: r.generatedAt,
                        content: null
                    })));
                }

                // Sort by timestamp (newest first) and set state
                items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setStudioItems(items);

                console.log(`Fetched ${items.length} studio items from backend`);
            } catch (error) {
                console.error('Failed to fetch studio items:', error);
            }
        };

        fetchStudioItems();
    }, []);

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
            const conversationId = 1;
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

            // Enable document mode when documents are selected
            if (options?.documentIds && options.documentIds.length > 0) {
                sourceDocumentIds = options.documentIds;
                sourceType = 'documents';
                console.log('Using document mode with selected document IDs:', sourceDocumentIds);
            }

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
                        topic: generationContext || effectiveTitle,
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

    const handleDeleteItem = (itemId: string) => {
        setStudioItems(prev => prev.filter(item => item.id !== itemId))
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
        handleDeleteItem
    }
}
