import React from 'react';

interface KnowledgeGap {
    topic: string;
    averageScore: number;
    totalAttempts: number;
    failRate: number;
}

interface KnowledgeGapHeatmapProps {
    gaps: KnowledgeGap[];
    threshold?: number;
}

const KnowledgeGapHeatmap: React.FC<KnowledgeGapHeatmapProps> = ({ gaps, threshold = 60 }) => {
    // Filter gaps below threshold and sort by score (lowest first)
    const filteredGaps = gaps
        .filter(g => g.averageScore < threshold)
        .sort((a, b) => a.averageScore - b.averageScore);

    const getColorClass = (score: number) => {
        if (score < 40) return 'from-red-600 to-red-500';
        if (score < 50) return 'from-red-500 to-orange-500';
        return 'from-orange-500 to-yellow-500';
    };

    const getTextColor = (score: number) => {
        if (score < 40) return 'text-red-600';
        if (score < 50) return 'text-orange-600';
        return 'text-yellow-600';
    };

    if (filteredGaps.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-slate-500">
                <div className="text-center">
                    <div className="text-4xl mb-3">🎉</div>
                    <p className="text-lg font-medium mb-1">No significant knowledge gaps detected!</p>
                    <p className="text-sm">All topics have scores above {threshold}%</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {filteredGaps.map((gap, index) => (
                <div key={gap.topic} className="relative">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold text-sm">
                                {index + 1}
                            </span>
                            <div>
                                <span className="font-semibold text-slate-800">{gap.topic}</span>
                                <p className="text-xs text-slate-500">{gap.totalAttempts} attempts • {gap.failRate.toFixed(1)}% fail rate</p>
                            </div>
                        </div>
                        <div className={`text-2xl font-bold ${getTextColor(gap.averageScore)}`}>
                            {gap.averageScore.toFixed(1)}%
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="relative w-full bg-slate-200 rounded-full h-5 overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r ${getColorClass(gap.averageScore)} transition-all duration-500 flex items-center justify-end pr-2`}
                            style={{ width: `${gap.averageScore}%` }}
                        >
                            {gap.averageScore > 15 && (
                                <span className="text-white text-xs font-medium">
                                    {gap.averageScore.toFixed(0)}%
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default KnowledgeGapHeatmap;
