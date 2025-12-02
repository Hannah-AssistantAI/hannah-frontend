import { useState } from 'react'
import { Image as ImageIcon, Maximize2 } from 'lucide-react'
import type { ImageMetadata } from '../types'
import './MessageImages.css'

interface MessageImagesProps {
    images: ImageMetadata[]
}

export function MessageImages({ images }: MessageImagesProps) {
    const [expandedImage, setExpandedImage] = useState<string | null>(null)

    if (!images || images.length === 0) {
        return null
    }

    const handleImageClick = (url: string) => {
        setExpandedImage(url)
    }

    const handleCloseExpanded = () => {
        setExpandedImage(null)
    }

    const fullPageImages = images.filter(img => img.is_full_page);
    const regularImages = images.filter(img => !img.is_full_page);

    console.log('🖼️ MessageImages Debug:', {
        total: images.length,
        fullPageCount: fullPageImages.length,
        regularCount: regularImages.length,
        allImages: images
    });

    return (
        <>
            <div className="message-images">
                <div className="message-images-header">
                    <ImageIcon size={16} />
                    <span className="message-images-label">Hình ảnh liên quan</span>
                    <span className="message-images-count">({images.length})</span>
                </div>

                {/* Full Page Slides Section */}
                {fullPageImages.length > 0 && (
                    <div className="full-page-slides">
                        {fullPageImages.map((image, index) => (
                            <div key={`full-${index}`} className="full-slide-item">
                                <div className="full-slide-wrapper" onClick={() => handleImageClick(image.url)}>
                                    <img
                                        src={image.url}
                                        alt={image.source}
                                        className="full-slide-image"
                                        loading="lazy"
                                    />
                                    <div className="full-slide-overlay">
                                        <Maximize2 size={24} />
                                        <span className="full-slide-label">Click to view full slide</span>
                                    </div>
                                    <div className="full-slide-badge">Full Slide</div>
                                </div>
                                <p className="message-image-source">{image.source}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Expanded Image Modal */}
            {expandedImage && (
                <div className="image-modal" onClick={handleCloseExpanded}>
                    <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <img src={expandedImage} alt="Expanded view" className="image-modal-img" />
                        <button className="image-modal-close" onClick={handleCloseExpanded}>
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
