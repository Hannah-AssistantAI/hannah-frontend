import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import flaggingService, { type FlaggedItem } from '../../../service/flaggingService';
import FlaggedMessageDetail from '../../Admin/FlaggedMessages/FlaggedMessageDetail';
import FlaggedQuizDetail from '../../Admin/FlaggedQuizDetail';
import { AlertCircle } from 'lucide-react';

/**
 * Router component that dynamically loads the correct detail page
 * based on the flag type (message or quiz)
 */
const AssignedFlagDetailRouter: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [flagType, setFlagType] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadFlagType();
    }, [id]);

    const loadFlagType = async () => {
        if (!id) {
            setError('Missing flag ID');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const flag: FlaggedItem = await flaggingService.getFlagById(parseInt(id));
            setFlagType(flag.type);
        } catch (err) {
            console.error('Error loading flag type:', err);
            setError(err instanceof Error ? err.message : 'Failed to load flag details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/40 to-indigo-50/30 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Đang tải chi tiết...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/40 to-indigo-50/30 flex items-center justify-center p-6">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-red-200 max-w-md w-full">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Lỗi</h2>
                    </div>
                    <p className="text-gray-700 mb-6">{error}</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/faculty/assigned-flags')}
                            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-all font-semibold"
                        >
                            Quay lại
                        </button>
                        <button
                            onClick={loadFlagType}
                            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all font-semibold"
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Route to the appropriate detail component based on flag type
    if (flagType === 'message') {
        return <FlaggedMessageDetail />;
    } else if (flagType === 'quiz') {
        return <FlaggedQuizDetail />;
    } else {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/40 to-indigo-50/30 flex items-center justify-center p-6">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-yellow-200 max-w-md w-full text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-6 h-6 text-yellow-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Loại báo cáo không được hỗ trợ</h2>
                    <p className="text-gray-700 mb-6">Loại: {flagType || 'Unknown'}</p>
                    <button
                        onClick={() => navigate('/faculty/assigned-flags')}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all font-semibold"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }
};

export default AssignedFlagDetailRouter;
