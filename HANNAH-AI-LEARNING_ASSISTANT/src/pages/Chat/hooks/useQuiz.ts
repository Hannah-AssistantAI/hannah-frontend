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

    const loadQuiz = async (quizId: string) => {
        try {
            const response = await studioService.getQuizContent(quizId);
            const quizData = response.data.data || response.data;
            setQuizContent(quizData);
            setSelectedQuizId(quizId);
            
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
                    
                    // Convert attempt detail to quiz results format
                    // Use percentage from API or calculate from score/maxScore
                    const percentage = attemptDetail.percentage ?? 
                        (attemptDetail.maxScore > 0 ? (attemptDetail.score / attemptDetail.maxScore) * 100 : 0);
                    
                    const results = {
                        score: percentage,  // QuizResults expects score as percentage
                        correctAnswers: attemptDetail.questions?.filter(q => q.isCorrect).length || 0,
                        totalQuestions: attemptDetail.totalQuestions,
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

    const nextQuestion = () => {
        if (currentQuestionIndex < (quizContent?.questions?.length || 0) - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const previousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
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

            const results = response.data.data || response.data;
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
    };

    return {
        selectedQuizId,
        quizContent,
        currentQuestionIndex,
        selectedAnswers,
        showQuizResults,
        quizResults,
        isSubmittingQuiz,
        loadQuiz,
        selectAnswer,
        nextQuestion,
        previousQuestion,
        submitQuiz,
        retryQuiz
    };
}
