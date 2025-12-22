import { useState } from 'react';
import { studioService } from '../../../service/studioService';
import type { MyQuizAttemptsResponse } from '../../../service/studioService';

export function useQuiz() {
    const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
    const [quizContent, setQuizContent] = useState<any>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
    const [showQuizResults, setShowQuizResults] = useState(false);
    const [quizResults, setQuizResults] = useState<any>(null);
    const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
    const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
    const [currentHint, setCurrentHint] = useState<string | null>(null);
    const [isLoadingHint, setIsLoadingHint] = useState(false);

    // 🆕 Attempt History State
    const [showAttemptHistory, setShowAttemptHistory] = useState(false);
    const [attemptHistory, setAttemptHistory] = useState<MyQuizAttemptsResponse | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Returns true if quiz modal should be shown, false if history modal is shown instead
    const loadQuiz = async (quizId: string): Promise<boolean> => {
        console.log('🔄 loadQuiz called with quizId:', quizId);
        try {
            const response = await studioService.getQuizContent(quizId);
            const quizData = response.data.data || response.data;
            setQuizContent(quizData);
            setSelectedQuizId(quizId);
            setCurrentHint(null); // Clear any previous hint

            // Check if user has already completed this quiz - show history modal
            try {
                const history = await studioService.getMyQuizAttempts(Number(quizId));
                console.log('📋 My quiz attempts:', history);

                // If user has any completed attempts, show history modal
                const hasCompletedAttempts = history.attempts.some(a => a.is_completed);

                if (hasCompletedAttempts) {
                    console.log('✅ User has completed attempts, showing history modal');
                    setAttemptHistory(history);
                    setShowAttemptHistory(true);
                    setShowQuizResults(false);
                    setQuizResults(null);
                    return false;  // Don't show quiz modal, show history instead
                }
            } catch (attemptError) {
                console.log('No existing attempt found or error checking:', attemptError);
            }

            // No completed attempt found - start fresh quiz
            setCurrentQuestionIndex(0);
            setSelectedAnswers({});
            setShowQuizResults(false);
            setQuizResults(null);
            setQuizStartTime(new Date());
            return true;  // Show quiz modal for fresh attempt
        } catch (error) {
            console.error('Failed to load quiz:', error);
            return false;
        }
    };

    const selectAnswer = (questionIndex: number, answer: string) => {
        setSelectedAnswers(prev => ({ ...prev, [questionIndex]: answer }));
    };

    const submitQuiz = async () => {
        if (!selectedQuizId || !quizContent) return;

        setIsSubmittingQuiz(true);
        try {
            const answersArray = quizContent.questions.map((q: any, idx: number) => ({
                questionId: q.questionId,
                // Use empty string for skipped questions instead of defaulting to 'A'
                selectedAnswer: selectedAnswers[idx] || '',
                timeSpentSeconds: null
            }));

            console.log('Submitting quiz:', { quizId: selectedQuizId, answers: answersArray });

            const response = await studioService.submitQuiz(selectedQuizId, answersArray);
            console.log('Quiz submission response:', response);

            const apiResults = response.data.data || response.data;
            console.log('📊 API results:', apiResults);

            // Ensure score is properly set as percentage
            // Backend returns score as percentage already
            const correctCount = apiResults.correctAnswers || apiResults.answers?.filter((a: any) => a.isCorrect).length || 0;
            const totalCount = apiResults.totalQuestions || apiResults.answers?.length || 1;
            let scorePercentage = apiResults.score;

            // If score looks like it's not a percentage (e.g., 0 when there are correct answers), recalculate
            if ((scorePercentage === 0 || scorePercentage === undefined) && correctCount > 0 && totalCount > 0) {
                scorePercentage = (correctCount / totalCount) * 100;
                console.log('📊 Recalculated score:', scorePercentage);
            }

            const results = {
                ...apiResults,
                score: scorePercentage,
                correctAnswers: correctCount,
                totalQuestions: totalCount
            };

            console.log('📊 Final quiz results:', results);
            setQuizResults(results);
            setShowQuizResults(true);
        } catch (error: any) {
            console.error('Failed to submit quiz:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            alert(`Không thể nộp bài. Vui lòng thử lại!\nLỗi: ${error.response?.data?.detail || error.message}`);
        } finally {
            setIsSubmittingQuiz(false);
        }
    };

    const retryQuiz = () => {
        setShowQuizResults(false);
        setQuizResults(null);
        setSelectedAnswers({});
        setCurrentQuestionIndex(0);
        setQuizStartTime(new Date());
        setCurrentHint(null);
    };

    const getHint = async () => {
        if (!selectedQuizId || !quizContent) return;

        const currentQuestion = quizContent.questions?.[currentQuestionIndex];
        if (!currentQuestion) return;

        setIsLoadingHint(true);
        try {
            const hintData = await studioService.getQuestionHint(selectedQuizId, currentQuestion.questionId);
            setCurrentHint(hintData.hint);
        } catch (error) {
            console.error('Failed to get hint:', error);
            setCurrentHint('Không thể tải gợi ý. Vui lòng thử lại.');
        } finally {
            setIsLoadingHint(false);
        }
    };

    const clearHint = () => {
        setCurrentHint(null);
    };

    // Clear hint when moving to a different question
    const nextQuestion = () => {
        if (currentQuestionIndex < (quizContent?.questions?.length || 0) - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setCurrentHint(null);
        }
    };

    const previousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            setCurrentHint(null);
        }
    };

    // 🆕 Load attempt history for current quiz
    const loadAttemptHistory = async () => {
        if (!selectedQuizId) return;

        setIsLoadingHistory(true);
        try {
            const history = await studioService.getMyQuizAttempts(Number(selectedQuizId));
            setAttemptHistory(history);
            setShowAttemptHistory(true);
            console.log('📋 Loaded attempt history:', history);
        } catch (error) {
            console.error('Failed to load attempt history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // 🆕 View specific attempt details
    const viewAttemptDetail = async (attemptId: number) => {
        if (!selectedQuizId) return;

        try {
            const { default: quizApiService } = await import('../../../service/quizApi');
            const attemptDetail = await quizApiService.getQuizAttemptDetail(
                Number(selectedQuizId),
                attemptId
            );

            // Convert to quiz results format
            const correctCount = attemptDetail.questions?.filter((q: any) => q.isCorrect).length || 0;
            const totalCount = attemptDetail.totalQuestions || attemptDetail.questions?.length || 1;
            // Calculate percentage from correctCount/totalCount for accuracy
            const percentage = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

            const results = {
                score: percentage,
                correctAnswers: correctCount,
                totalQuestions: totalCount,
                answers: attemptDetail.questions?.map((q: any) => ({
                    questionId: q.questionId,
                    questionText: q.content,
                    options: q.options,
                    selectedAnswer: q.selectedOptionIndex >= 0 ? String.fromCharCode(65 + q.selectedOptionIndex) : '',
                    correctAnswer: String.fromCharCode(65 + q.correctOptionIndex),
                    isCorrect: q.isCorrect,
                    explanation: q.explanation || ''
                })) || [],
                attemptId: attemptDetail.attemptId
            };

            setQuizResults(results);
            setShowAttemptHistory(false);
            setShowQuizResults(true);
        } catch (error) {
            console.error('Failed to load attempt detail:', error);
        }
    };

    // 🆕 Close history view
    const closeHistory = () => {
        setShowAttemptHistory(false);
    };

    return {
        selectedQuizId,
        quizContent,
        currentQuestionIndex,
        selectedAnswers,
        showQuizResults,
        quizResults,
        isSubmittingQuiz,
        currentHint,
        isLoadingHint,
        // 🆕 History exports
        showAttemptHistory,
        attemptHistory,
        isLoadingHistory,
        loadQuiz,
        selectAnswer,
        nextQuestion,
        previousQuestion,
        submitQuiz,
        retryQuiz,
        getHint,
        clearHint,
        // 🆕 History functions
        loadAttemptHistory,
        viewAttemptDetail,
        closeHistory
    };
}
