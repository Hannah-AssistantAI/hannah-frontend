import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowRight, Loader2 } from 'lucide-react';
import customResponseService from '../../service/customResponseService';
import type { CustomResponse } from '../../service/customResponseService';
import subjectService from '../../service/subjectService';

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
    const sectionRef = useRef<HTMLDivElement>(null);

    const colors = [
        "text-blue-400",
        "text-yellow-400",
        "text-red-400",
        "text-purple-400",
        "text-green-400",
        "text-orange-400"
    ];

    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                const response = await customResponseService.getPublicCustomResponses(undefined, 1, 6);
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
                    console.warn("FAQSection: Empty list after mapping, using fallback");
                    // Fallback data if API is empty
                    setFaqs([
                        { id: 1, question: "Làm thế nào để đăng ký môn học?", category: "Học vụ", color: colors[0] },
                        { id: 2, question: "Điều kiện học bổng là gì?", category: "Học bổng", color: colors[1] },
                        { id: 3, question: "Quy chế thi như thế nào?", category: "Thi cử", color: colors[2] },
                    ]);
                }
            } catch (error) {
                console.error("Failed to fetch FAQs:", error);
                // Fallback on error
                setFaqs([
                    { id: 1, question: "Làm thế nào để đăng ký môn học?", category: "Học vụ", color: colors[0] },
                    { id: 2, question: "Điều kiện học bổng là gì?", category: "Học bổng", color: colors[1] },
                    { id: 3, question: "Quy chế thi như thế nào?", category: "Thi cử", color: colors[2] },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchFAQs();
    }, []);

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

    const handleQuestionClick = (question: string) => {
        if (!isAuthenticated) {
            alert('Vui lòng đăng nhập để sử dụng tính năng này!');
            return;
        }
        navigate('/chat', { state: { query: question } });
    };

    if (loading) {
        return (
            <section className="py-12 px-6 w-full max-w-[1000px] mx-auto flex justify-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </section>
        );
    }

    if (faqs.length === 0) {
        return null;
    }

    return (
        <section ref={sectionRef} className="py-12 px-6 w-full max-w-[1000px] mx-auto">
            <div className={`text-center mb-10 transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 font-google-sans">
                    Câu hỏi thường gặp
                </h2>
                <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">
                    Khám phá các thắc mắc phổ biến. Bấm vào để hỏi Hannah ngay.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {faqs.map((faq, index) => (
                    <div
                        key={faq.id}
                        onClick={() => handleQuestionClick(faq.question)}
                        className={`group bg-white/5 backdrop-blur-sm hover:bg-white/10 border border-white/10 rounded-xl p-5 cursor-pointer transition-all duration-300 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                            }`}
                        style={{ transitionDelay: `${index * 50}ms` }}
                    >
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className={`text-[11px] font-bold uppercase tracking-wider ${faq.color}`}>
                                    {faq.category}
                                </span>
                                <ArrowRight className={`w-4 h-4 ${faq.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                            </div>
                            <h3 className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors duration-200 line-clamp-2 leading-relaxed">
                                {faq.question}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

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
