import React, { useState, useEffect } from 'react';
import FAQList from './FAQList';
import FAQForm from './FAQForm';
import { getFAQs, deleteFAQ, getCourses } from '../../../service/mockApi';
import { useApp } from '../../../contexts/AppContext';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  course: string;
  tags: string[];
  usageCount: number;
  createdAt: string;
  updatedBy: string;
}

const FAQManagement = () => {
  const { setLoading, showNotification } = useApp();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [filters, setFilters] = useState({
    course: '',
    search: '',
    tags: [] as string[]
  });

  useEffect(() => {
    loadFAQs();
    loadCourses();
  }, []);

  useEffect(() => {
    loadFAQs();
  }, [filters]);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      const response = await getFAQs(filters);
      setFaqs(response.data);
    } catch (error) {
      showNotification('Lỗi khi tải danh sách FAQ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await getCourses();
      setCourses(response.data);
    } catch (error) {
      console.error('Error loading courses:', error);
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
    if (!window.confirm('Bạn có chắc chắn muốn xóa FAQ này?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteFAQ(faqId);
      showNotification('Xóa FAQ thành công', 'success');
      loadFAQs();
    } catch (error) {
      showNotification('Lỗi khi xóa FAQ', 'error');
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

  const handleFilterChange = (newFilters: Partial<{ course: string; search: string; tags: string[] }>) => {
    setFilters({ ...filters, ...newFilters });
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Quản lý câu hỏi thường gặp</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Quản lý câu hỏi thường gặp và câu trả lời cho sinh viên
                </p>
              </div>
              <button 
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={handleCreateFAQ}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Thêm câu hỏi mới
              </button>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Course Filter */}
                <div className="lg:w-64">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Môn học
                  </label>
                  <select
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    value={filters.course}
                    onChange={(e) => handleFilterChange({ course: e.target.value })}
                  >
                    <option value="">Tất cả môn học</option>
                    {courses.map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>
                
                {/* Search Input */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tìm kiếm
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
                      placeholder="Tìm kiếm câu hỏi, câu trả lời hoặc tags..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange({ search: e.target.value })}
                    />
                  </div>
                </div>
                
                {/* Reset Button */}
                <div className="lg:w-auto flex items-end">
                  <button
                    className="inline-flex items-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                    onClick={() => setFilters({ course: '', search: '', tags: [] })}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset
                  </button>
                </div>
              </div>

              {/* Active Filters Display */}
              {(filters.course || filters.search || filters.tags.length > 0) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-sm text-gray-600">Bộ lọc đang áp dụng:</span>
                  {filters.course && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {filters.course}
                      <button
                        onClick={() => handleFilterChange({ course: '' })}
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
                      Tìm: "{filters.search}"
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
          className="fixed inset-0 z-[9999] overflow-y-auto"
          aria-labelledby="modal-title" 
          role="dialog" 
          aria-modal="true"
        >
          {/* Background overlay with animation */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
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
                courses={courses}
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
