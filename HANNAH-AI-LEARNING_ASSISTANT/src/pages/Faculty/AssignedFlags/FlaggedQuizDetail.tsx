import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminFlaggedQuizDetail from '../../Admin/FlaggedQuizDetail';
import MessageDetailModal from './MessageDetailModal';
import flaggingService, { type FlaggedItem } from '../../../service/flaggingService';

/**
 * Faculty assigned flags detail - routes to appropriate component based on flag type
 */
const FlaggedQuizDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [flagItem, setFlagItem] = useState<FlaggedItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFlag();
    }, [id]);

    const loadFlag = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const flags = await flaggingService.getAssignedFlags();
            const item = flags.find(f => f.id === parseInt(id));
            setFlagItem(item || null);
        } catch (err) {
            console.error('Error loading flag:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!flagItem) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Không tìm thấy báo cáo</p>
                    <button
                        onClick={() => navigate('/faculty/assigned-flags/quizzes')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    // Message flag → show MessageDetailModal
    if (flagItem.type === 'message') {
        return (
            <MessageDetailModal
                item={flagItem}
                onClose={() => navigate('/faculty/assigned-flags/quizzes')}
                onUpdate={loadFlag}
            />
        );
    }

    // Quiz flag → show admin quiz detail component
    return <AdminFlaggedQuizDetail initialFlagData={flagItem} />;
};

export default FlaggedQuizDetail;
