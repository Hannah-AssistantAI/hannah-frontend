import React from 'react';
import './ModelSelector.css';

interface ModelOption {
    id: string;
    name: string;
    displayName: string;
    description: string;
    icon: string;
}

interface ModelSelectorProps {
    value: string;
    onChange: (modelId: string) => void;
    disabled?: boolean;
}

const AVAILABLE_MODELS: ModelOption[] = [
    {
        id: 'auto',
        name: 'Auto (Smart Routing)',
        displayName: '🤖 Auto',
        description: 'Let AI choose the best model based on your question',
        icon: '🤖'
    },
    {
        id: 'gemini-flash',
        name: 'Gemini 1.5 Flash',
        displayName: '⚡ Gemini Flash',
        description: 'Fast & free - Best for simple questions',
        icon: '⚡'
    },
    {
        id: 'claude-sonnet',
        name: 'Claude Sonnet 4.5',
        displayName: '🧠 Claude Sonnet',
        description: 'Advanced reasoning - Best for complex topics',
        icon: '🧠'
    }
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({
    value,
    onChange,
    disabled = false
}) => {
    const selectedModel = AVAILABLE_MODELS.find(m => m.id === value) || AVAILABLE_MODELS[0];

    return (
        <div className="model-selector">
            <label className="model-selector__label">AI Model:</label>
            <select
                className="model-selector__dropdown"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                title={selectedModel.description}
            >
                {AVAILABLE_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                        {model.displayName}
                    </option>
                ))}
            </select>
            <span className="model-selector__hint">{selectedModel.description}</span>
        </div>
    );
};

export default ModelSelector;
