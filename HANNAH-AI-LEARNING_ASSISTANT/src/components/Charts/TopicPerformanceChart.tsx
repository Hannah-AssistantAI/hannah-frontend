import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

interface TopicPerformanceData {
    topic: string;
    averageScore: number;
    passRate: number;
    totalAttempts: number;
}

interface TopicPerformanceChartProps {
    data: TopicPerformanceData[];
}

const TopicPerformanceChart: React.FC<TopicPerformanceChartProps> = ({ data }) => {
    // Color coding based on performance
    const getColor = (score: number) => {
        if (score >= 80) return '#10b981'; // green
        if (score >= 60) return '#f59e0b'; // orange
        return '#ef4444'; // red
    };

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
                    <p className="font-semibold text-slate-800 mb-2">{payload[0].payload.topic}</p>
                    <div className="space-y-1 text-sm">
                        <p className="text-blue-600">
                            Average Score: <span className="font-bold">{payload[0].value.toFixed(1)}%</span>
                        </p>
                        <p className="text-green-600">
                            Pass Rate: <span className="font-bold">{payload[1].value.toFixed(1)}%</span>
                        </p>
                        <p className="text-slate-600">
                            Total Attempts: <span className="font-bold">{payload[0].payload.totalAttempts}</span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-500">
                <div className="text-center">
                    <p className="text-lg font-medium mb-2">No topic data available</p>
                    <p className="text-sm">Topics will appear here once quizzes with topic information are generated</p>
                </div>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={450}>
            <BarChart
                data={data}
                margin={{ top: 40, right: 30, left: 60, bottom: 60 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

                {/* X-Axis: Topics - Horizontal labels */}
                <XAxis
                    dataKey="topic"
                    angle={0}
                    textAnchor="middle"
                    height={60}
                    tick={{ fill: '#475569', fontSize: 14, fontWeight: 600 }}
                    label={{
                        value: 'Subject',
                        position: 'insideBottom',
                        offset: -10,
                        style: { fill: '#1e293b', fontWeight: 700, fontSize: 15 }
                    }}
                />

                {/* Y-Axis: Percentage */}
                <YAxis
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    label={{
                        value: 'Score (%)',
                        angle: -90,
                        position: 'insideLeft',
                        offset: -10,
                        style: { fill: '#1e293b', fontWeight: 700, fontSize: 15 }
                    }}
                />

                <Tooltip content={<CustomTooltip />} />


                {/* Average Score Bar - Dynamic color based on performance */}
                <Bar
                    dataKey="averageScore"
                    name="Average Score (%)"
                    radius={[8, 8, 0, 0]}
                    label={{
                        position: 'top',
                        content: (props: any) => {
                            const { x, y, width, value } = props;
                            return (
                                <text
                                    x={x + width / 2}
                                    y={y - 8}
                                    fill="#64748b"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fontWeight="600"
                                >
                                    {value.toFixed(1)}%
                                </text>
                            );
                        }
                    }}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getColor(entry.averageScore)} />
                    ))}
                </Bar>

                {/* Pass Rate Bar - Blue */}
                <Bar
                    dataKey="passRate"
                    name="Pass Rate (%)"
                    fill="#3b82f6"
                    radius={[8, 8, 0, 0]}
                    label={{
                        position: 'top',
                        content: (props: any) => {
                            const { x, y, width, value } = props;
                            return (
                                <text
                                    x={x + width / 2}
                                    y={y - 8}
                                    fill="#64748b"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fontWeight="600"
                                >
                                    {value.toFixed(1)}%
                                </text>
                            );
                        }
                    }}
                />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default TopicPerformanceChart;
