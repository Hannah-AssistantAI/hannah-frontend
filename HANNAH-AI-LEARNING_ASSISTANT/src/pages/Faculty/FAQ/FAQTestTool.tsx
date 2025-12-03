import React, { useState } from 'react';
import customResponseService from '../../../service/customResponseService';
import type { Subject } from '../../../service/subjectService';
import toast from 'react-hot-toast';

interface FAQTestToolProps {
    subjects: Subject[];
}

const FAQTestTool: React.FC<FAQTestToolProps> = ({ subjects }) => {
    const [testQuery, setTestQuery] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const [showResults, setShowResults] = useState(false);

    const handleTest = async () => {
        if (!testQuery.trim()) {
            toast.error('Please enter a test question');
            return;
        }

        setIsTesting(true);
        setShowResults(false);

        try {
            const result = await customResponseService.testMatch({
                query: testQuery,
                subjectId: selectedSubjectId ? parseInt(selectedSubjectId) : undefined
            });

            setTestResult(result);
            setShowResults(true);

            if (result.matched) {
                toast.success('FAQ Match Found!');
            } else {
                toast.success('No FAQ matched - would use AI', {
                    icon: 'ℹ️',
                });
            }
        } catch (error: any) {
            toast.error(error?.message || 'Error testing FAQ match');
            setTestResult(null);
        } finally {
            setIsTesting(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isTesting) {
            handleTest();
        }
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6 mb-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">FAQ Matching Test Tool</h3>
                    <p className="text-sm text-gray-600">Test if a student question would match your FAQs</p>
                </div>
            </div>

            {/* Test Form */}
            <div className="space-y-4">
                {/* Subject Filter */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject (Optional)
                    </label>
                    <select
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                    >
                        <option value="">All Subjects</option>
                        {subjects.map(subject => (
                            <option key={subject.subjectId} value={subject.subjectId.toString()}>
                                {subject.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Test Query Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Test Question
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Example: What is Agile methodology?"
                            value={testQuery}
                            onChange={(e) => setTestQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                        <button
                            onClick={handleTest}
                            disabled={isTesting || !testQuery.trim()}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            {isTesting ? (
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                'Test'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Test Results */}
            {showResults && testResult && (
                <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-start gap-3">
                        {testResult.matched ? (
                            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                        ) : (
                            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-2">
                                {testResult.matched ? '✅ Match Found!' : '❌ No Match - Will Use AI'}
                            </h4>
                            {testResult.matched && testResult.response && (
                                <div className="space-y-2">
                                    <div className="text-sm text-gray-700">
                                        <span className="font-medium">FAQ ID:</span> {testResult.response.responseId}
                                    </div>
                                    <div className="text-sm text-gray-700">
                                        <span className="font-medium">Keywords:</span>{' '}
                                        {testResult.response.triggerKeywords.map((kw: string, idx: number) => (
                                            <span key={idx} className="inline-block px-2 py-0.5 mr-1 mb-1 bg-blue-100 text-blue-800 text-xs rounded">
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="text-xs font-medium text-gray-500 mb-1">Response:</div>
                                        <div className="text-sm text-gray-800">{testResult.response.responseContent}</div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                        Used {testResult.response.usageCount} times
                                    </div>
                                </div>
                            )}
                            {!testResult.matched && (
                                <p className="text-sm text-gray-600">
                                    This question doesn't match any existing FAQ. The system would use AI to generate a response.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FAQTestTool;
