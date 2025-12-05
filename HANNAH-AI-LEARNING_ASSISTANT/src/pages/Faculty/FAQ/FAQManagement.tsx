import React, { useState, useEffect } from 'react';
import FAQList from './FAQList';
import FAQForm from './FAQForm';
import FAQUsageChart from './FAQUsageChart';
import customResponseService from '../../../service/customResponseService';
import type { CustomResponse } from '../../../types/CustomResponseTypes';
import subjectService from '../../../service/subjectService';
import type { Subject } from '../../../service/subjectService';
import { useApp } from '../../../contexts/AppContext';
import toast from 'react-hot-toast';


interface FAQ {
  id: string;
  question: string;
  answer: string;
  subjectId: number | null;
  subjectName?: string;
  tags: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const FAQManagement = () => {
  const { setLoading } = useApp();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [filters, setFilters] = useState({
    subjectId: '',
    search: '',
    tags: [] as string[]
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    loadFAQs();
  }, [filters]);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      const subjectIdNum = filters.subjectId ? parseInt(filters.subjectId) : undefined;
      const response = await customResponseService.getCustomResponses(subjectIdNum);

      // Transform CustomResponse to FAQ format
      const transformedFAQs: FAQ[] = response.items.map((item: CustomResponse) => ({
        id: item.responseId,
        question: item.questionPattern || item.triggerKeywords.join(', '),  // Display question pattern or keywords
        answer: item.responseContent,
        subjectId: item.subjectId,
        subjectName: subjects.find(s => s.subjectId === item.subjectId)?.name || 'N/A',
        tags: item.triggerKeywords,
        usageCount: item.usageCount,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));

      // Apply search filter
      let filtered = transformedFAQs;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(faq =>
          faq.question.toLowerCase().includes(searchLower) ||
          faq.answer.toLowerCase().includes(searchLower) ||
          faq.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      setFaqs(filtered);
    } catch (error: any) {
      toast.error(error?.message || 'Error loading FAQ list');
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await subjectService.getAllSubjects();
      if (response && response.items) {
        setSubjects(response.items);
        // Load FAQs after subjects are loaded
        loadFAQs();
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const handleCreateFAQ = () => {
    setEditingFAQ(null);
    setShowForm(true);
  };

  const handleEditFAQ = (faq: React.SetStateAction<null>) => {
    setEditingFAQ(faq);
    setShowForm(true);
  };

  const handleDeleteFAQ = async (faqId: any) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) {
      return;
    }

    try {
      setLoading(true);
      await customResponseService.deleteCustomResponse(faqId);
      toast.success('FAQ deleted successfully');
      loadFAQs();
    } catch (error: any) {
      toast.error(error?.message || 'Error deleting FAQ');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingFAQ(null);
    loadFAQs();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingFAQ(null);
  };

  const handleFilterChange = (newFilters: Partial<{ subjectId: string; search: string; tags: string[] }>) => {
    setFilters({ ...filters, ...newFilters });
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">

          {/* Header Section */}
          <div className="mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">FAQ Management</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage frequently asked questions and answers for students
              </p>
            </div>
          </div>

          {/* Usage Statistics Chart - TEMPORARILY HIDDEN
          <div className="mb-6">
            <FAQUsageChart />
          </div>
          */}

          {/* Create FAQ Button */}
          <div className="mb-6">
            <button
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={handleCreateFAQ}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New FAQ
            </button>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Subject Filter */}
                <div className="lg:w-64">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <select
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    value={filters.subjectId}
                    onChange={(e) => handleFilterChange({ subjectId: e.target.value })}
                  >
                    <option value="">All Subjects</option>
                    {subjects.map(subject => (
                      <option key={subject.subjectId} value={subject.subjectId.toString()}>{subject.name}</option>
                    ))}
                  </select>
                </div>

                {/* Search Input */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="Search questions, answers or tags..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange({ search: e.target.value })}
                    />
                  </div>
                </div>

                {/* Reset Button */}
                <div className="lg:w-auto flex items-end">
                  <button
                    className="inline-flex items-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                    onClick={() => setFilters({ subjectId: '', search: '', tags: [] })}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset
                  </button>
                </div>
              </div>

              {/* Active Filters Display */}
              {(filters.subjectId || filters.search || filters.tags.length > 0) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {filters.subjectId && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {subjects.find(s => s.subjectId.toString() === filters.subjectId)?.name || filters.subjectId}
                      <button
                        onClick={() => handleFilterChange({ subjectId: '' })}
                        className="ml-2 hover:text-blue-900"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {filters.search && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Search: "{filters.search}"
                      <button
                        onClick={() => handleFilterChange({ search: '' })}
                        className="ml-2 hover:text-green-900"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* FAQ List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <FAQList
              faqs={faqs}
              onEdit={handleEditFAQ}
              onDelete={handleDeleteFAQ}
            />
          </div>
        </div>
      </div>

      {/* FAQ Form Modal - Portal style with proper z-index */}
      {showForm && (
        <div
          className="fixed inset-0 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          {/* Background overlay with animation */}
          <div
            className="fixed inset-0 bg-opacity-50 transition-opacity"
            onClick={handleFormCancel}
            aria-hidden="true"
          ></div>

          {/* Modal container */}
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            {/* Modal panel */}
            <div
              className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <FAQForm
                faq={editingFAQ}
                subjects={subjects}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FAQManagement;
