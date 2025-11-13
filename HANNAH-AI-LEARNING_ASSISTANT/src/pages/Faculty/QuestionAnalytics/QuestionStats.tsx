import React from 'react';

interface QuestionStatsProps {
  data: {
    course: string;
    count: number;
  }[];
}

const QuestionStats = ({ data }: QuestionStatsProps) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
        <div>No data</div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(item => item.count));

  return (
    <div className="question-stats">
      <div style={{ height: '300px', display: 'flex', alignItems: 'end', gap: '12px', padding: '20px 0' }}>
        {data.map((item, index) => {
          const height = (item.count / maxCount) * 250;
          const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];
          const color = colors[index % colors.length];
          
          return (
            <div key={item.course} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '100%',
                  height: `${height}px`,
                  backgroundColor: color,
                  borderRadius: '4px 4px 0 0',
                  display: 'flex',
                  alignItems: 'end',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '12px',
                  paddingBottom: '8px',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                title={`${item.course}: ${item.count} questions`}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.opacity = '0.8';
                  target.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.opacity = '1';
                  target.style.transform = 'scale(1)';
                }}
              >
                {item.count}
              </div>
              <div style={{
                marginTop: '8px',
                fontSize: '11px',
                color: '#595959',
                textAlign: 'center',
                fontWeight: '500',
                lineHeight: '1.2',
                maxWidth: '80px',
                wordWrap: 'break-word'
              }}>
                {item.course.length > 15 ? item.course.substring(0, 15) + '...' : item.course}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div style={{ 
        borderTop: '1px solid #f0f0f0',
        paddingTop: '16px',
        fontSize: '12px',
        color: '#8c8c8c',
        textAlign: 'center'
      }}>
        Questions by course (hover to see details)
      </div>
    </div>
  );
};

export default QuestionStats;
