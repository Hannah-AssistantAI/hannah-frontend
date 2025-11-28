import React from 'react';
import { X } from 'lucide-react';
import type { YoutubeResource } from '../../types';

interface YouTubeModalProps {
    isOpen: boolean;
    onClose: () => void;
    video: YoutubeResource | null;
}

export const YouTubeModal: React.FC<YouTubeModalProps> = ({ isOpen, onClose, video }) => {
    if (!isOpen || !video) return null;

    // Extract video ID from YouTube URL
    const getVideoId = (url: string) => {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
        return match ? match[1] : null;
    };

    const videoId = getVideoId(video.url);

    return (
        <div className="youtube-modal-overlay" onClick={onClose}>
            <div className="youtube-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="youtube-modal-close" onClick={onClose} aria-label="Close">
                    <X size={24} />
                </button>

                <div className="youtube-modal-header">
                    <h2 className="youtube-modal-title">{video.title}</h2>
                    {video.channel && (
                        <p className="youtube-modal-channel">{video.channel}</p>
                    )}
                </div>

                <div className="youtube-modal-video">
                    {videoId ? (
                        <iframe
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                            title={video.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="youtube-modal-iframe"
                        />
                    ) : (
                        <div className="youtube-modal-error">
                            <p>Không thể tải video này</p>
                            <a href={video.url} target="_blank" rel="noopener noreferrer">
                                Mở trên YouTube
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
