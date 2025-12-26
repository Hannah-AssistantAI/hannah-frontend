import React, { useMemo, useState, useRef } from 'react'
import { Maximize2, Minimize2, Download, Plus, Minus, ChevronsUpDown, ChevronsDownUp, BookOpen, Bot, Video, FileText, File, Inbox } from 'lucide-react'
import html2canvas from 'html2canvas'
import MindmapViewer, { type MindmapViewerHandle } from '../../../../components/MindmapViewer'
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
    const viewerRef = useRef<MindmapViewerHandle>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isAllNodesExpanded, setIsAllNodesExpanded] = useState(true); // Initially all nodes are expanded

    const t = getLabels(language)

    const mindmapData = useMemo(() => {
        if (!content?.content?.nodes) return { nodes: [], edges: [] };
        return {
            nodes: content.content.nodes,
            edges: content.content.edges || []
        };
    }, [content]);

    const sourceCount = mindmapData.nodes?.length || 0;

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

    const handleFeedback = (type: 'positive' | 'negative') => {
        console.log('Feedback:', type);
    };

    const handleDownload = async () => {
        const container = document.querySelector('.mindmap-viewer-container') as HTMLElement;
        const svgElement = container?.querySelector('svg') as SVGSVGElement;
        const transformGroup = svgElement?.querySelector('g') as SVGGElement;

        if (!container || !svgElement || !transformGroup) {
            console.error('Elements not found');
            return;
        }

        // Ẩn các buttons trước khi chụp
        const feedbackButtons = container.querySelector('.mindmap-feedback-buttons') as HTMLElement;
        const zoomControls = container.querySelector('.mindmap-zoom-controls') as HTMLElement;
        if (feedbackButtons) feedbackButtons.style.display = 'none';
        if (zoomControls) zoomControls.style.display = 'none';

        // Lưu transform gốc
        const originalTransform = transformGroup.getAttribute('transform') || '';

        // Lấy bounding box của tất cả nội dung
        const bbox = transformGroup.getBBox();
        const padding = 50;

        // Tính kích thước cần thiết
        const fullWidth = Math.max(bbox.width + padding * 2, 800);
        const fullHeight = Math.max(bbox.height + padding * 2, 600);

        // Lưu trạng thái gốc
        const originalContainerStyle = container.style.cssText;
        const originalSvgWidth = svgElement.getAttribute('width');
        const originalSvgHeight = svgElement.getAttribute('height');

        // Đặt transform để content căn giữa với padding
        transformGroup.setAttribute('transform', `translate(${padding - bbox.x}, ${padding - bbox.y})`);

        // Mở rộng container và SVG
        container.style.width = `${fullWidth}px`;
        container.style.height = `${fullHeight}px`;
        container.style.overflow = 'visible';
        container.style.position = 'absolute';
        container.style.left = '-9999px';

        svgElement.setAttribute('width', String(fullWidth));
        svgElement.setAttribute('height', String(fullHeight));

        try {
            await new Promise(resolve => setTimeout(resolve, 150));

            const canvas = await html2canvas(container, {
                backgroundColor: '#2A2A2A',
                scale: 2,
                useCORS: true,
                logging: false,
                width: fullWidth,
                height: fullHeight,
            });

            const pngUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = pngUrl;
            link.download = `${content?.title || 'mindmap'}.png`;
            link.click();
        } catch (error) {
            console.error('Error capturing mindmap:', error);
        } finally {
            // Khôi phục trạng thái gốc
            container.style.cssText = originalContainerStyle;
            if (originalSvgWidth) svgElement.setAttribute('width', originalSvgWidth);
            else svgElement.removeAttribute('width');
            if (originalSvgHeight) svgElement.setAttribute('height', originalSvgHeight);
            else svgElement.removeAttribute('height');
            svgElement.style.width = '100%';
            svgElement.style.height = '100%';
            transformGroup.setAttribute('transform', originalTransform);

            // Hiện lại các buttons
            if (feedbackButtons) feedbackButtons.style.display = '';
            if (zoomControls) zoomControls.style.display = '';
        }
    };

    if (!isOpen) return null

    return (
        <div className={`modal-overlay ${isExpanded ? 'fullscreen-overlay' : ''}`} onClick={onClose}>
            <div className={`mindmap-modal-content ${isExpanded ? 'fullscreen' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="mindmap-modal-header">
                    <div className="mindmap-modal-title-section">
                        <h3 className="mindmap-modal-title">{content?.title || t.mindMap}</h3>
                    </div>
                    <div className="mindmap-modal-actions">
                        <button
                            className="mindmap-action-btn"
                            onClick={() => setIsExpanded(!isExpanded)}
                            title={isExpanded ? (language === 'en' ? 'Minimize' : 'Thu nhỏ') : (language === 'en' ? 'Expand' : 'Mở rộng')}
                        >
                            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>
                        <button className="mindmap-action-btn" onClick={handleDownload} title={language === 'en' ? 'Download PNG' : 'Tải PNG'}>
                            <Download size={18} />
                        </button>
                    </div>
                </div>

                <div className="mindmap-modal-body">
                    <div className="mindmap-viewer-container">
                        {content ? (
                            <MindmapViewer ref={viewerRef} data={mindmapData} onNodeClick={handleNodeClick} />
                        ) : (
                            <div className="mindmap-loading">
                                <p>{t.loading}</p>
                            </div>
                        )}

                        <div className="mindmap-zoom-controls">
                            <button
                                className="mindmap-zoom-btn"
                                onClick={() => {
                                    const newState = viewerRef.current?.toggleExpandAll();
                                    if (newState !== undefined) {
                                        setIsAllNodesExpanded(newState);
                                    }
                                }}
                                title={isAllNodesExpanded ? (language === 'en' ? 'Collapse All' : 'Đóng tất cả') : (language === 'en' ? 'Expand All' : 'Mở tất cả')}
                            >
                                {isAllNodesExpanded ? <ChevronsDownUp size={18} /> : <ChevronsUpDown size={18} />}
                            </button>
                            <button
                                className="mindmap-zoom-btn"
                                onClick={() => viewerRef.current?.zoomIn()}
                                title="Zoom In"
                            >
                                <Plus size={18} />
                            </button>
                            <button
                                className="mindmap-zoom-btn"
                                onClick={() => viewerRef.current?.zoomOut()}
                                title="Zoom Out"
                            >
                                <Minus size={18} />
                            </button>
                        </div>
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
                                        <BookOpen size={16} /> {t.resources}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('ai-tutor')}
                                        className={`mindmap-tab-btn ${activeTab === 'ai-tutor' ? 'active-ai' : 'inactive'}`}
                                    >
                                        <Bot size={16} /> {t.aiTutor}
                                    </button>
                                </div>
                            </div>
                            <div className="mindmap-content-wrapper">
                                {activeTab === 'resources' ? (
                                    <div className="mindmap-content-scroll">
                                        {isLoadingDetails ? (
                                            <div className="mindmap-loading-container"><div className="mindmap-spinner"></div></div>
                                        ) : nodeDetails ? (
                                            <>
                                                <div className="mindmap-description-box">
                                                    <p className="mindmap-description-text">{nodeDetails.description}</p>
                                                </div>
                                                {nodeDetails.resources && nodeDetails.resources.length > 0 && (
                                                    <>
                                                        <h4 className="mindmap-resources-title">
                                                            <span className="mindmap-title-accent"></span>
                                                            Tài nguyên liên quan
                                                        </h4>
                                                        <div className="mindmap-resources-list">
                                                            {nodeDetails.resources.map((resource, idx) => (
                                                                <a key={idx} href={resource.url} target="_blank" rel="noopener noreferrer" className="mindmap-resource-card">
                                                                    <div className="mindmap-resource-icon">{resource.type === 'video' ? <Video size={16} /> : resource.type === 'article' ? <FileText size={16} /> : <File size={16} />}</div>
                                                                    <div className="mindmap-resource-content">
                                                                        <div className="mindmap-resource-title">{resource.title}</div>
                                                                        <div className="mindmap-resource-meta">{resource.type}</div>
                                                                    </div>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <div className="mindmap-empty-state">
                                                <div className="mindmap-empty-icon"><Inbox size={32} style={{ color: '#9ca3af' }} /></div>
                                                <p className="mindmap-empty-text">Không có tài nguyên</p>
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
