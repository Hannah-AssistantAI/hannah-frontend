import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Loader2 } from 'lucide-react';
import customResponseService from '../../../service/customResponseService';
import subjectService, { type Subject } from '../../../service/subjectService';

interface FAQUsageData {
    subjectName: string;
    usageCount: number;
    faqCount: number;
    topFAQ?: string;
    color: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function FAQUsageChart() {
    const [data, setData] = useState<FAQUsageData[]>([]);
    const [filteredData, setFilteredData] = useState<FAQUsageData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsageData();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredData(data.slice(0, 10));
        } else {
            const filtered = data.filter(item =>
                item.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredData(filtered.slice(0, 10));
        }
    }, [searchTerm, data]);

    const fetchUsageData = async () => {
        setLoading(true);
        try {
            const subjectsResponse = await subjectService.getAllSubjects();
            const subjects = subjectsResponse.items || [];

            const usageData: FAQUsageData[] = [];

            for (const subject of subjects) {
                try {
                    const faqs = await customResponseService.getCustomResponses(
                        subject.subjectId,
                        1,
                        100
                    );

                    if (faqs.items && faqs.items.length > 0) {
                        const totalUsage = faqs.items.reduce((sum, faq) => sum + (faq.usageCount || 0), 0);

                        const topFAQ = faqs.items.reduce((prev, current) =>
                            (current.usageCount || 0) > (prev.usageCount || 0) ? current : prev
                        );

                        usageData.push({
                            subjectName: subject.code || subject.name,
                            usageCount: totalUsage,
                            faqCount: faqs.items.length,
                            topFAQ: topFAQ.questionPattern || topFAQ.triggerKeywords[0],
                            color: COLORS[usageData.length % COLORS.length]
                        });
                    }
                } catch (error) {
                    console.error(`Failed to fetch FAQs for subject ${subject.subjectId}:`, error);
                }
            }

            usageData.sort((a, b) => b.usageCount - a.usageCount);
            setData(usageData);
            setFilteredData(usageData.slice(0, 10));
        } catch (error) {
            console.error('Failed to fetch usage data:', error);
        } finally {
            setLoading(false);
        }
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-xl">
                    <p className="text-gray-900 font-semibold text-sm mb-2">{data.subjectName}</p>
                    <p className="text-blue-600 text-xs">Total Usage: <span className="font-bold">{data.usageCount}</span></p>
                    <p className="text-purple-600 text-xs">Total FAQs: <span className="font-bold">{data.faqCount}</span></p>
                    {data.topFAQ && (
                        <p className="text-gray-700 text-xs mt-2 max-w-xs">
                            Top FAQ: <span className="italic">"{data.topFAQ.substring(0, 60)}..."</span>
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-8 flex items-center justify-center shadow-sm">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
                <p className="text-gray-600">No usage data available</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">FAQ Usage Statistics by Subject</h3>
                </div>

                <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search subject code (e.g., PRN212, MAD101)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
                    />
                </div>
            </div>

            {filteredData.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-500 text-sm">No subjects found matching "{searchTerm}"</p>
                </div>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="subjectName"
                                tick={{ fill: '#1f2937', fontSize: 12 }}
                                stroke="#9ca3af"
                                height={60}
                            />
                            <YAxis
                                tick={{ fill: '#1f2937', fontSize: 12 }}
                                stroke="#9ca3af"
                                allowDecimals={false}
                                label={{
                                    value: 'Usage Count',
                                    angle: -90,
                                    position: 'insideLeft',
                                    fill: '#1f2937',
                                    style: { textAnchor: 'middle' }
                                }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
                            <Bar dataKey="usageCount" radius={[8, 8, 0, 0]}>
                                {filteredData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    <div className="mt-4 text-xs text-gray-600 text-center">
                        {searchTerm ? `Showing ${filteredData.length} of ${data.length} subjects` : `Showing top ${filteredData.length} subjects by usage`}
                        {' • '}Hover over bars to see detailed FAQ information
                    </div>
                </>
            )}
        </div>
    );
}
