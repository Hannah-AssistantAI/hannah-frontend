import React, { useMemo, useState } from 'react'
import { GitBranch, Maximize2, Download, Share2 } from 'lucide-react'
import MindmapViewer from '../../../../components/MindmapViewer'
import studioService, { type GetMindMapNodeDetailsResponse } from '../../../../service/studioService'
import { MindmapChatPanel } from './MindmapChatPanel'
import { getLabels, type SupportedLanguage } from '../../../../utils/translations'
import './MindmapModal.css'

interface MindmapModalProps {
    isOpen: boolean
    onClose: () => void
    content: any
    language?: SupportedLanguage | string | null
}

export const MindmapModal: React.FC<MindmapModalProps> = ({ isOpen, onClose, content, language = 'vi' }) => {
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [nodeDetails, setNodeDetails] = useState<GetMindMapNodeDetailsResponse | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [activeTab, setActiveTab] = useState<'resources' | 'ai-tutor'>('resources');

    // Get labels based on detected language
    const t = getLabels(language)

    const mindmapData = useMemo(() => {
        if (!content?.content?.nodes) return { nodes: [], edges: [] };
        return {
            nodes: content.content.nodes,
            edges: content.content.edges || []
        };
    }, [content]);

    const handleNodeClick = async (nodeData: any) => {
        const nodeLabel = nodeData.label;
        if (selectedNode === nodeLabel) return;
        setSelectedNode(nodeLabel);
        setActiveTab('resources');
        if (nodeData.description) {
            setNodeDetails({
                nodeLabel: nodeLabel,
                description: nodeData.description,
                resources: []
            });
            setIsLoadingDetails(false);
        } else {
            setNodeDetails(null);
            setIsLoadingDetails(true);
        }
        try {
            const response = await studioService.getMindMapNodeDetails({
                conversationId: content.conversationId || 0,
                nodeLabel: nodeLabel,
                mindmapContext: content.topic
            });
            if (response && response.data) {
                const responseData = (response.data as any).data || response.data;
                setNodeDetails({
                    ...responseData,
                    description: responseData.description || nodeData.description || "No description available."
                });
            }
        } catch (error) {
            console.error("Failed to fetch node details:", error);
            if (!nodeData.description) {
                setIsLoadingDetails(false);
            }
        } finally {
            setIsLoadingDetails(false);
        }
    };

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="mindmap-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="mindmap-modal-header">
                    <div className="mindmap-modal-title-wrapper">
                        <GitBranch size={20} color="#5f6368" />
                        <h3 className="mindmap-modal-title">{content?.title || t.mindMap}</h3>
                    </div>
                    <div className="mindmap-modal-actions">
                        <button className="mindmap-action-btn" title={language === 'en' ? 'Expand' : 'Mở rộng'}>
                            <Maximize2 size={18} />
                        </button>
                        <button className="mindmap-action-btn" title={language === 'en' ? 'Download' : 'Tải xuống'}>
                            <Download size={18} />
                        </button>
                        <button className="mindmap-action-btn" title={language === 'en' ? 'Share' : 'Chia sẻ'}>
                            <Share2 size={18} />
                        </button>
                        <button className="mindmap-modal-close" onClick={onClose} aria-label={language === 'en' ? 'Close' : 'Đóng'}>
                            ×
                        </button>
                    </div>
                </div>
                <div className="mindmap-modal-body" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        {content ? (
                            <MindmapViewer data={mindmapData} onNodeClick={handleNodeClick} />
                        ) : (
                            <div className="mindmap-loading">
                                <p>{t.loading}</p>
                            </div>
                        )}
                    </div>
                    {selectedNode && (
                        <div className="mindmap-details-modern">
                            <div className="mindmap-header-gradient">
                                <div className="mindmap-header-top">
                                    <h3 className="mindmap-node-title">{selectedNode}</h3>
                                    <button className="mindmap-close-btn" onClick={() => setSelectedNode(null)}></button>
                                </div>
                                <div className="mindmap-tabs-container">
                                    <button
                                        onClick={() => setActiveTab('resources')}
                                        className={`mindmap-tab-btn ${activeTab === 'resources' ? 'active-resources' : 'inactive'}`}
                                    >
                                        📚 {t.resources}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('ai-tutor')}
                                        className={`mindmap-tab-btn ${activeTab === 'ai-tutor' ? 'active-ai' : 'inactive'}`}
                                    >
                                        🤖 {t.aiTutor}
                                    </button>
                                </div>
                            </div>
                            <div className="mindmap-content-wrapper">
                                {activeTab === 'resources' ? (
                                    <div className="mindmap-content-scroll">
                                        {isLoadingDetails ? (
                                            <div className="mindmap-loading-container">
                                                <div className="mindmap-spinner"></div>
                                            </div>
                                        ) : nodeDetails ? (
                                            <div>
                                                <div className="mindmap-description-box">
                                                    <p className="mindmap-description-text">
                                                        {nodeDetails.description}
                                                    </p>
                                                </div>
                                                {nodeDetails.resources && nodeDetails.resources.length > 0 && (
                                                    <div>
                                                        <h4 className="mindmap-resources-title">
                                                            <span className="mindmap-title-accent"></span>
                                                            {language === 'en' ? 'References' : 'Tài liệu tham khảo'}
                                                        </h4>
                                                        <div className="mindmap-resources-list">
                                                            {nodeDetails.resources.map((resource, index) => (
                                                                <a
                                                                    key={index}
                                                                    href={resource.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="mindmap-resource-card"
                                                                >
                                                                    <div className="mindmap-resource-icon">
                                                                        {resource.type === 'video' ? '▶' : resource.type === 'article' ? '📄' : '🔗'}
                                                                    </div>
                                                                    <div className="mindmap-resource-content">
                                                                        <div className="mindmap-resource-title">
                                                                            {resource.title}
                                                                        </div>
                                                                        <div className="mindmap-resource-meta">
                                                                            <span className="mindmap-meta-dot"></span>
                                                                            {resource.type}
                                                                        </div>
                                                                    </div>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="mindmap-empty-state">
                                                <div className="mindmap-empty-icon">📭</div>
                                                <p className="mindmap-empty-text">
                                                    {language === 'en' ? 'No details available.' : 'Không có thông tin chi tiết.'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <MindmapChatPanel
                                        selectedNode={selectedNode}
                                        conversationId={content?.conversationId || 0}
                                        mindmapTopic={content?.topic || ''}
                                        language={language}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
