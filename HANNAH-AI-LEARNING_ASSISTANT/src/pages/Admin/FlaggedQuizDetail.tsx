import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, X, UserCheck } from 'lucide-react';
import AdminPageWrapper from './components/AdminPageWrapper';
import flaggingService, { type FlaggedItem } from '../../service/flaggingService';
import userService, { type User as UserType } from '../../service/userService';
import { STORAGE_KEYS } from '../../config/apiConfig';
import authService from '../../service/authService';

interface QuizQuestion {
  questionId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  studentAnswer?: number; // Student's selected answer index
}

interface QuizMetadata {
  quizId: string;
  title?: string;
  questions?: QuizQuestion[];
  topic?: string;
}

interface FlaggedQuizDetailProps {
  initialFlagData?: FlaggedItem | null;
}

export default function FlaggedQuizDetail({ initialFlagData }: FlaggedQuizDetailProps = {}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [flagData, setFlagData] = useState<FlaggedItem | null>(initialFlagData || null);
  const [quizMetadata, setQuizMetadata] = useState<QuizMetadata | null>(null);
  const [loading, setLoading] = useState(!initialFlagData);

  const [error, setError] = useState<string | null>(null);

  // Inline assignment states (like FlaggedMessageDetail)
  const [showAssignSection, setShowAssignSection] = useState(false);
  const [facultyList, setFacultyList] = useState<UserType[]>([]);
  const [facultySearch, setFacultySearch] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Resolve form state (for faculty)
  const [resolutionNote, setResolutionNote] = useState('');
  const [studentNotification, setStudentNotification] = useState('Your flag quiz has been resolved.');
  const [resolving, setResolving] = useState(false);

  // Get user role
  const userData = authService.getUserData();
  const userRole = userData?.role;
  const isAdmin = userRole === 'admin';
  const isFaculty = userRole === 'faculty';

  // Load faculty list
  const loadFacultyList = async () => {
    try {
      const faculty = await userService.getFacultyList();
      setFacultyList(faculty);
    } catch (err) {
      console.error('[ERROR] Failed to load faculty:', err);
      setAssignError(err instanceof Error ? err.message : 'Failed to load faculty');
    }
  };

  // Handle assign button click
  const handleAssignClick = () => {
    setShowAssignSection(true);
    setFacultySearch('');
    loadFacultyList();
  };

  // Cancel assign
  const handleCancelAssign = () => {
    setShowAssignSection(false);
    setSelectedFacultyId(null);
    setFacultySearch('');
    setAssignError(null);
  };

  // Confirm assign
  const handleConfirmAssign = async () => {
    if (!selectedFacultyId || !flagData) {
      setAssignError('Please select a faculty member');
      return;
    }

    try {
      setAssignLoading(true);
      setAssignError(null);

      await flaggingService.assignToFaculty(flagData.id, selectedFacultyId);

      // Reload flag data
      const allFlags = await flaggingService.getFlaggedQuizzes();
      const updated = allFlags.find((f: FlaggedItem) => f.id === flagData.id);
      if (updated) setFlagData(updated);

      setShowAssignSection(false);
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Assignment failed');
    } finally {
      setAssignLoading(false);
    }
  };

  // Filter faculty list
  const filteredFacultyList = facultyList.filter(faculty =>
    faculty.fullName.toLowerCase().includes(facultySearch.toLowerCase()) ||
    faculty.email.toLowerCase().includes(facultySearch.toLowerCase())
  );


  useEffect(() => {
    const load = async () => {
      if (!id) return;

      let currentFlag: FlaggedItem | null = initialFlagData || null;

      // If we don't have initial data or it doesn't match ID, fetch it
      if (!currentFlag || currentFlag.id !== parseInt(id)) {
        if (!flagData) {
          setLoading(true);
          try {
            // If faculty, try getAssignedFlags first, otherwise getFlaggedQuizzes
            let allFlags: FlaggedItem[] = [];
            if (isFaculty) {
              try {
                allFlags = await flaggingService.getAssignedFlags();
              } catch (e) {
                console.warn('Failed to fetch assigned flags, trying all flags', e);
              }
            }

            if (allFlags.length === 0) {
              allFlags = await flaggingService.getFlaggedQuizzes();
            }

            const foundFlag = allFlags.find((f: FlaggedItem) => f.id === parseInt(id));
            if (foundFlag) {
              currentFlag = foundFlag;
              setFlagData(foundFlag);
            } else {
              setError('Flag not found');
              setLoading(false);
              return;
            }
          } catch (err) {
            console.error('Error loading flag details:', err);
            setError('Failed to load flag details');
            setLoading(false);
            return;
          }
        } else {
          currentFlag = flagData;
        }
      }

      if (currentFlag) {
        console.log('🐛 DEBUG: currentFlag.metadata =', currentFlag.metadata);
        console.log('🐛 DEBUG: Full metadata JSON:', JSON.stringify(currentFlag.metadata, null, 2));

        // Fetch quiz data from Python API
        const quizId = currentFlag.metadata?.quizId || currentFlag.contentId;
        if (quizId) {
          try {
            const PYTHON_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
            const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

            const quizResponse = await fetch(
              `${PYTHON_API_BASE_URL}/api/v1/studio/quiz/${quizId}/content?include_answers=true`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (quizResponse.ok) {
              const responseData = await quizResponse.json();
              console.log('Fetched quiz API response:', responseData);

              const quizData = responseData.data || responseData;

              const metadata: QuizMetadata = {
                quizId: quizId.toString(),
                title: quizData.title || quizData.topic,
                topic: quizData.topic,
                questions: quizData.questions?.map((q: any) => {
                  // Convert correct_answer from letter (A, B, C, D) to index (0, 1, 2, 3)
                  let correctIndex: number = -1;

                  const answerValue = q.correctAnswer || q.correct_answer;
                  if (answerValue) {
                    if (typeof answerValue === 'string') {
                      const upperAnswer = answerValue.trim().toUpperCase();
                      // Check if it's a letter (A, B, C, D, etc.)
                      if (upperAnswer.length === 1 && upperAnswer >= 'A' && upperAnswer <= 'Z') {
                        correctIndex = upperAnswer.charCodeAt(0) - 'A'.charCodeAt(0);
                      } else {
                        // Try parsing as number
                        const parsed = parseInt(answerValue);
                        if (!isNaN(parsed)) correctIndex = parsed;
                      }
                    } else if (typeof answerValue === 'number') {
                      correctIndex = answerValue;
                    }
                  }

                  return {
                    questionId: q.questionId || q.question_id,
                    question: q.questionText || q.question_text || q.question,
                    options: q.options,
                    correctAnswer: correctIndex,
                    explanation: q.explanation,
                    studentAnswer: undefined // Will be populated from flag metadata if available
                  };
                })
              };

              console.log('Parsed quiz metadata (before attempt):', metadata);

              // Fetch attempt data if attemptId exists in flag metadata
              if (currentFlag.metadata?.attemptId) {
                console.log('🎯 Found attemptId in metadata:', currentFlag.metadata.attemptId);
                try {
                  const quizApiService = (await import('../../service/quizApi')).default;
                  const attemptData = await quizApiService.getQuizAttemptDetail(
                    quizId,
                    currentFlag.metadata.attemptId
                  );
                  console.log('✅ Fetched attempt data:', attemptData);
                  console.log('📋 Attempt questions:', attemptData.questions);

                  // Map attempt data to quiz questions
                  metadata.questions = metadata.questions?.map((q, index) => {
                    // Try to match by questionId first
                    let attemptQuestion = attemptData.questions.find(
                      (aq: any) => String(aq.questionId) === String(q.questionId)
                    );

                    // Fallback: match by index if questionId doesn't match
                    if (!attemptQuestion && attemptData.questions[index]) {
                      console.log(`⚠️ Fallback to index ${index} for question: ${q.questionId}`);
                      attemptQuestion = attemptData.questions[index];
                    }

                    if (attemptQuestion) {
                      console.log(`✅ Q${index + 1}: matched, studentAnswer = ${attemptQuestion.selectedOptionIndex}`);
                      return {
                        ...q,
                        studentAnswer: attemptQuestion.selectedOptionIndex
                      };
                    }
                    console.log(`❌ Q${index + 1}: no match found`);
                    return q;
                  });
                  console.log('📊 Final merged questions:', metadata.questions);
                } catch (attemptErr) {
                  console.error('❌ Error fetching attempt data:', attemptErr);
                }
              } else {
                // No attemptId in metadata - try to find student's latest attempt
                console.log('⚠️ No attemptId in metadata. Trying to find student attempt...');
                console.log('📊 Flag details:', {
                  flaggedById: currentFlag.metadata?.flaggedById,
                  flaggedByUserId: (currentFlag as any).flaggedByUserId || (currentFlag as any).flaggedById,
                  flaggedByName: currentFlag.flaggedByName
                });

                try {
                  const quizApiService = (await import('../../service/quizApi')).default;
                  // Get all attempts for this quiz from Python API (where they are stored)
                  const attempts = await quizApiService.getQuizAttemptsFromPython(quizId);
                  console.log('📋 All quiz attempts:', attempts);
                  console.log('📋 Attempts type:', typeof attempts, 'isArray:', Array.isArray(attempts), 'length:', attempts?.length);

                  if (attempts && Array.isArray(attempts) && attempts.length > 0) {
                    // Try to find attempt by the student who flagged (if we have userId)
                    const flaggedByUserId = currentFlag.metadata?.flaggedById
                      || (currentFlag as any).flaggedByUserId
                      || (currentFlag as any).flaggedById;

                    let studentAttempt = flaggedByUserId
                      ? attempts.find((a: any) => a.userId === flaggedByUserId)
                      : null;

                    // If not found by userId, use the latest attempt
                    if (!studentAttempt) {
                      studentAttempt = attempts[0]; // Already sorted by latest first
                      console.log('⚠️ Using latest attempt as fallback');
                    }

                    if (studentAttempt) {
                      console.log('🎯 Found student attempt:', studentAttempt);

                      // Fetch full attempt detail
                      const attemptData = await quizApiService.getQuizAttemptDetail(
                        quizId,
                        studentAttempt.attemptId
                      );
                      console.log('✅ Fetched attempt detail:', attemptData);
                      console.log('🔍 attemptData.questions sample:', JSON.stringify(attemptData.questions?.[0], null, 2));
                      console.log('🔍 attemptData.questions length:', attemptData.questions?.length);

                      // Map attempt data to quiz questions - use INDEX BASED matching since questionIds may not match
                      metadata.questions = metadata.questions?.map((q, index) => {
                        // Use index-based matching as primary method (most reliable)
                        const attemptQuestion = attemptData.questions?.[index];

                        if (attemptQuestion) {
                          // Try multiple possible property names for selectedOptionIndex
                          const aq = attemptQuestion as any;
                          const selectedIdx = aq.selectedOptionIndex ??
                            aq.SelectedOptionIndex ??
                            aq.selected_option_index;

                          console.log(`🎯 Q${index}: selectedIdx=${selectedIdx}, attemptQuestion keys=`, Object.keys(attemptQuestion));

                          return {
                            ...q,
                            studentAnswer: selectedIdx
                          };
                        }
                        console.log(`⚠️ Q${index}: No attemptQuestion found`);
                        return q;
                      });
                      console.log('📊 Final merged questions:', metadata.questions?.map(q => ({
                        questionId: q.questionId,
                        studentAnswer: q.studentAnswer,
                        correctAnswer: q.correctAnswer
                      })));
                    }
                  }
                } catch (attemptErr) {
                  console.error('❌ Error finding student attempt:', attemptErr);
                }
              }

              setQuizMetadata(metadata);
            } else {
              const errorText = await quizResponse.text();
              console.error('Failed to fetch quiz data:', quizResponse.status, errorText);
              console.warn(`Quiz ${quizId} may not exist in MongoDB or there's a Python API error`);
              setQuizMetadata({
                quizId: quizId.toString(),
                title: `Quiz #${quizId} (details unavailable)`,
                questions: []
              });
            }
          } catch (quizErr) {
            console.error('Error fetching quiz data:', quizErr);
            console.warn(`Unable to load quiz ${quizId} from Python API`);
            setQuizMetadata({
              quizId: quizId.toString(),
              title: `Quiz #${quizId} (details unavailable)`,
              questions: []
            });
          }
        } else {
          setQuizMetadata(currentFlag.metadata as QuizMetadata || null);
        }
      }
      setLoading(false);
    };
    load();
  }, [id, initialFlagData]);

  const handleResolve = async () => {
    if (!id || !flagData) return;

    if (!resolutionNote.trim()) {
      setError('Please provide a resolution note');
      return;
    }

    setResolving(true);
    setError(null);

    try {
      const resolution: any = {
        knowledgeGapFix: resolutionNote.trim(),
        studentNotification: studentNotification.trim() || 'Your flag quiz has been resolved.'
      };
      await flaggingService.resolveFlag(flagData.id, resolution);
      // Navigate back to faculty assigned flags list
      navigate('/faculty/assigned-flags/quizzes');
    } catch (err) {
      console.error('Failed to resolve flag:', err);
      setError('Failed to resolve flag. Please try again.');
    } finally {
      setResolving(false);
    }
  };

  return (
    <AdminPageWrapper title="Flagged Quiz Detail">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header Section */}
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to List
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Flagged Quiz Detail
                </h1>
                {quizMetadata?.title && (
                  <p className="text-gray-600 mt-1">{quizMetadata.title}</p>
                )}
              </div>
              {flagData && (
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold shadow-md transition-transform hover:scale-105 ${flagData.status?.toLowerCase() === 'pending'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                  : flagData.status?.toLowerCase() === 'assigned'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                  }`}>
                  {flagData.status?.toLowerCase() === 'pending' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {flagData.status?.toLowerCase() === 'assigned' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                  {flagData.status?.toLowerCase() === 'resolved' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {flagData.status?.toLowerCase() === 'pending' ? 'Pending Review' :
                    flagData.status?.toLowerCase() === 'assigned' ? 'Assigned' : 'Resolved'}
                </span>
              )}
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-500">Loading details...</p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          )}

          {!loading && flagData && (
            <div className="space-y-6">
              {/* Info Cards Grid */}
              <div className="grid lg:grid-cols-2 gap-5">
                {/* Flag Overview Card */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-3">
                    <h2 className="text-white font-bold flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Flag Overview
                    </h2>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Flag ID</span>
                        <p className="font-bold text-gray-900 mt-1">#{flagData.id}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Quiz ID</span>
                        <p className="font-bold text-gray-900 mt-1">#{quizMetadata?.quizId || flagData.contentId || '-'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Status</span>
                        <p className="font-bold text-gray-900 mt-1 capitalize">{flagData.status}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Priority</span>
                        <p className={`font-bold mt-1 capitalize ${flagData.priority?.toLowerCase() === 'high' ? 'text-red-600' :
                          flagData.priority?.toLowerCase() === 'medium' ? 'text-yellow-600' : 'text-gray-900'
                          }`}>{flagData.priority || 'Normal'}</p>
                      </div>
                      <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Flagged At</span>
                        <p className="font-medium text-gray-900 mt-1">{new Date(flagData.flaggedAt).toLocaleString('vi-VN')}</p>
                      </div>
                      <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Flagged By
                        </span>
                        <p className="font-medium text-gray-900 mt-1">{flagData.flaggedByName || '-'}</p>
                      </div>
                      {flagData.assignedToName && (
                        <div className="col-span-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <span className="text-blue-600 text-xs font-medium uppercase tracking-wide flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Assigned To
                          </span>
                          <p className="font-bold text-blue-800 mt-1">{flagData.assignedToName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Flag Information Card */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-5 py-3">
                    <h2 className="text-white font-bold flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Flag Information
                    </h2>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Report Reason</span>
                      <div className="mt-2 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 border border-red-100">
                        <p className="text-gray-800 leading-relaxed">{flagData.reason || 'No reason provided'}</p>
                      </div>
                    </div>
                    {quizMetadata?.title && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Quiz Title</span>
                        <p className="font-medium text-gray-900 mt-1">{quizMetadata.title}</p>
                      </div>
                    )}
                    {quizMetadata?.topic && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Topic</span>
                        <p className="font-medium text-gray-900 mt-1">{quizMetadata.topic}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content: 2-column layout - Questions left, Actions right */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column - Quiz Questions (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                  {quizMetadata?.questions && quizMetadata.questions.length > 0 && (() => {
                    const questions = quizMetadata.questions!;
                    const hasStudentAnswers = questions.some(q => q.studentAnswer !== undefined && q.studentAnswer !== null);
                    const correctCount = questions.filter(q =>
                      q.studentAnswer !== undefined && q.studentAnswer !== null && q.studentAnswer === q.correctAnswer
                    ).length;
                    const scorePercent = Math.round((correctCount / questions.length) * 100);

                    return (
                      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-4 flex items-center justify-between">
                          <h2 className="text-white font-bold flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Quiz Questions ({questions.length})
                          </h2>
                          {hasStudentAnswers ? (
                            <div className="flex items-center gap-3">
                              <span className="text-white/80 text-sm font-medium">Score:</span>
                              <div className={`px-4 py-1.5 rounded-full font-bold text-sm shadow-inner ${scorePercent >= 70 ? 'bg-white text-emerald-600' :
                                scorePercent >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                {correctCount}/{questions.length} ({scorePercent}%)
                              </div>
                            </div>
                          ) : (
                            <span className="text-white/70 text-xs bg-white/20 px-3 py-1 rounded-full">
                              No answer data
                            </span>
                          )}
                        </div>

                        <div className="p-5 space-y-4">
                          {questions.map((q: QuizQuestion, qi: number) => {
                            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
                            // -1 or undefined/null means skipped
                            const wasSkipped = q.studentAnswer === undefined || q.studentAnswer === null || q.studentAnswer === -1;
                            const hasStudentAnswer = !wasSkipped && typeof q.studentAnswer === 'number' && q.studentAnswer >= 0;
                            const isStudentCorrect = hasStudentAnswer && q.studentAnswer === q.correctAnswer;

                            return (
                              <div key={qi} className="rounded-xl border-2 border-gray-100 overflow-hidden hover:border-gray-200 transition-colors">
                                <div className={`px-5 py-3 flex items-start gap-3 ${hasStudentAnswer
                                  ? isStudentCorrect
                                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200'
                                    : 'bg-gradient-to-r from-red-50 to-orange-50 border-b-2 border-red-200'
                                  : 'bg-gradient-to-r from-gray-50 to-slate-50 border-b-2 border-gray-200'
                                  }`}>
                                  <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${hasStudentAnswer
                                    ? isStudentCorrect
                                      ? 'bg-green-500 text-white'
                                      : 'bg-red-500 text-white'
                                    : 'bg-gray-200 text-gray-700'
                                    }`}>
                                    {qi + 1}
                                  </span>
                                  <p className="font-medium text-gray-900 flex-1 pt-1">{q.question}</p>
                                </div>

                                <ul className="p-4 space-y-2">
                                  {q.options.map((opt: string, oi: number) => {
                                    const isCorrect = oi === q.correctAnswer;
                                    const isStudentAnswer = q.studentAnswer !== undefined && q.studentAnswer !== null && oi === q.studentAnswer;
                                    const isStudentCorrect = isStudentAnswer && isCorrect;
                                    const isStudentWrong = isStudentAnswer && !isCorrect;

                                    return (
                                      <li
                                        key={oi}
                                        className={`rounded-lg border-2 px-4 py-3 flex items-center gap-3 transition-all ${isStudentCorrect
                                          ? 'border-green-400 bg-green-50 shadow-sm'
                                          : isStudentWrong
                                            ? 'border-red-400 bg-red-50 shadow-sm'
                                            : isCorrect
                                              ? 'border-green-300 bg-green-50/50'
                                              : 'border-gray-200 bg-white hover:bg-gray-50'
                                          }`}
                                      >
                                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isStudentCorrect ? 'bg-green-500 text-white' :
                                          isStudentWrong ? 'bg-red-500 text-white' :
                                            isCorrect ? 'bg-green-200 text-green-700' :
                                              'bg-gray-100 text-gray-600'
                                          }`}>
                                          {letters[oi]}
                                        </span>
                                        <span className="flex-1 text-gray-800">{opt}</span>
                                        <div className="flex items-center gap-2">
                                          {isStudentWrong && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
                                              ✗ Wrong
                                            </span>
                                          )}
                                          {isStudentCorrect && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
                                              ✓ Correct
                                            </span>
                                          )}
                                          {isCorrect && !isStudentAnswer && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-300">
                                              ✓ Answer
                                            </span>
                                          )}
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>

                                {q.explanation && (
                                  <div className="px-5 pb-4">
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                      <div className="flex items-start gap-2">
                                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                          <span className="text-blue-700 font-semibold text-sm">Explanation</span>
                                          <p className="text-gray-700 mt-1 text-sm">{q.explanation}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {(!quizMetadata?.questions || quizMetadata.questions.length === 0) && (
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-md border border-gray-100 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">No Quiz Data</h3>
                      <p className="text-gray-500 text-sm">The quiz may have been deleted or there was an error loading the data.</p>
                    </div>
                  )}
                </div>

                {/* Right Column - Actions Sidebar (1/3 width) */}
                <div className="lg:col-span-1">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-100 overflow-hidden lg:sticky lg:top-6">
                    <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-5 py-3">
                      <h2 className="text-white font-bold flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Actions
                      </h2>
                    </div>
                    <div className="p-5">
                      {flagData.status?.toLowerCase() === 'resolved' && (
                        <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-4 border border-green-200">
                          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="font-semibold text-sm">Resolved</span>
                        </div>
                      )}

                      {flagData.status?.toLowerCase() !== 'resolved' && (
                        <div className="space-y-4">
                          {isAdmin && !showAssignSection && (
                            <button
                              onClick={handleAssignClick}
                              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                            >
                              <UserCheck className="w-4 h-4" />
                              {flagData.assignedToName ? 'Re-assign Faculty' : 'Assign Faculty'}
                            </button>
                          )}

                          {/* Inline Assignment Section */}
                          {isAdmin && showAssignSection && (
                            <div className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-blue-50 border-2 border-blue-300/60 rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                                  <UserCheck className="w-4 h-4 text-white" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-900">Assign to Faculty</h3>
                              </div>

                              {assignError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 flex items-center gap-2 text-red-700 text-xs">
                                  <X className="w-4 h-4" />
                                  <span>{assignError}</span>
                                </div>
                              )}

                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">Search:</label>
                                  <input
                                    type="text"
                                    value={facultySearch}
                                    onChange={(e) => setFacultySearch(e.target.value)}
                                    placeholder="Enter name or email..."
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400"
                                    disabled={assignLoading}
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-gray-700 mb-1">Select Faculty:</label>
                                  <select
                                    value={selectedFacultyId || ''}
                                    onChange={(e) => setSelectedFacultyId(Number(e.target.value))}
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                                    disabled={assignLoading}
                                    size={4}
                                  >
                                    <option value="" className="text-gray-500">-- Select --</option>
                                    {filteredFacultyList.map((faculty) => (
                                      <option key={faculty.userId} value={faculty.userId} className="text-gray-900 py-1">
                                        {faculty.fullName} ({faculty.email})
                                      </option>
                                    ))}
                                  </select>
                                  {filteredFacultyList.length === 0 && facultySearch && (
                                    <small className="text-gray-600 mt-1 block text-xs">No faculty found</small>
                                  )}
                                </div>

                                <div className="flex gap-2 pt-1">
                                  <button
                                    onClick={handleConfirmAssign}
                                    disabled={assignLoading || !selectedFacultyId}
                                    className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-all font-semibold flex items-center justify-center gap-1 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    {assignLoading ? 'Assigning...' : 'Confirm'}
                                  </button>
                                  <button
                                    onClick={handleCancelAssign}
                                    disabled={assignLoading}
                                    className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 rounded-lg transition-all font-semibold flex items-center gap-1 disabled:opacity-50 text-xs"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {isFaculty && (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Resolution Note *</label>
                                <textarea
                                  value={resolutionNote}
                                  onChange={e => setResolutionNote(e.target.value)}
                                  placeholder="How did you resolve this issue?"
                                  className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm min-h-[100px] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all resize-none"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Notify Student</label>
                                <input
                                  type="text"
                                  value={studentNotification}
                                  onChange={e => setStudentNotification(e.target.value)}
                                  placeholder="Message to student..."
                                  className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                                />
                              </div>
                              <button
                                onClick={handleResolve}
                                disabled={resolving || !resolutionNote.trim()}
                                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                              >
                                {resolving ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Resolving...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Resolve Flag
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </AdminPageWrapper>
  );
}
