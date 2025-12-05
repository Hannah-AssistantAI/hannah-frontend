/**
 * Translation labels for multi-language support
 * Supports: Vietnamese (vi) and English (en)
 */

export type SupportedLanguage = 'vi' | 'en';

export interface UILabels {
    // Message sections
    bigPicture: string;
    relatedImages: string;
    relatedVideos: string;
    interactiveList: string;
    suggestedQuestions: string;
    outline: string;

    // Actions
    showMore: string;
    showMoreSlides: (count: number) => string;
    collapse: string;
    clickToView: string;
    copyLink: string;
    learnMore: string;
    simplify: string;
    deepDive: string;

    // Slide labels
    slide: string;
    fullSlide: string;

    // Quiz
    quiz: string;
    question: string;
    submit: string;

    // General
    loading: string;
    error: string;
    retry: string;

    // Studio
    studio: string;
    mindMap: string;
    report: string;
    noteCards: string;
    test: string;
    roadmap: string;
    studioEmpty: string;
    studioEmptyHint: string;

    // MindMap
    resources: string;
    aiTutor: string;
    askAiAbout: (topic: string) => string;
    explainMore: string;
    giveExample: string;
    askAboutTopic: (topic: string) => string;
}

const translations: Record<SupportedLanguage, UILabels> = {
    vi: {
        // Message sections
        bigPicture: 'Bức tranh toàn cảnh',
        relatedImages: 'Hình ảnh liên quan',
        relatedVideos: 'Video liên quan',
        interactiveList: 'Danh sách tương tác',
        suggestedQuestions: 'Câu hỏi gợi ý',
        outline: 'Dàn ý',

        // Actions
        showMore: 'Xem thêm',
        showMoreSlides: (count: number) => `Xem thêm ${count} slide khác`,
        collapse: 'Thu gọn',
        clickToView: 'Nhấn để xem đầy đủ',
        copyLink: 'Sao chép liên kết',
        learnMore: 'Tìm hiểu thêm',
        simplify: 'Đơn giản hóa',
        deepDive: 'Tìm hiểu sâu hơn',

        // Slide labels
        slide: 'Slide',
        fullSlide: 'Full Slide',

        // Quiz
        quiz: 'Bài kiểm tra',
        question: 'Câu hỏi',
        submit: 'Nộp bài',

        // General
        loading: 'Đang tải...',
        error: 'Có lỗi xảy ra',
        retry: 'Thử lại',

        // Studio
        studio: 'Studio',
        mindMap: 'Bản đồ tư duy',
        report: 'Báo cáo',
        noteCards: 'Thẻ ghi nhớ',
        test: 'Bài kiểm tra',
        roadmap: 'Tư vấn lộ trình',
        studioEmpty: 'Đầu ra của Studio sẽ được lưu ở đây.',
        studioEmptyHint: 'Sau khi thêm nguồn, hãy nhập để thêm Tổng quan bảng âm thanh, Hướng dẫn học tập, Bản đồ tư duy và nhiều thông tin khác!',

        // MindMap
        resources: 'Tài nguyên',
        aiTutor: 'AI Tutor',
        askAiAbout: (topic: string) => `Hỏi AI về "${topic}"`,
        explainMore: 'Giải thích chi tiết hơn',
        giveExample: 'Cho ví dụ thực tế',
        askAboutTopic: (topic: string) => `Hỏi về ${topic}...`
    },
    en: {
        // Message sections
        bigPicture: 'Big Picture',
        relatedImages: 'Related Images',
        relatedVideos: 'Related Videos',
        interactiveList: 'Interactive List',
        suggestedQuestions: 'Suggested Questions',
        outline: 'Outline',

        // Actions
        showMore: 'Show more',
        showMoreSlides: (count: number) => `Show ${count} more slides`,
        collapse: 'Collapse',
        clickToView: 'Click to view full',
        copyLink: 'Copy link',
        learnMore: 'Learn more',
        simplify: 'Simplify',
        deepDive: 'Deep Dive',

        // Slide labels
        slide: 'Slide',
        fullSlide: 'Full Slide',

        // Quiz
        quiz: 'Quiz',
        question: 'Question',
        submit: 'Submit',

        // General
        loading: 'Loading...',
        error: 'An error occurred',
        retry: 'Retry',

        // Studio
        studio: 'Studio',
        mindMap: 'Mind Map',
        report: 'Report',
        noteCards: 'Note Cards',
        test: 'Quiz',
        roadmap: 'Learning Roadmap',
        studioEmpty: 'Studio outputs will be saved here.',
        studioEmptyHint: 'After adding sources, enter to add audio board overview, learning guide, mind map and more!',

        // MindMap
        resources: 'Resources',
        aiTutor: 'AI Tutor',
        askAiAbout: (topic: string) => `Ask AI about "${topic}"`,
        explainMore: 'Explain in more detail',
        giveExample: 'Give real-world example',
        askAboutTopic: (topic: string) => `Ask about ${topic}...`
    }
};

/**
 * Get labels for a specific language
 * @param language - 'vi' or 'en', defaults to 'vi'
 */
export function getLabels(language?: SupportedLanguage | string | null): UILabels {
    const lang = (language === 'en' ? 'en' : 'vi') as SupportedLanguage;
    return translations[lang];
}

/**
 * Hook-friendly helper to get labels
 */
export function useLabels(language?: SupportedLanguage | string | null): UILabels {
    return getLabels(language);
}

export default translations;
