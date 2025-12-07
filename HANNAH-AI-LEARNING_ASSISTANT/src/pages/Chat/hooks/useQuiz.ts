import { useState } from 'react';
import { studioService } from '../../../service/studioService';

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

    const loadQuiz = async (quizId: string) => {
        console.log('🔄 loadQuiz called with quizId:', quizId);
        try {
            const response = await studioService.getQuizContent(quizId);
            const quizData = response.data.data || response.data;
            setQuizContent(quizData);
            setSelectedQuizId(quizId);
            setCurrentHint(null); // Clear any previous hint

            // Check if user has already completed this quiz
            try {
                const { default: quizApiService } = await import('../../../service/quizApi');
                const attempts = await quizApiService.getQuizAttempts(Number(quizId));
                console.log('📋 All quiz attempts:', attempts);

                // Get current user ID from localStorage (stored as 'user_data')
                const userData = localStorage.getItem('user_data');
                const currentUserId = userData ? JSON.parse(userData).userId : null;
                console.log('👤 Current user ID:', currentUserId);

                // Find user's completed attempt
                const userCompletedAttempt = attempts.find(
                    a => a.userId === currentUserId && a.isCompleted
                );
                console.log('🎯 User completed attempt:', userCompletedAttempt);

                if (userCompletedAttempt) {
                    // Load the completed attempt details and show results
                    console.log('✅ Found existing completed attempt:', userCompletedAttempt.attemptId);
                    const attemptDetail = await quizApiService.getQuizAttemptDetail(
                        Number(quizId),
                        userCompletedAttempt.attemptId
                    );

                    // DEBUG: Log the attemptDetail to understand the data structure
                    console.log('📊 Attempt Detail from API:', attemptDetail);
                    console.log('📊 Score:', attemptDetail.score, 'MaxScore:', attemptDetail.maxScore, 'Percentage:', attemptDetail.percentage);

                    // Convert attempt detail to quiz results format
                    // Calculate correctAnswers from questions data
                    const correctCount = attemptDetail.questions?.filter(q => q.isCorrect).length || 0;
                    const totalCount = attemptDetail.totalQuestions || attemptDetail.questions?.length || 1;
                    
                    // Use percentage from API, or score if already percentage, or calculate from correctAnswers/totalQuestions
                    let percentage = attemptDetail.percentage;
                    if (percentage === undefined || percentage === null) {
                        if (attemptDetail.score !== undefined && attemptDetail.score > 0) {
                            // score from backend is already percentage (e.g., 13.33)
                            percentage = attemptDetail.score;
                        } else if (attemptDetail.maxScore > 0) {
                            percentage = (attemptDetail.score / attemptDetail.maxScore) * 100;
                        } else if (totalCount > 0) {
                            // Ultimate fallback: calculate from correctCount/totalCount
                            percentage = (correctCount / totalCount) * 100;
                        } else {
                            percentage = 0;
                        }
                    }
                    
                    console.log('📊 Quiz score calculation:', { correctCount, totalCount, percentage, attemptDetail });
                    
                    const results = {
                        score: percentage,  // QuizResults expects score as percentage
                        correctAnswers: correctCount,
                        totalQuestions: totalCount,
                        answers: attemptDetail.questions?.map(q => ({
                            questionId: q.questionId,
                            questionText: q.content,  // Match QuizResults expected field
                            options: q.options,
                            selectedAnswer: String.fromCharCode(65 + q.selectedOptionIndex),
                            correctAnswer: String.fromCharCode(65 + q.correctOptionIndex),
                            isCorrect: q.isCorrect,
                            explanation: q.explanation || ''
                        })) || [],
                        timeTaken: attemptDetail.timeTaken,
                        attemptId: attemptDetail.attemptId
                    };

                    setQuizResults(results);
                    setShowQuizResults(true);
                    setCurrentQuestionIndex(0);
                    setSelectedAnswers({});
                    return;
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
        } catch (error) {
            console.error('Failed to load quiz:', error);
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
                selectedAnswer: selectedAnswers[idx] || 'A',
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
        loadQuiz,
        selectAnswer,
        nextQuestion,
        previousQuestion,
        submitQuiz,
        retryQuiz,
        getHint,
        clearHint
    };
}
