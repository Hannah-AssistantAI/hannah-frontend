import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, ChevronDown, Plus, X, Check, ChevronRight, Loader2 } from 'lucide-react';
import subjectService, { type Subject } from '../../../service/subjectService';
import suggestionService, { SuggestionContentType, SuggestionStatus, type Suggestion } from '../../../service/suggestionService';
import { toast } from 'react-hot-toast';

// Define types
interface Course {
  id: number;
  name: string;
  code: string;
  semester: string;
}

const ChallengesManagement: React.FC = () => {
  // URL params for state persistence
  const [searchParams, setSearchParams] = useSearchParams();
  const courseIdFromUrl = searchParams.get('courseId');
  const semesterFromUrl = searchParams.get('semester');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [challenges, setChallenges] = useState<Suggestion[]>([]);
  const [subjectChallenges, setSubjectChallenges] = useState<string[]>([]);
  const [challengesLoading, setChallengesLoading] = useState(false);

  const semesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8', 'Semester 9'];

  // View state
  const [view, setView] = useState<'courses' | 'challenges'>(courseIdFromUrl ? 'challenges' : 'courses');

  const [selectedSemester, setSelectedSemester] = useState<string>(semesterFromUrl || 'Semester 1');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showSemesterDropdown, setShowSemesterDropdown] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ text: '' });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await subjectService.getAllSubjects();

      const transformedCourses: Course[] = response.items.map((subject: Subject) => ({
        id: subject.subjectId,
        name: subject.name,
        code: subject.code,
        semester: `Semester ${subject.semester || 1}`,
      }));

      setCourses(transformedCourses);
    } catch (err: any) {
      console.error('Error fetching subjects:', err);
      setError(err.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subjects on mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  // Restore course selection from URL after courses are loaded
  useEffect(() => {
    if (courses.length > 0 && courseIdFromUrl) {
      const courseId = parseInt(courseIdFromUrl);
      const course = courses.find(c => c.id === courseId);
      if (course && !selectedCourse) {
        setSelectedCourse(course);
        setSelectedSemester(course.semester);
        setView('challenges');
        setChallengesLoading(true);
        Promise.all([
          fetchChallenges(course.id),
          fetchSubjectChallenges(course.id)
        ]).then(() => setChallengesLoading(false));
      }
    }
  }, [courses, courseIdFromUrl]);



  // Get courses for selected semester
  const coursesForSemester = useMemo(() => {
    return courses.filter(course => course.semester === selectedSemester);
  }, [courses, selectedSemester]);

  const fetchChallenges = async (subjectId: number) => {
    try {
      setChallengesLoading(true);
      const fetchedChallenges = await suggestionService.getSuggestions({
        subjectId: subjectId,
        contentType: SuggestionContentType.CommonChallenge
      });
      setChallenges(fetchedChallenges);
    } catch (err) {
      toast.error('Failed to load challenges.');
      console.error(err);
    } finally {
      setChallengesLoading(false);
    }
  };

  const fetchSubjectChallenges = async (subjectId: number) => {
    try {
      const subject = await subjectService.getSubjectById(subjectId);
      setSubjectChallenges(subject.commonChallenges || []);
    } catch (err) {
      console.error('Failed to load subject challenges:', err);
      // Don't show error toast, this is supplementary data
    }
  };

  const handleCourseSelect = async (course: Course) => {
    setSelectedCourse(course);
    setView('challenges');
    // Save to URL for persistence on reload
    setSearchParams({ courseId: course.id.toString(), semester: course.semester });
    setChallengesLoading(true);
    await Promise.all([
      fetchChallenges(course.id),
      fetchSubjectChallenges(course.id)
    ]);
    setChallengesLoading(false);
  };

  const handleSemesterChange = (semester: string) => {
    setSelectedSemester(semester);
    setShowSemesterDropdown(false);
    const semesterCourses = courses.filter(c => c.semester === semester);
    setSelectedCourse(semesterCourses.length > 0 ? semesterCourses[0] : null);
  };

  const handleAddChallenge = async () => {
    if (!formData.text.trim()) {
      toast.error('Please enter the challenge content');
      return;
    }

    if (!selectedCourse) {
      toast.error('No course selected');
      return;
    }

    setIsSubmitting(true);
    try {
      await suggestionService.createSuggestion({
        subjectId: selectedCourse.id,
        contentType: SuggestionContentType.CommonChallenge,
        content: formData.text,
      });

      toast.success('Challenge submitted for review!');
      cancelForm();
      if (selectedCourse) {
        await fetchChallenges(selectedCourse.id);
      }
    } catch (err: any) {
      console.error('Error submitting suggestion:', err);
      toast.error(err.message || 'Failed to submit suggestion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setFormData({ text: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Common Challenges</h1>
          <p className="text-slate-600">Manage common challenges for courses</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
            <span className="ml-3 text-slate-600">Loading subjects...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="font-semibold text-red-900">Error loading data</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchSubjects}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Main Container */}
        {!loading && !error && view === 'courses' && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200">
            <div className="p-6">
              {/* Semester Selector */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    Select semester
                  </label>
                  <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {coursesForSemester.length} courses
                  </span>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowSemesterDropdown(!showSemesterDropdown)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl hover:border-orange-400 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                        {selectedSemester.replace('Semester ', '')}
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-slate-800 text-lg block">{selectedSemester}</span>
                        <span className="text-xs text-slate-600">Academic Year 2024-2025</span>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${showSemesterDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showSemesterDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowSemesterDropdown(false)}
                      />
                      <div className="absolute z-20 w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-2xl overflow-hidden">
                        <div className="max-h-80 overflow-y-auto">
                          {semesters.map((semester, index) => (
                            <button
                              key={semester}
                              onClick={() => handleSemesterChange(semester)}
                              className={`w-full text-left px-5 py-4 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-150 border-b border-slate-100 last:border-b-0 ${selectedSemester === semester
                                ? 'bg-gradient-to-r from-orange-100 to-red-100 border-l-4 border-l-orange-600'
                                : ''
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm ${selectedSemester === semester
                                  ? 'bg-orange-600 text-white'
                                  : 'bg-slate-200 text-slate-600'
                                  }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-800">{semester}</div>
                                  <div className="text-xs text-slate-500">
                                    {courses.filter(c => c.semester === semester).length} courses
                                  </div>
                                </div>
                                {selectedSemester === semester && (
                                  <div className="ml-auto">
                                    <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Course Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-800">Course list</h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-4"></div>
                </div>

                {coursesForSemester.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coursesForSemester.map((course) => {
                      return (
                        <button
                          key={course.id}
                          onClick={() => handleCourseSelect(course)}
                          className={`group text-left p-5 rounded-xl border-2 transition-all duration-200 ${selectedCourse?.id === course.id
                            ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-red-50 shadow-lg scale-105'
                            : 'border-slate-200 bg-white hover:border-orange-300 hover:shadow-md hover:-translate-y-1'
                            }`}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${selectedCourse?.id === course.id
                              ? 'bg-orange-600 text-white shadow-lg'
                              : 'bg-slate-100 text-slate-600 group-hover:bg-orange-100 group-hover:text-orange-600'
                              }`}>
                              <AlertCircle className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-bold mb-1 line-clamp-2 ${selectedCourse?.id === course.id ? 'text-orange-900' : 'text-slate-800'
                                }`}>
                                {course.name}
                              </h4>
                              <p className="text-sm text-slate-500 font-medium">{course.code}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                            <div className="flex items-center gap-2 text-sm flex-wrap">

                            </div>
                            {selectedCourse?.id === course.id && (
                              <div className="flex items-center gap-1 text-orange-600 text-xs font-semibold">
                                <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <AlertCircle className="w-16 h-16 mx-auto mb-3 text-slate-300" />
                    <p className="text-lg font-semibold">No courses in this semester</p>
                    <p className="text-sm mt-1">Please select another semester</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Challenges List by Course */}
        {view === 'challenges' && selectedCourse && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 mt-6">
            <div className="p-6">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className='max-w-9/12'>
                    <button
                      onClick={() => { setView('courses'); setSelectedCourse(null); setSearchParams({}); }}
                      className="mb-3 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      Back to course list
                    </button>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                      <AlertCircle className="w-6 h-6 text-orange-600" />
                      Common Challenges - {selectedCourse.name}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">{selectedCourse.code}</p>
                  </div>
                  <div className="flex items-center gap-3">

                    {!showForm && (
                      <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm hover:shadow-md"
                      >
                        <Plus className="w-4 h-4" />
                        Add Challenge
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Add/Edit Form */}
              {showForm && (
                <div className="mb-6 p-5 bg-orange-50 rounded-lg border-2 border-orange-200">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">
                    ➕ Add new challenge for the course
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Challenge content *
                      </label>
                      <textarea
                        value={formData.text}
                        onChange={(e) => setFormData({ text: e.target.value })}
                        placeholder="Enter challenge content..."
                        rows={4}
                        className="w-full px-4 py-2.5 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none resize-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleAddChallenge}
                        disabled={!formData.text.trim() || isSubmitting}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-semibold shadow-sm hover:shadow-md w-40"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Add challenge</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={cancelForm}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-semibold"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Challenges List */}
              <div className="mt-8 space-y-8">
                {challengesLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                    <span className="ml-2 text-slate-600">Loading challenges...</span>
                  </div>
                ) : (
                  <>
                    {/* Section 1: From Course Setup (Admin) */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-xl font-bold text-slate-800">From Course Setup</h3>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-semibold">Admin</span>
                      </div>
                      {subjectChallenges.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border-2 border-dashed">
                          <p>No challenges defined in course setup.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {subjectChallenges.map((challenge, index) => (
                            <div key={index} className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                              <div className="flex items-start gap-4">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 bg-blue-500"></span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-slate-800">{challenge}</p>
                                </div>
                                <span className="px-3 py-1 text-xs font-semibold rounded-full flex-shrink-0 bg-blue-100 text-blue-800">
                                  Official
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Section 2: Faculty Suggestions */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-xl font-bold text-slate-800">Faculty Suggestions</h3>
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-semibold">Proposed</span>
                      </div>
                      {challenges.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border-2 border-dashed">
                          <p>No faculty suggestions yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {challenges.map((challenge) => (
                            <div key={challenge.id} className={`p-4 rounded-lg border ${challenge.status === SuggestionStatus.Approved ? 'bg-green-50 border-green-200' :
                              challenge.status === SuggestionStatus.Pending ? 'bg-yellow-50 border-yellow-200' :
                                'bg-red-50 border-red-200'
                              }`}>
                              <div className="flex items-start gap-4">
                                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${challenge.status === SuggestionStatus.Approved ? 'bg-green-500' :
                                  challenge.status === SuggestionStatus.Pending ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}></span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-slate-800 mb-2">{challenge.content}</p>
                                  {challenge.status === SuggestionStatus.Rejected && challenge.rejectionReason && (
                                    <div className="bg-white border border-red-300 rounded px-3 py-2 mt-2">
                                      <p className="text-xs font-semibold text-red-800 mb-1">Rejection Reason:</p>
                                      <p className="text-sm text-red-700">{challenge.rejectionReason}</p>
                                    </div>
                                  )}
                                </div>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${challenge.status === SuggestionStatus.Approved ? 'bg-green-100 text-green-800' :
                                  challenge.status === SuggestionStatus.Pending ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                  {challenge.status === SuggestionStatus.Approved ? 'Approved' : challenge.status === SuggestionStatus.Pending ? 'Pending' : 'Rejected'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengesManagement;
