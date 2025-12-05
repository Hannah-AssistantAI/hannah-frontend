import { useState } from 'react'
import { Image as ImageIcon, Maximize2, ChevronDown, ChevronUp } from 'lucide-react'
import type { ImageMetadata } from '../types'
import { getLabels, type SupportedLanguage } from '../../../utils/translations'
import './MessageImages.css'

interface MessageImagesProps {
    images: ImageMetadata[]
    language?: SupportedLanguage | string | null
}

const INITIAL_SLIDES_TO_SHOW = 3;

export function MessageImages({ images, language = 'vi' }: MessageImagesProps) {
    const [expandedImage, setExpandedImage] = useState<string | null>(null)
    const [isExpanded, setIsExpanded] = useState(false)

    // Get labels based on detected language
    const t = getLabels(language)

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

    // Determine which slides to display
    const hasMoreSlides = fullPageImages.length > INITIAL_SLIDES_TO_SHOW;
    const displayedSlides = isExpanded
        ? fullPageImages
        : fullPageImages.slice(0, INITIAL_SLIDES_TO_SHOW);
    const hiddenSlidesCount = fullPageImages.length - INITIAL_SLIDES_TO_SHOW;

    console.log('🖼️ MessageImages Debug:', {
        total: images.length,
        fullPageCount: fullPageImages.length,
        regularCount: regularImages.length,
        allImages: images,
        firstImage: images[0],
        firstImageHasFlag: images[0]?.is_full_page
    });

    return (
        <>
            <div className="message-images">
                <div className="message-images-header">
                    <ImageIcon size={16} />
                    <span className="message-images-label">{t.relatedImages}</span>
                    <span className="message-images-count">({images.length})</span>
                </div>

                {/* Full Page Slides Section - ONLY show if is_full_page: true */}
                {fullPageImages.length > 0 && (
                    <>
                        <div className="full-page-slides">
                            {displayedSlides.map((image, index) => (
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
                                            <span className="full-slide-label">{t.clickToView}</span>
                                        </div>
                                        <div className="full-slide-badge">{t.slide} {index + 1}</div>
                                    </div>
                                    <p className="message-image-source">{image.source}</p>
                                </div>
                            ))}
                        </div>

                        {/* Expand/Collapse Button */}
                        {hasMoreSlides && (
                            <button
                                className="slides-expand-button"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? (
                                    <>
                                        <ChevronUp size={18} />
                                        <span>{t.collapse}</span>
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown size={18} />
                                        <span>{t.showMoreSlides(hiddenSlidesCount)}</span>
                                    </>
                                )}
                            </button>
                        )}
                    </>
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
