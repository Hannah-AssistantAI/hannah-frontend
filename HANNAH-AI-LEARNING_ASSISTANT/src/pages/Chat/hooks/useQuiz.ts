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
