import React, { useMemo } from 'react'
import { GitBranch, Maximize2, Download, Share2 } from 'lucide-react'
import MindmapViewer from '../../../../components/MindmapViewer'

interface MindmapModalProps {
    isOpen: boolean
    onClose: () => void
    content: any
}

export const MindmapModal: React.FC<MindmapModalProps> = ({ isOpen, onClose, content }) => {
    const mindmapData = useMemo(() => {
        if (!content?.content?.nodes) return { nodes: [], edges: [] };

        return {
            nodes: content.content.nodes,
            edges: content.content.edges || []
        };
    }, [content]);

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="mindmap-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="mindmap-modal-header">
                    <div className="mindmap-modal-title-wrapper">
                        <GitBranch size={20} color="#5f6368" />
                        <h3 className="mindmap-modal-title">{content?.title || 'Bản đồ tư duy'}</h3>
                    </div>
                    <div className="mindmap-modal-actions">
                        <button className="mindmap-action-btn" title="Mở rộng">
                            <Maximize2 size={18} />
                        </button>
                        <button className="mindmap-action-btn" title="Tải xuống">
                            <Download size={18} />
                        </button>
                        <button className="mindmap-action-btn" title="Chia sẻ">
                            <Share2 size={18} />
                        </button>
                        <button
                            className="mindmap-modal-close"
                            onClick={onClose}
                            aria-label="Đóng"
                        >
                            ×
                        </button>
                    </div>
                </div>
                <div className="mindmap-modal-body">
                    {content ? (
                        <MindmapViewer
                            data={mindmapData}
                        />
                    ) : (
                        <div className="mindmap-loading">
                            <p>Đang tải bản đồ tư duy...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
