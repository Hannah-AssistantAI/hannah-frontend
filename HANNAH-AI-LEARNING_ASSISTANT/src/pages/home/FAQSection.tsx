import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowRight, Loader2, Search } from 'lucide-react';
import customResponseService from '../../service/customResponseService';
import type { CustomResponse } from '../../service/customResponseService';
import subjectService, { type Subject } from '../../service/subjectService';

interface FAQItem {
    id: string | number;
    question: string;
    category: string;
    color: string;
}

export default function FAQSection() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [faqs, setFaqs] = useState<FAQItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const sectionRef = useRef<HTMLDivElement>(null);

    const colors = [
        "text-blue-400",
        "text-yellow-400",
        "text-red-400",
        "text-purple-400",
        "text-green-400",
        "text-orange-400"
    ];

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch subjects list
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const response = await subjectService.getAllSubjects();
                setSubjects(response.items || []);
            } catch (error) {
                console.error("Failed to fetch subjects:", error);
            }
        };
        fetchSubjects();
    }, []);

    // Fetch FAQs based on selected subject and search term
    useEffect(() => {
        const fetchFAQs = async () => {
            setLoading(true);
            try {
                const response = await customResponseService.getPublicCustomResponses(
                    selectedSubjectId, // Filter by subject
                    1,
                    6,
                    debouncedSearchTerm // Filter by search term
                );
                console.log("FAQSection: Fetched response:", response);

                if (!response || !response.items) {
                    console.warn("FAQSection: No items in response");
                    throw new Error("No items in response");
                }

                // Fetch subject details for each FAQ
                const faqsWithSubjects = await Promise.all(response.items.map(async (item: CustomResponse, index: number) => {
                    let category = "Chung";
                    if (item.subjectId) {
                        try {
                            const subject = await subjectService.getSubjectById(item.subjectId);
                            category = subject.code || subject.name;
                        } catch (err) {
                            console.error(`Failed to fetch subject ${item.subjectId}`, err);
                            category = `Môn ${item.subjectId}`;
                        }
                    }

                    return {
                        id: item.responseId,
                        question: item.questionPattern || item.triggerKeywords[0],
                        category: category,
                        color: colors[index % colors.length]
                    };
                }));

                console.log("FAQSection: Mapped FAQs:", faqsWithSubjects);

                if (faqsWithSubjects.length > 0) {
                    setFaqs(faqsWithSubjects);
                } else {
                    console.warn("FAQSection: Empty list after mapping");
                    setFaqs([]);
                }
            } catch (error) {
                console.error("Failed to fetch FAQs:", error);
                setFaqs([]);
            } finally {
                setLoading(false);
            }
        };

        fetchFAQs();
    }, [selectedSubjectId, debouncedSearchTerm]); // Re-fetch when subject or search term changes

    useEffect(() => {
        if (loading) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, [loading]);

    const handleQuestionClick = (question: string, faqId: string | number) => {
        if (!isAuthenticated) {
            alert('Vui lòng đăng nhập để sử dụng tính năng này!');
            return;
        }

        // Track FAQ usage - pass ID as-is (MongoDB ObjectID string)
        customResponseService.incrementUsageCount(faqId);

        navigate('/chat', { state: { query: question } });
    };

    if (loading && !faqs.length) { // Only show full loader if no FAQs are loaded yet
        return (
            <section className="py-12 px-6 w-full max-w-[1000px] mx-auto flex justify-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </section>
        );
    }

    return (
        <section ref={sectionRef} className="py-12 px-6 w-full max-w-[1000px] mx-auto">
            <div className={`text-center mb-10 transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 font-google-sans">
                    Câu hỏi thường gặp
                </h2>
                <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">
                    Khám phá các thắc mắc phổ biến về kĩ thuật phần mềm. Bấm vào để hỏi Hannah ngay.
                </p>
            </div>

            {/* Search and Filter Container */}
            <div className={`flex flex-col md:flex-row justify-center items-center gap-4 mb-8 transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

                {/* Search Input */}
                <div className="relative w-full max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-lg leading-5 bg-white/5 text-gray-300 placeholder-gray-400 focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-blue-500/50 sm:text-sm transition-colors duration-200"
                        placeholder="Tìm kiếm câu hỏi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Subject Filter Dropdown */}
                <select
                    value={selectedSubjectId ?? ""}
                    onChange={(e) => setSelectedSubjectId(e.target.value ? Number(e.target.value) : undefined)}
                    className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-white/10 transition-colors duration-200 cursor-pointer w-full md:w-auto"
                >
                    <option value="" className="bg-gray-800 text-gray-200">
                        Tất cả câu hỏi thường gặp
                    </option>
                    <option value="-1" className="bg-gray-800 text-gray-200">
                        Tư vấn chung
                    </option>
                    {subjects.map(subject => (
                        <option key={subject.subjectId} value={subject.subjectId} className="bg-gray-800 text-gray-200">
                            {subject.code} - {subject.name}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
            ) : faqs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={faq.id}
                            onClick={() => handleQuestionClick(faq.question, faq.id)}
                            className={`group bg-white/5 backdrop-blur-sm hover:bg-white/10 border border-white/10 rounded-xl p-5 cursor-pointer transition-all duration-300 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                                }`}
                            style={{ transitionDelay: `${index * 50}ms` }}
                        >
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className={`text-[11px] font-bold uppercase tracking-wider ${faq.color}`}>
                                        {faq.category}
                                    </span>
                                </div>
                                <h3 className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors duration-200 line-clamp-2 leading-relaxed">
                                    {faq.question}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={`text-center py-10 transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <p className="text-gray-400">
                        {debouncedSearchTerm ? `Không tìm thấy câu hỏi nào cho "${debouncedSearchTerm}".` : "Chưa có câu hỏi thường gặp nào cho mục này."}
                    </p>
                </div>
            )}

            <div className={`mt-8 text-center transition-all duration-700 delay-500 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <button
                    onClick={() => navigate('/chat')}
                    className="inline-flex items-center px-5 py-2 border border-white/20 text-sm font-medium rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors duration-200"
                >
                    Đặt câu hỏi khác
                    <ArrowRight className="ml-2 w-4 h-4" />
                </button>
            </div>
        </section>
    );
}
