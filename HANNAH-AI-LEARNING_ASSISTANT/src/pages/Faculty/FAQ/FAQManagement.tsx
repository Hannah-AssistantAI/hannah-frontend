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

  // Only load FAQs when subjects are loaded
  useEffect(() => {
    if (subjects.length > 0) {
      loadFAQs();
    }
  }, [filters, subjects]);

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
        subjectName: subjects.find(s => s.subjectId === item.subjectId)?.name || 'Unknown',
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

          {/* Filters Section - Clean horizontal layout */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6">
            <div className="p-5">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                    placeholder="Search questions, answers or tags..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange({ search: e.target.value })}
                  />
                </div>

                {/* Subject Filter */}
                <div className="relative lg:w-56">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <select
                    className="w-full pl-12 pr-10 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm text-gray-900 appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                    value={filters.subjectId}
                    onChange={(e) => handleFilterChange({ subjectId: e.target.value })}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 12px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '20px'
                    }}
                  >
                    <option value="">All Subjects</option>
                    {subjects.map(subject => (
                      <option key={subject.subjectId} value={subject.subjectId.toString()}>{subject.name}</option>
                    ))}
                  </select>
                </div>
              </div>
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
