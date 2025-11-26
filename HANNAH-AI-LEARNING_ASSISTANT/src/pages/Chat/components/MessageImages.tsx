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

    return (
        <>
            <div className="message-images">
                <div className="message-images-header">
                    <ImageIcon size={16} />
                    <span className="message-images-label">Hình ảnh liên quan</span>
                    <span className="message-images-count">({images.length})</span>
                </div>

                <div className={`message-images-grid ${images.length === 1 ? 'single' : images.length === 2 ? 'double' : ''}`}>
                    {images.map((image, index) => (
                        <div key={index} className="message-image-item">
                            <div className="message-image-wrapper" onClick={() => handleImageClick(image.url)}>
                                <img
                                    src={image.url}
                                    alt={image.source}
                                    className="message-image"
                                    loading="lazy"
                                />
                                <div className="message-image-overlay">
                                    <Maximize2 size={20} />
                                </div>
                            </div>
                            <p className="message-image-source">{image.source}</p>
                        </div>
                    ))}
                </div>
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
