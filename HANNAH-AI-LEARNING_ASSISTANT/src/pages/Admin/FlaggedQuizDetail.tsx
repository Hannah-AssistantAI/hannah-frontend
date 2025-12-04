import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminPageWrapper from './components/AdminPageWrapper';
import flaggingService, { type FlaggedItem } from '../../service/flaggingService';
import { AssignFacultyModal } from './components/AssignFacultyModal';
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

  // Assignment modal state (for admin)
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedFlagId, setSelectedFlagId] = useState<number | null>(null);

  // Resolve form state (for faculty)
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolving, setResolving] = useState(false);

  // Get user role
  const userData = authService.getUserData();
  const userRole = userData?.role;
  const isAdmin = userRole === 'admin';
  const isFaculty = userRole === 'faculty';

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
            const PYTHON_API_BASE_URL = 'http://localhost:8001';
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

                  // Map attempt data to quiz questions
                  metadata.questions = metadata.questions?.map((q) => {
                    const attemptQuestion = attemptData.questions.find(
                      (aq: any) => String(aq.questionId) === String(q.questionId)
                    );
                    if (attemptQuestion) {
                      return {
                        ...q,
                        studentAnswer: attemptQuestion.selectedOptionIndex
                      };
                    }
                    return q;
                  });
                  console.log('📊 Merged student answers into questions');
                } catch (attemptErr) {
                  console.error('❌ Error fetching attempt data:', attemptErr);
                }
              } else {
                console.log('⚠️ No attemptId found in flag metadata');
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
        studentNotification: "Your flag has been resolved." // Default notification
      };
      await flaggingService.resolveFlag(flagData.id, resolution);
      // Navigate back to faculty assigned flags list
      navigate('/faculty/assigned-flags');
    } catch (err) {
      console.error('Failed to resolve flag:', err);
      setError('Failed to resolve flag. Please try again.');
    } finally {
      setResolving(false);
    }
  };

  return (
    <AdminPageWrapper title="Flagged Quiz Detail">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline">← Back</button>
          {flagData && (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${flagData.status?.toLowerCase() === 'pending' ? 'bg-amber-100 text-amber-800' :
              flagData.status?.toLowerCase() === 'assigned' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-700'
              }`}>
              {flagData.status?.toLowerCase() === 'pending' ? 'Pending Review' :
                flagData.status?.toLowerCase() === 'assigned' ? 'Processing' :
                  'Resolved'}
            </span>
          )}
        </div>

        {loading && <div className="text-slate-500">Loading...</div>}
        {!loading && error && (
          <div className="text-red-600">{error}</div>
        )}
        {!loading && flagData && (
          <div className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="border rounded-lg p-5 bg-white shadow-sm">
                <h2 className="text-lg font-semibold mb-2">Flag Overview</h2>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Flag ID:</span> {flagData.id}</div>
                  <div><span className="font-medium">Quiz ID:</span> {quizMetadata?.quizId || flagData.contentId || '-'}</div>
                  <div><span className="font-medium">Status:</span> {flagData.status}</div>
                  <div><span className="font-medium">Priority:</span> {flagData.priority || '-'}</div>
                  <div className="col-span-2"><span className="font-medium">Flagged At:</span> {new Date(flagData.flaggedAt).toLocaleString('vi-VN')}</div>
                  <div className="col-span-2"><span className="font-medium">Flagged By:</span> {flagData.flaggedByName || '-'}</div>
                  {flagData.assignedToName && (
                    <div className="col-span-2"><span className="font-medium">Assigned To:</span> {flagData.assignedToName}</div>
                  )}
                </div>
              </div>
              <div className="border rounded-lg p-5 bg-white shadow-sm">
                <h2 className="text-lg font-semibold mb-2">Flag Information</h2>
                <div className="text-sm space-y-1">
                  <div><span className="font-medium">Reason:</span> {flagData.reason || '-'}</div>
                  {quizMetadata?.title && (
                    <div><span className="font-medium">Quiz Title:</span> {quizMetadata.title}</div>
                  )}
                  {quizMetadata?.topic && (
                    <div><span className="font-medium">Topic:</span> {quizMetadata.topic}</div>
                  )}
                </div>
              </div>
            </div>

            {quizMetadata?.questions && quizMetadata.questions.length > 0 && (
              <div className="border rounded-lg p-5 bg-white shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Quiz Questions ({quizMetadata.questions.length})</h2>
                <div className="space-y-4">
                  {quizMetadata.questions.map((q: QuizQuestion, qi: number) => {
                    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
                    return (
                      <div key={qi} className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                        <div className="px-4 py-3 flex items-start justify-between border-b text-sm bg-slate-100 border-slate-200">
                          <div className="font-medium pr-4">Q{qi + 1}. {q.question}</div>
                        </div>
                        <ul className="p-4 space-y-2 text-sm">
                          {q.options.map((opt: string, oi: number) => {
                            const isCorrect = oi === q.correctAnswer;
                            const isStudentAnswer = q.studentAnswer !== undefined && oi === q.studentAnswer;
                            const isStudentCorrect = isStudentAnswer && isCorrect;
                            const isStudentWrong = isStudentAnswer && !isCorrect;

                            // Determine background color
                            let bgClass = 'border-slate-200 bg-slate-50';
                            if (isCorrect && !isStudentAnswer) {
                              bgClass = 'border-green-300 bg-green-50';
                            } else if (isStudentCorrect) {
                              bgClass = 'border-blue-300 bg-blue-50';
                            } else if (isStudentWrong) {
                              bgClass = 'border-blue-300 bg-blue-50';
                            }

                            return (
                              <li
                                key={oi}
                                className={`rounded-md border px-3 py-2 flex items-center gap-3 ${bgClass}`}
                              >
                                <span className="font-mono text-xs w-5 text-center text-slate-500">{letters[oi]}</span>
                                <span className="flex-1">{opt}</span>
                                <div className="flex gap-2">
                                  {isStudentAnswer && (
                                    <span className="text-blue-700 text-xs font-semibold">Selected</span>
                                  )}
                                  {isCorrect && (
                                    <span className="text-green-700 text-xs font-semibold">Correct answer</span>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                        {q.explanation && (
                          <div className="px-4 pb-4">
                            <div className="text-xs text-slate-600">
                              <span className="font-medium">Explanation:</span> {q.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(!quizMetadata?.questions || quizMetadata.questions.length === 0) && (
              <div className="border rounded-lg p-5 bg-white shadow-sm text-center text-slate-500">
                <p>No quiz question data available.</p>
                <p className="text-sm mt-2">The quiz may have been deleted from MongoDB or the Python API encountered an error.</p>
                <p className="text-sm">You can still process this flag based on the reporter's reason above.</p>
              </div>
            )}

            <div className="border rounded-lg p-5 bg-white shadow-sm lg:sticky lg:top-4">
              <h2 className="text-lg font-semibold mb-2">Actions</h2>
              {flagData.status?.toLowerCase() === 'resolved' && (
                <div className="text-sm mb-4 text-green-700">Already resolved.</div>
              )}

              {flagData.status?.toLowerCase() !== 'resolved' && (
                <div className="space-y-4">
                  {/* Admin: Show Assign/Re-assign button */}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setSelectedFlagId(flagData.id);
                        setAssignModalOpen(true);
                      }}
                      className="px-5 py-2 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-700 shadow-sm"
                    >
                      {flagData.assignedToName ? 'Re-assign to Faculty' : 'Assign to Faculty'}
                    </button>
                  )}

                  {/* Faculty: Show Resolve form for assigned/in_progress flags */}
                  {isFaculty && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Resolution Note</label>
                        <textarea
                          value={resolutionNote}
                          onChange={e => setResolutionNote(e.target.value)}
                          placeholder="Describe how you resolved this issue..."
                          className="w-full border rounded-md p-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={handleResolve}
                        disabled={resolving || !resolutionNote.trim()}
                        className="px-5 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {resolving ? 'Resolving...' : 'Resolve Flag'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Assignment Modal (Admin only) */}
      {isAdmin && selectedFlagId && (
        <AssignFacultyModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          onSuccess={() => {
            setAssignModalOpen(false);
            // Reload flag data after assignment
            if (id) {
              flaggingService.getFlaggedQuizzes().then(allFlags => {
                const updated = allFlags.find((f: FlaggedItem) => f.id === parseInt(id));
                if (updated) setFlagData(updated);
              });
            }
          }}
          flagId={selectedFlagId}
          currentAssignee={flagData?.assignedToName}
        />
      )}
    </AdminPageWrapper>
  );
}
