import React, { useState } from 'react';
import { Check, X, MessageSquare, AlertCircle, MessageCircle, Edit3 } from 'lucide-react';
import flaggingService from '../../../service/flaggingService';

interface ResolveModalProps {
    flagId: number;
    onClose: () => void;
    onSuccess: () => void;
}

type ResolutionType = 'feedback' | 'corrected';

const ResolveModal: React.FC<ResolveModalProps> = ({ flagId, onClose, onSuccess }) => {
    const [resolutionType, setResolutionType] = useState<ResolutionType>('feedback');
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [correctedResponse, setCorrectedResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        // Validation
        if (!feedbackMessage.trim()) {
            setError('Please enter feedback for the student');
            return;
        }
        if (resolutionType === 'corrected' && !correctedResponse.trim()) {
            setError('Please provide the corrected response');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Build structured resolution data as JSON
            const resolutionData = {
                type: resolutionType,
                feedback: feedbackMessage.trim(),
                correctedResponse: resolutionType === 'corrected' ? correctedResponse.trim() : null,
                timestamp: new Date().toISOString()
            };

            // Student notification message
            const studentNotification = resolutionType === 'corrected'
                ? `Your flagged message has been reviewed. Faculty has provided a corrected response.`
                : feedbackMessage.trim();

            await flaggingService.resolveFlag(flagId, {
                knowledgeGapFix: JSON.stringify(resolutionData), // Store as JSON
                studentNotification: studentNotification
            });

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to resolve the report');
            console.error('Error resolving flag:', err);
        } finally {
            setLoading(false);
        }
    };

    const isSubmitDisabled = loading || !feedbackMessage.trim() ||
        (resolutionType === 'corrected' && !correctedResponse.trim());

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-8 py-6 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                                <Check className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Resolve Report</h2>
                                <p className="text-emerald-50 text-sm mt-1">Provide a solution and notify the student</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body - Scrollable */}
                <div className="p-8 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-red-800 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {/* Resolution Type Selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                            How would you like to resolve this?
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setResolutionType('feedback')}
                                disabled={loading}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${resolutionType === 'feedback'
                                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <MessageCircle className={`w-5 h-5 ${resolutionType === 'feedback' ? 'text-emerald-600' : 'text-gray-500'}`} />
                                    <span className={`font-bold ${resolutionType === 'feedback' ? 'text-emerald-700' : 'text-gray-900'}`}>
                                        Feedback Only
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Provide explanation or acknowledge the issue
                                </p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setResolutionType('corrected')}
                                disabled={loading}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${resolutionType === 'corrected'
                                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Edit3 className={`w-5 h-5 ${resolutionType === 'corrected' ? 'text-blue-600' : 'text-gray-500'}`} />
                                    <span className={`font-bold ${resolutionType === 'corrected' ? 'text-blue-700' : 'text-gray-900'}`}>
                                        Provide Corrected Response
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Write what the AI should have responded
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Feedback Input */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-5 h-5 text-emerald-600" />
                            <label className="text-sm font-bold text-gray-900">
                                Feedback for Student
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                        </div>
                        <textarea
                            value={feedbackMessage}
                            onChange={(e) => setFeedbackMessage(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all resize-none text-gray-900 placeholder-gray-400"
                            placeholder="Thank you for reporting! We've noted this issue and reviewed the AI response..."
                            rows={3}
                            disabled={loading}
                        />
                        <div className="flex items-center justify-between px-1 mt-1">
                            <span className="text-xs text-gray-500">This will be sent to the student</span>
                            <span className={`text-xs font-medium ${feedbackMessage.length > 500 ? 'text-orange-600' : 'text-gray-400'}`}>
                                {feedbackMessage.length} / 1000
                            </span>
                        </div>
                    </div>

                    {/* Corrected Response Input - Only show if type is 'corrected' */}
                    {resolutionType === 'corrected' && (
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Edit3 className="w-5 h-5 text-blue-600" />
                                <label className="text-sm font-bold text-gray-900">
                                    Corrected AI Response
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">
                                Write the correct response that the AI should have provided. The student will see this alongside the original flagged message.
                            </p>
                            <textarea
                                value={correctedResponse}
                                onChange={(e) => setCorrectedResponse(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all resize-none text-gray-900 placeholder-gray-400 bg-blue-50/50"
                                placeholder="The correct answer is... [Write the accurate information here]"
                                rows={5}
                                disabled={loading}
                            />
                            <div className="flex items-center justify-end px-1 mt-1">
                                <span className={`text-xs font-medium ${correctedResponse.length > 1500 ? 'text-orange-600' : 'text-gray-400'}`}>
                                    {correctedResponse.length} / 2000
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">ℹ</span>
                        </div>
                        <div className="text-blue-900 text-sm">
                            {resolutionType === 'corrected' ? (
                                <p>
                                    The student will see a <strong>side-by-side comparison</strong> of the original AI response and your corrected version.
                                </p>
                            ) : (
                                <p>
                                    The feedback will be sent as a <strong>notification</strong> to the student.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-gray-50 border-t-2 border-gray-100 flex items-center justify-end gap-3 flex-shrink-0">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                        className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Processing...
                            </>
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Resolve & Send Notification
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResolveModal;
