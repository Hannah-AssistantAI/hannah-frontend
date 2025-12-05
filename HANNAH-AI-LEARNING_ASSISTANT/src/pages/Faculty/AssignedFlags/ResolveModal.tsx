import React, { useState } from 'react';
import { Check, X, MessageSquare, AlertCircle } from 'lucide-react';
import flaggingService from '../../../service/flaggingService';

interface ResolveModalProps {
    flagId: number;
    onClose: () => void;
    onSuccess: () => void;
}

const ResolveModal: React.FC<ResolveModalProps> = ({ flagId, onClose, onSuccess }) => {
    const [resolutionMessage, setResolutionMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!resolutionMessage.trim()) {
            setError('Please enter a solution and notification for the student');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await flaggingService.resolveFlag(flagId, {
                knowledgeGapFix: resolutionMessage.trim(),
                studentNotification: resolutionMessage.trim()
            });

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to resolve the report');
            console.error('Error resolving flag:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-8 py-6">
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

                {/* Body */}
                <div className="p-8">
                    {error && (
                        <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-red-800 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-3">
                            <MessageSquare className="w-5 h-5 text-emerald-600" />
                            <label className="text-base font-bold text-gray-900">
                                Solution & Notification for Student
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                        </div>

                        <textarea
                            value={resolutionMessage}
                            onChange={(e) => setResolutionMessage(e.target.value)}
                            className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all resize-none text-gray-900 placeholder-gray-400 font-medium"
                            placeholder="Thank you for your report! I have added more materials on this topic. You can refer to the Resources section..."
                            rows={6}
                            disabled={loading}
                        />

                        <div className="space-y-2">
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start gap-3">
                                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xs font-bold">ℹ</span>
                                </div>
                                <p className="text-blue-900 text-sm">
                                    This message will be saved as an <strong>internal note</strong> AND <strong>sent directly</strong> to the student via notification
                                </p>
                            </div>

                            <div className="flex items-center justify-between px-2">
                                <span className="text-xs text-gray-500 font-medium">Minimum 10 characters</span>
                                <span
                                    className={`text-xs font-bold ${resolutionMessage.length > 500
                                        ? 'text-orange-600'
                                        : resolutionMessage.length > 800
                                            ? 'text-red-600'
                                            : 'text-gray-500'
                                        }`}
                                >
                                    {resolutionMessage.length} / 1000
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-gray-50 border-t-2 border-gray-100 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !resolutionMessage.trim()}
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
