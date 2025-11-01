
interface TrendChartProps {
  data: {
    date: string;
    count: number;
    topQuestion: string;
  }[];
}

const TrendChart = ({ data }: TrendChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '80px 40px',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: '12px',
        color: '#8c8c8c'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <div style={{ fontSize: '16px', fontWeight: '500' }}>Không có dữ liệu</div>
        <div style={{ fontSize: '14px', marginTop: '8px' }}>Vui lòng chọn khoảng thời gian khác</div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(item => item.count));
  const minCount = Math.min(...data.map(item => item.count));
  const chartWidth = 800;
  const chartHeight = 350;
  const padding = 60;

  const getX = (index: number) => {
    return padding + (index * (chartWidth - 2 * padding)) / (data.length - 1);
  };

  const getY = (count: number) => {
    const range = maxCount - minCount || 1;
    return chartHeight - padding - ((count - minCount) * (chartHeight - 2 * padding)) / range;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Create path for line chart
  const pathData = data.map((item, index) => {
    const x = getX(index);
    const y = getY(item.count);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Create area path
  const areaData = [
    `M ${getX(0)} ${getY(data[0].count)}`,
    ...data.slice(1).map((item, index) => `L ${getX(index + 1)} ${getY(item.count)}`),
    `L ${getX(data.length - 1)} ${chartHeight - padding}`,
    `L ${getX(0)} ${chartHeight - padding}`,
    'Z'
  ].join(' ');

  return (
    <div className="trend-chart">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        padding: '20px',
        background: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
        borderRadius: '12px'
      }}>
        <svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
          {/* Grid lines with gradient */}
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#667eea', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: '#764ba2', stopOpacity: 0.05 }} />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#667eea', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#764ba2', stopOpacity: 1 }} />
            </linearGradient>
            <filter id="shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
            </filter>
          </defs>

          {/* Background grid */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const y = chartHeight - padding - ratio * (chartHeight - 2 * padding);
            return (
              <line
                key={`grid-${ratio}`}
                x1={padding}
                y1={y}
                x2={chartWidth - padding}
                y2={y}
                stroke="#e8eaed"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
            );
          })}

          {/* Axes - render first so they appear behind other elements */}
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={chartHeight - padding}
            stroke="#9ca3af"
            strokeWidth="2"
          />
          <line
            x1={padding}
            y1={chartHeight - padding}
            x2={chartWidth - padding}
            y2={chartHeight - padding}
            stroke="#9ca3af"
            strokeWidth="2"
          />

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const value = Math.round(minCount + (maxCount - minCount) * ratio);
            const y = chartHeight - padding - ratio * (chartHeight - 2 * padding);
            return (
              <g key={ratio}>
                <text
                  x={padding - 15}
                  y={y + 5}
                  textAnchor="end"
                  fontSize="13"
                  fill="#6b7280"
                  fontWeight="600"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* Area fill with gradient */}
          <path
            d={areaData}
            fill="url(#areaGradient)"
            stroke="none"
          />

          {/* Line with gradient and shadow */}
          <path
            d={pathData}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#shadow)"
          />

          {/* Data points with enhanced styling */}
          {data.map((item, index) => {
            const x = getX(index);
            const y = getY(item.count);
            return (
              <g key={`point-${index}`}>
                {/* Outer glow circle */}
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill="url(#lineGradient)"
                  opacity="0.2"
                />
                {/* Main circle */}
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill="white"
                  stroke="url(#lineGradient)"
                  strokeWidth="3"
                  style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                />
                {/* Interactive area */}
                <circle
                  cx={x}
                  cy={y}
                  r="12"
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => {
                    const tooltip = document.getElementById(`tooltip-${index}`);
                    if (tooltip) tooltip.style.display = 'block';
                  }}
                  onMouseLeave={() => {
                    const tooltip = document.getElementById(`tooltip-${index}`);
                    if (tooltip) tooltip.style.display = 'none';
                  }}
                />
              </g>
            );
          })}

          {/* Tooltips - rendered last so they appear on top */}
          {data.map((item, index) => {
            const x = getX(index);
            const y = getY(item.count);
            return (
              <g key={`tooltip-${index}`} id={`tooltip-${index}`} style={{ display: 'none', pointerEvents: 'none' }}>
                {/* Tooltip shadow */}
                <rect
                  x={x - 125}
                  y={y - 92}
                  width="250"
                  height="75"
                  fill="rgba(0, 0, 0, 0.1)"
                  rx="10"
                  transform="translate(2, 2)"
                />
                {/* Tooltip background */}
                <rect
                  x={x - 125}
                  y={y - 92}
                  width="250"
                  height="75"
                  fill="rgba(26, 32, 44, 0.95)"
                  rx="10"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                />
                {/* Tooltip arrow */}
                <path
                  d={`M ${x - 8} ${y - 17} L ${x} ${y - 8} L ${x + 8} ${y - 17} Z`}
                  fill="rgba(26, 32, 44, 0.95)"
                />
                {/* Date and count */}
                <text
                  x={x}
                  y={y - 65}
                  textAnchor="middle"
                  fontSize="13"
                  fill="white"
                  fontWeight="700"
                >
                  📅 {formatDate(item.date)} • {item.count} câu hỏi
                </text>
                {/* Separator line */}
                <line
                  x1={x - 115}
                  y1={y - 58}
                  x2={x + 115}
                  y2={y - 58}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1"
                />
                {/* Label */}
                <text
                  x={x}
                  y={y - 45}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#fbbf24"
                  fontWeight="600"
                >
                  ⭐ Câu hỏi phổ biến nhất:
                </text>
                {/* Top question */}
                <text
                  x={x}
                  y={y - 28}
                  textAnchor="middle"
                  fontSize="11"
                  fill="rgba(255,255,255,0.9)"
                  fontWeight="500"
                >
                  {item.topQuestion && item.topQuestion.length > 40
                    ? item.topQuestion.substring(0, 40) + "..."
                    : item.topQuestion || "Không có dữ liệu"}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {data.map((item, index) => {
            const x = getX(index);
            return (
              <g key={index}>
                <text
                  x={x}
                  y={chartHeight - padding + 25}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#6b7280"
                  fontWeight="600"
                >
                  {formatDate(item.date)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Chart Info with modern styling */}
      <div style={{ 
        marginTop: '28px',
        padding: '20px',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-around',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 24px',
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          flex: 1,
          minWidth: '150px'
        }}>
          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📈 Cao nhất
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
            {maxCount}
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
            câu hỏi
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 24px',
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          flex: 1,
          minWidth: '150px'
        }}>
          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📉 Thấp nhất
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
            {minCount}
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
            câu hỏi
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 24px',
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          flex: 1,
          minWidth: '150px'
        }}>
          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ➗ Trung bình
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#667eea' }}>
            {Math.round(data.reduce((sum, item) => sum + item.count, 0) / data.length)}
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
            câu hỏi/ngày
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendChart;
