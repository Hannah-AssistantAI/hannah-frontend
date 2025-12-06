import React, { useCallback } from 'react';
import './ResizeDivider.css';

interface ResizeDividerProps {
    onDrag: (deltaX: number) => void;
    position: 'left' | 'right';
}

export const ResizeDivider: React.FC<ResizeDividerProps> = ({ onDrag, position }) => {
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            onDrag(deltaX);
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [onDrag]);

    return (
        <div
            className={`resize-divider resize-divider-${position}`}
            onMouseDown={handleMouseDown}
        >
            <div className="resize-divider-handle" />
        </div>
    );
};

export default ResizeDivider;
