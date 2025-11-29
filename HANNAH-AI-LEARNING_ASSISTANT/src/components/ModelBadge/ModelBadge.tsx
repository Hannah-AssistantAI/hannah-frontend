import React from 'react';
import './ModelBadge.css';

interface ModelBadgeProps {
    modelUsed?: string;
}

const MODEL_ICONS: Record<string, string> = {
    'gemini-flash': '⚡',
    'gemini-1.5-flash': '⚡',
    'claude-sonnet': '🧠',
    'claude-sonnet-4.5': '🧠',
    'gemini-pro': '💎',
    'gemini-1.5-pro': '💎'
};

const MODEL_NAMES: Record<string, string> = {
    'gemini-flash': 'Gemini Flash',
    'gemini-1.5-flash': 'Gemini Flash',
    'claude-sonnet': 'Claude Sonnet',
    'claude-sonnet-4.5': 'Claude Sonnet',
    'gemini-pro': 'Gemini Pro',
    'gemini-1.5-pro': 'Gemini Pro'
};

export const ModelBadge: React.FC<ModelBadgeProps> = ({ modelUsed }) => {
    if (!modelUsed) return null;

    const icon = MODEL_ICONS[modelUsed] || '🤖';
    const name = MODEL_NAMES[modelUsed] || modelUsed;

    return (
        <span className="model-badge" title={`AI Model: ${name}`}>
            {icon} {name}
        </span>
    );
};

export default ModelBadge;
