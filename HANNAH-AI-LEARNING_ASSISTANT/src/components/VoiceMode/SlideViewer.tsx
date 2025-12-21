import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import './SlideViewer.css';

export interface Slide {
    slide_number: number;
    image_url: string;
    content?: string;
}

interface SlideViewerProps {
    slides: Slide[];
    currentIndex?: number;
    onSlideChange?: (index: number) => void;
}

export function SlideViewer({ slides, currentIndex = 0, onSlideChange }: SlideViewerProps) {
    const [activeIndex, setActiveIndex] = useState(currentIndex);
    const [imageError, setImageError] = useState<Record<number, boolean>>({});
    const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});

    if (!slides || slides.length === 0) {
        return null;
    }

    const currentSlide = slides[activeIndex];

    const goToPrevious = () => {
        const newIndex = activeIndex > 0 ? activeIndex - 1 : slides.length - 1;
        setActiveIndex(newIndex);
        onSlideChange?.(newIndex);
    };

    const goToNext = () => {
        const newIndex = activeIndex < slides.length - 1 ? activeIndex + 1 : 0;
        setActiveIndex(newIndex);
        onSlideChange?.(newIndex);
    };

    const handleImageLoad = (index: number) => {
        setImageLoading(prev => ({ ...prev, [index]: false }));
    };

    const handleImageError = (index: number) => {
        setImageError(prev => ({ ...prev, [index]: true }));
        setImageLoading(prev => ({ ...prev, [index]: false }));
    };

    return (
        <div className="slide-viewer">
            {/* Header */}
            <div className="slide-viewer-header">
                <div className="slide-counter">
                    <ImageIcon size={16} />
                    <span>Slide {currentSlide.slide_number}</span>
                    <span className="slide-total">({activeIndex + 1}/{slides.length})</span>
                </div>
            </div>

            {/* Slide Content */}
            <div className="slide-viewer-content">
                {imageError[activeIndex] ? (
                    <div className="slide-error">
                        <ImageIcon size={48} />
                        <span>Không thể tải hình ảnh</span>
                    </div>
                ) : (
                    <>
                        {imageLoading[activeIndex] !== false && (
                            <div className="slide-loading">
                                <div className="slide-loading-spinner" />
                            </div>
                        )}
                        <img
                            src={currentSlide.image_url}
                            alt={`Slide ${currentSlide.slide_number}`}
                            className="slide-image"
                            onLoad={() => handleImageLoad(activeIndex)}
                            onError={() => handleImageError(activeIndex)}
                            style={{ display: imageLoading[activeIndex] === false ? 'block' : 'none' }}
                        />
                    </>
                )}
            </div>

            {/* Navigation */}
            {slides.length > 1 && (
                <div className="slide-viewer-nav">
                    <button
                        className="slide-nav-btn"
                        onClick={goToPrevious}
                        aria-label="Previous slide"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    {/* Dots indicator */}
                    <div className="slide-dots">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                className={`slide-dot ${index === activeIndex ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveIndex(index);
                                    onSlideChange?.(index);
                                }}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>

                    <button
                        className="slide-nav-btn"
                        onClick={goToNext}
                        aria-label="Next slide"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
}
