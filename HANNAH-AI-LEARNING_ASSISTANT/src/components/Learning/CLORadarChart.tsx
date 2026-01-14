import React from 'react';
import type { CLOProgress } from '../../service/learningDashboardService';
import './CLORadarChart.css';

interface CLORadarChartProps {
    clos: CLOProgress[];
    size?: number;
}

/**
 * Pure SVG Radar Chart for CLO Progress visualization
 * No external dependencies - senior-level implementation
 */
const CLORadarChart: React.FC<CLORadarChartProps> = ({ clos, size = 280 }) => {
    if (!clos || clos.length === 0) {
        return (
            <div className="clo-radar-chart clo-radar-chart--empty">
                <p>Chưa có dữ liệu CLO</p>
            </div>
        );
    }

    const center = size / 2;
    const maxRadius = (size / 2) - 40; // Padding for labels
    const angleStep = (2 * Math.PI) / clos.length;
    const levels = [25, 50, 75, 100]; // Grid levels

    // Calculate point positions for each CLO
    const points = clos.map((clo, index) => {
        const angle = (index * angleStep) - (Math.PI / 2); // Start from top
        const radius = (clo.progressPercentage / 100) * maxRadius;
        return {
            x: center + radius * Math.cos(angle),
            y: center + radius * Math.sin(angle),
            labelX: center + (maxRadius + 25) * Math.cos(angle),
            labelY: center + (maxRadius + 25) * Math.sin(angle),
            clo,
            angle
        };
    });

    // Create polygon path
    const polygonPath = points.map((p, i) =>
        `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ') + ' Z';

    // Get color based on progress
    const getProgressColor = (percentage: number): string => {
        if (percentage >= 80) return '#22c55e'; // Green
        if (percentage >= 50) return '#eab308'; // Yellow
        if (percentage >= 20) return '#f97316'; // Orange
        return '#ef4444'; // Red
    };

    // Calculate overall average
    const avgProgress = clos.reduce((acc, c) => acc + c.progressPercentage, 0) / clos.length;

    return (
        <div className="clo-radar-chart">
            <div className="clo-radar-chart__header">
                <h3 className="clo-radar-chart__title">📊 Tiến độ CLO</h3>
                <span
                    className="clo-radar-chart__average"
                    style={{ color: getProgressColor(avgProgress) }}
                >
                    Trung bình: {avgProgress.toFixed(0)}%
                </span>
            </div>

            <svg
                viewBox={`0 0 ${size} ${size}`}
                className="clo-radar-chart__svg"
                style={{ width: size, height: size }}
            >
                {/* Grid circles */}
                {levels.map(level => {
                    const r = (level / 100) * maxRadius;
                    return (
                        <circle
                            key={level}
                            cx={center}
                            cy={center}
                            r={r}
                            className="clo-radar-chart__grid-circle"
                        />
                    );
                })}

                {/* Grid lines (spokes) */}
                {points.map((p, i) => (
                    <line
                        key={i}
                        x1={center}
                        y1={center}
                        x2={center + maxRadius * Math.cos(p.angle)}
                        y2={center + maxRadius * Math.sin(p.angle)}
                        className="clo-radar-chart__grid-line"
                    />
                ))}

                {/* Filled polygon */}
                <path
                    d={polygonPath}
                    className="clo-radar-chart__polygon"
                    fill="rgba(59, 130, 246, 0.25)"
                    stroke="rgba(59, 130, 246, 0.8)"
                    strokeWidth="2"
                />

                {/* Data points */}
                {points.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="5"
                        className="clo-radar-chart__point"
                        fill={getProgressColor(p.clo.progressPercentage)}
                    />
                ))}

                {/* Labels */}
                {points.map((p, i) => {
                    const isTop = p.labelY < center;
                    const isLeft = p.labelX < center;
                    return (
                        <text
                            key={i}
                            x={p.labelX}
                            y={p.labelY}
                            className="clo-radar-chart__label"
                            textAnchor={isLeft ? 'end' : p.labelX === center ? 'middle' : 'start'}
                            dominantBaseline={isTop ? 'auto' : 'hanging'}
                        >
                            <tspan className="clo-radar-chart__label-name">
                                {p.clo.cloName}
                            </tspan>
                            <tspan
                                className="clo-radar-chart__label-value"
                                dx="4"
                                fill={getProgressColor(p.clo.progressPercentage)}
                            >
                                {p.clo.progressPercentage.toFixed(0)}%
                            </tspan>
                        </text>
                    );
                })}
            </svg>

            {/* Legend */}
            <div className="clo-radar-chart__legend">
                <span className="clo-radar-chart__legend-item clo-radar-chart__legend-item--high">● ≥80%</span>
                <span className="clo-radar-chart__legend-item clo-radar-chart__legend-item--medium">● ≥50%</span>
                <span className="clo-radar-chart__legend-item clo-radar-chart__legend-item--low">● ≥20%</span>
                <span className="clo-radar-chart__legend-item clo-radar-chart__legend-item--none">● &lt;20%</span>
            </div>
        </div>
    );
};

export default CLORadarChart;
