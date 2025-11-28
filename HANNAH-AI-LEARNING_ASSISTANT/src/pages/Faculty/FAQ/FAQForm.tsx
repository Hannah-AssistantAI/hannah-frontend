import React, { useState, useEffect } from 'react';
import { useApp } from '../../../contexts/AppContext';
import customResponseService from '../../../service/customResponseService';
import type { SimilarResponseItem } from '../../../types/CustomResponseTypes';
import type { Subject } from '../../../service/subjectService';
import toast from 'react-hot-toast';

interface FAQ {
  id?: string;
  question: string;
  answer: string;
  subjectId: number | null;
  tags: string[];
  usageCount?: number;
  createdAt?: string;
}

interface FAQFormProps {
  faq: FAQ | null;
  subjects: Subject[];
  onSuccess: () => void;
  onCancel: () => void;
}

const FAQForm = ({ faq, subjects, onSuccess, onCancel }: FAQFormProps) => {
  const { setLoading } = useApp();
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    subjectId: '',
    tags: [] as string[]
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [similarFAQs, setSimilarFAQs] = useState<SimilarResponseItem[]>([]); // Same subject - blocks submit
  const [crossSubjectFAQs, setCrossSubjectFAQs] = useState<SimilarResponseItem[]>([]); // Other subjects - warning only
  const [isCheckingSimilarity, setIsCheckingSimilarity] = useState(false);

  useEffect(() => {
    if (faq) {
      setFormData({
        question: faq.question,
        answer: faq.answer,
        subjectId: faq.subjectId?.toString() || '',
        tags: [...faq.tags]
      });
    }
  }, [faq]);

  // Debounced similarity check
  useEffect(() => {
    const checkSimilarity = async () => {
      if (!formData.question.trim() || formData.question.length < 5) {
        setSimilarFAQs([]);
        setCrossSubjectFAQs([]);
        return;
      }

      setIsCheckingSimilarity(true);
      try {
        // Check similarity across ALL subjects (pass undefined for subjectId)
        const result = await customResponseService.checkSimilarity(formData.question, undefined);

        // Filter out the current FAQ if editing
        let allSimilar = result.items.filter(item => {
          if (faq?.id && item.response.responseId === faq.id) return false;
          return true;
        });

        // Split into same-subject (blocking) and cross-subject (warning only)
        const currentSubjectId = formData.subjectId ? parseInt(formData.subjectId) : null;

        const sameSubject = allSimilar.filter(item =>
          item.response.subjectId === currentSubjectId
        );

        const crossSubject = allSimilar.filter(item =>
          item.response.subjectId !== currentSubjectId
        );

        setSimilarFAQs(sameSubject);
        setCrossSubjectFAQs(crossSubject);
      } catch (error) {
        console.error("Error checking similarity", error);
      } finally {
        setIsCheckingSimilarity(false);
      }
    };

    const timer = setTimeout(checkSimilarity, 500); // 500ms debounce for faster feedback
    return () => clearTimeout(timer);
  }, [formData.question, formData.subjectId, faq?.id]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.question.trim()) {
      newErrors.question = 'Question cannot be empty';
    }

    if (!formData.answer.trim()) {
      newErrors.answer = 'Answer cannot be empty';
    }

    // Subject is no longer mandatory (General FAQs allowed)
    // if (!formData.subjectId) {
    //   newErrors.subjectId = 'Please select a subject';
    // }

    if (formData.tags.length === 0) {
      newErrors.tags = 'Please add at least one tag';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Block submit ONLY if there are same-subject duplicates
    if (similarFAQs.length > 0) {
      toast.error('Cannot create duplicate FAQ in the same subject. Please modify your question.');
      return;
    }

    // Cross-subject similar FAQs show warning only, don't block submission

    try {
      setLoading(true);

      // If subjectId is empty string, send null (General FAQ)
      const subjectIdNum = formData.subjectId ? parseInt(formData.subjectId) : null;

      if (faq) {
        // Update existing FAQ
        await customResponseService.updateCustomResponse(faq.id!, {
          triggerKeywords: formData.tags,
          questionPattern: formData.question,
          responseContent: formData.answer,
          isActive: true
        });
        toast.success('FAQ updated successfully');
      } else {
        // Create new FAQ
        await customResponseService.createCustomResponse({
          subjectId: subjectIdNum,
          triggerKeywords: formData.tags,
          questionPattern: formData.question,
          responseContent: formData.answer,
          isActive: true
        });
        toast.success('New FAQ created successfully');
      }

      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || 'Error saving FAQ');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const getSubjectName = (subjectId: number | null): string => {
    if (!subjectId) return 'Chung / General';
    const subject = subjects.find(s => s.subjectId === subjectId);
    return subject?.name || `Subject ${subjectId}`;
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
      setTagInput('');
      if (errors.tags) {
        const newErrors = { ...errors };
        delete newErrors.tags;
        setErrors(newErrors);
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {faq ? 'Edit FAQ' : 'Add New FAQ'}
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">
                {faq ? 'Update FAQ information' : 'Create a new FAQ for students'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          <div className="space-y-6">
            {/* Question Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Question <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  className={`w-full px-4 py-3 bg-white border rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 ${errors.question
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  value={formData.question}
                  onChange={(e) => handleInputChange('question', e.target.value)}
                  placeholder="Example: How do I submit assignments on the system?"
                />
                {isCheckingSimilarity && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
                {errors.question && !isCheckingSimilarity && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Similarity Warning */}
              {similarFAQs.length > 0 && (
                <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 w-full">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Similar FAQs found ({similarFAQs.length})
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p className="mb-2">This question might be a duplicate. Please check existing FAQs:</p>
                        <ul className="list-disc pl-5 space-y-1 max-h-40 overflow-y-auto">
                          {similarFAQs.map((item, index) => (
                            <li key={index}>
                              <span className="font-semibold">{item.response.responseContent.substring(0, 60)}...</span>
                              <span className="text-xs text-yellow-600 ml-2">({Math.round(item.similarityScore)}% match)</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cross-Subject Similarity Info (Warning only, doesn't block) */}
              {crossSubjectFAQs.length > 0 && similarFAQs.length === 0 && (
                <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 w-full">
                      <h3 className="text-sm font-medium text-blue-800">
                        Similar FAQs in other subjects ({crossSubjectFAQs.length})
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p className="mb-2">ℹ️ Found similar questions in other subjects. You can still create this FAQ.</p>
                        <ul className="list-disc pl-5 space-y-1 max-h-32 overflow-y-auto">
                          {crossSubjectFAQs.slice(0, 3).map((item, index) => (
                            <li key={index}>
                              <span className="font-semibold">{item.response.questionPattern || 'FAQ'}</span>
                              <span className="text-xs text-blue-600 ml-2">
                                ({getSubjectName(item.response.subjectId)}, {Math.round(item.similarityScore)}% match)
                              </span>
                            </li>
                          ))}
                          {crossSubjectFAQs.length > 3 && (
                            <li className="text-xs italic">...and {crossSubjectFAQs.length - 3} more</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {errors.question && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.question}
                </p>
              )}
            </div>

            {/* Answer Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Answer <span className="text-red-500">*</span>
              </label>
              <textarea
                className={`w-full px-4 py-3 bg-white border rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 resize-none ${errors.answer
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                value={formData.answer}
                onChange={(e) => handleInputChange('answer', e.target.value)}
                placeholder="Enter a detailed and complete answer..."
                rows={6}
              />
              {errors.answer && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.answer}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Provide a clear, understandable, and helpful answer for students
              </p>
            </div>

            {/* Subject Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subject
              </label>
              <div className="relative">
                <select
                  className={`w-full px-4 py-3 bg-white border rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 appearance-none ${errors.subjectId
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  value={formData.subjectId}
                  onChange={(e) => handleInputChange('subjectId', e.target.value)}
                >
                  <option value="">General</option>
                  {subjects.map(subject => (
                    <option key={subject.subjectId} value={subject.subjectId.toString()}>{subject.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.subjectId && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.subjectId}
                </p>
              )}
            </div>

            {/* Tags Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tags <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 mb-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInputKeyPress}
                    placeholder="Enter tag and press Enter or click Add"
                  />
                </div>
                <button
                  type="button"
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {/* Tags Display */}
              {formData.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 text-sm font-medium rounded-full border border-green-300 hover:bg-green-200 transition-colors duration-150"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:bg-green-300 rounded-full p-0.5 transition-colors duration-150"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <p className="text-sm text-gray-500">No tags yet. Add tags to categorize the FAQ</p>
                </div>
              )}

              {errors.tags && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.tags}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Tags help students find questions more easily. Example: "submission", "deadline", "guide"
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3">
          <button
            type="button"
            className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={similarFAQs.length > 0}
            className={`inline-flex items-center px-5 py-2.5 font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${similarFAQs.length > 0
              ? 'bg-gray-400 cursor-not-allowed text-gray-200'
              : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
              }`}
            title={similarFAQs.length > 0 ? "Cannot submit while similar FAQs exist" : ""}
          >
            {faq ? (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Update
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FAQForm;
