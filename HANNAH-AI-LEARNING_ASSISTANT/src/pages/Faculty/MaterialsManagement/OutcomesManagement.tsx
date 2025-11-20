import React, { useState, useMemo, useEffect } from 'react';
import { Target, ChevronDown, Plus, X, Check, ChevronRight, Loader2 } from 'lucide-react';
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

const OutcomesManagement: React.FC = () => {
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [learningOutcomes, setLearningOutcomes] = useState<Suggestion[]>([]);
  const [outcomesLoading, setOutcomesLoading] = useState(false);

  const semesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8', 'Semester 9'];

  // View state
    const [view, setView] = useState<'courses' | 'outcomes'>('courses');
    



  const [selectedSemester, setSelectedSemester] = useState<string>('Semester 1');
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



  // Get courses for selected semester
  const coursesForSemester = useMemo(() => {
    return courses.filter(course => course.semester === selectedSemester);
  }, [courses, selectedSemester]);

  // Auto-select first course when semester changes
  const fetchLearningOutcomes = async (subjectId: number) => {
    try {
      setOutcomesLoading(true);
      const outcomes = await suggestionService.getSuggestions({
        subjectId: subjectId,
        contentType: SuggestionContentType.LearningOutcome
      });
      setLearningOutcomes(outcomes);
    } catch (err) {
      toast.error('Failed to load learning outcomes.');
      console.error(err);
    } finally {
      setOutcomesLoading(false);
    }
  };

  const handleCourseSelect = async (course: Course) => {
    setSelectedCourse(course);
    setView('outcomes');
    await fetchLearningOutcomes(course.id);
  };

  const handleSemesterChange = (semester: string) => {
    setSelectedSemester(semester);
    setShowSemesterDropdown(false);
    const semesterCourses = courses.filter(c => c.semester === semester);
    setSelectedCourse(semesterCourses.length > 0 ? semesterCourses[0] : null);
  };



  const handleAddOutcome = async () => {
    if (!formData.text.trim()) {
      toast.error('Please enter the learning outcome content');
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
        contentType: SuggestionContentType.LearningOutcome,
        content: formData.text,
      });

      toast.success('Learning outcome submitted for review!');
      cancelForm();
      if (selectedCourse) {
        await fetchLearningOutcomes(selectedCourse.id);
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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Learning Outcomes</h1>
          <p className="text-slate-600">Manage expected learning outcomes for courses</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
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
                    <Target className="w-5 h-5 text-purple-600" />
                    Select semester
                  </label>
                  <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {coursesForSemester.length} courses
                  </span>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowSemesterDropdown(!showSemesterDropdown)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
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
                              className={`w-full text-left px-5 py-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-150 border-b border-slate-100 last:border-b-0 ${selectedSemester === semester
                                ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-l-4 border-l-purple-600'
                                : ''
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm ${selectedSemester === semester
                                  ? 'bg-purple-600 text-white'
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
                                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
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
                            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg scale-105'
                            : 'border-slate-200 bg-white hover:border-purple-300 hover:shadow-md hover:-translate-y-1'
                            }`}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${selectedCourse?.id === course.id
                              ? 'bg-purple-600 text-white shadow-lg'
                              : 'bg-slate-100 text-slate-600 group-hover:bg-purple-100 group-hover:text-purple-600'
                              }`}>
                              <Target className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-bold mb-1 line-clamp-2 ${selectedCourse?.id === course.id ? 'text-purple-900' : 'text-slate-800'
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
                              <div className="flex items-center gap-1 text-purple-600 text-xs font-semibold">
                                <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <Target className="w-16 h-16 mx-auto mb-3 text-slate-300" />
                    <p className="text-lg font-semibold">No courses in this semester</p>
                    <p className="text-sm mt-1">Please select another semester</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Outcomes List by Course */}
        {view === 'outcomes' && selectedCourse && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 mt-6">
            <div className="p-6">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className='max-w-9/12'>
                    <button
                      onClick={() => { setView('courses'); setSelectedCourse(null); }}
                      className="mb-3 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      Back to course list
                    </button>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                      <Target className="w-6 h-6 text-purple-600" />
                      Learning Outcomes - {selectedCourse.name}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">{selectedCourse.code}</p>
                  </div>
                  <div className="flex items-center gap-3">

                    {!showForm && (
                      <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold shadow-sm hover:shadow-md"
                      >
                        <Plus className="w-4 h-4" />
                        Add Outcome
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Add/Edit Form */}
              {showForm && (
                <div className="mb-6 p-5 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">
                    ➕ Add new learning outcome for the course
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Outcome content *
                      </label>
                      <textarea
                        value={formData.text}
                        onChange={(e) => setFormData({ text: e.target.value })}
                        placeholder="Enter expected outcome content..."
                        rows={4}
                        className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none resize-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleAddOutcome}
                        disabled={!formData.text.trim() || isSubmitting}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-semibold shadow-sm hover:shadow-md w-40"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Add outcome</span>
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

              {/* Outcomes List */}
              <div className="mt-8">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Current Learning Outcomes</h3>
                {outcomesLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    <span className="ml-2 text-slate-600">Loading outcomes...</span>
                  </div>
                ) : learningOutcomes.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border-2 border-dashed">
                    <p>No learning outcomes found for this course.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {learningOutcomes.map((outcome) => (
                      <div key={outcome.id} className={`p-4 rounded-lg border flex items-center gap-4 ${
                        outcome.status === SuggestionStatus.Approved ? 'bg-green-50 border-green-200' :
                        outcome.status === SuggestionStatus.Pending ? 'bg-yellow-50 border-yellow-200' :
                        'bg-red-50 border-red-200'
                      }`}>
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          outcome.status === SuggestionStatus.Approved ? 'bg-green-500' :
                          outcome.status === SuggestionStatus.Pending ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></span>
                        <p className="flex-1 text-slate-800">{outcome.content}</p>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          outcome.status === SuggestionStatus.Approved ? 'bg-green-100 text-green-800' :
                          outcome.status === SuggestionStatus.Pending ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {outcome.status === SuggestionStatus.Approved ? 'Approved' : outcome.status === SuggestionStatus.Pending ? 'Pending' : 'Rejected'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>


    </div>
  );
};

export default OutcomesManagement;
