import { studioService } from '../../service/studioService';

/**
 * Quiz submission handler
 */
export const handleSubmitQuiz = async (
    selectedQuizId: string | null,
    quizContent: any,
    selectedAnswers: { [key: number]: string },
    setIsSubmittingQuiz: (value: boolean) => void,
    setQuizResults: (value: any) => void,
    setShowQuizResults: (value: boolean) => void
) => {
    if (!selectedQuizId || !quizContent) return;

    setIsSubmittingQuiz(true);
    try {
        // Transform selectedAnswers to API format
        const answersArray = quizContent.questions.map((q: any, idx: number) => ({
            questionId: q.questionId,
            selectedAnswer: selectedAnswers[idx] || 'A',
            timeSpentSeconds: null
        }));

        console.log('Submitting quiz:', { quizId: selectedQuizId, answers: answersArray });

        const response = await studioService.submitQuiz(selectedQuizId, answersArray);
        console.log('Quiz submission response:', response);

        if (response.data) {
            setQuizResults(response.data.data || response.data);
            setShowQuizResults(true);
        }
    } catch (error) {
        console.error('Failed to submit quiz:', error);
        alert('Không thể nộp bài. Vui lòng thử lại!');
    } finally {
        setIsSubmittingQuiz(false);
    }
};

/**
 * Quiz retry handler
 */
export const handleRetryQuiz = (
    setShowQuizResults: (value: boolean) => void,
    setQuizResults: (value: any) => void,
    setSelectedAnswers: (value: { [key: number]: string }) => void,
    setCurrentQuestionIndex: (value: number) => void,
    setQuizStartTime: (value: Date) => void
) => {
    setShowQuizResults(false);
    setQuizResults(null);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setQuizStartTime(new Date());
};
