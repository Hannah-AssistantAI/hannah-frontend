import { Toaster, type Toast } from 'react-hot-toast';
import './CustomToast.css';

const CustomToast = () => {
    return (
        <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
                duration: 1500, // Default 1.5s
                success: {
                    duration: 1500, // Exact 1.5s
                    iconTheme: {
                        primary: '#10b981',
                        secondary: '#ffffff',
                    },
                },
                error: {
                    duration: 1500, // Exact 2s
                    iconTheme: {
                        primary: '#ef4444',
                        secondary: '#ffffff',
                    },
                },
            }}
        >
            {(t: Toast) => {
                const isSuccess = t.type === 'success';
                const isError = t.type === 'error';
                const progressColor = isSuccess ? '#10b981' : isError ? '#ef4444' : '#6b7280';
                const textColor = isSuccess ? '#059669' : isError ? '#dc2626' : '#1f2937';
                const borderColor = isSuccess ? '#d1fae5' : isError ? '#fee2e2' : '#e5e7eb';

                // Add 1000ms to match actual toast lifetime (includes fade-out + internal delays)
                const baseDuration = t.duration ?? 1500;
                const animationDuration = baseDuration + 1000; // +1s buffer for perfect sync

                return (
                    <div className="custom-toast">
                        {/* Toast content */}
                        <div className="custom-toast-content">
                            <div className="custom-toast-icon">{t.icon}</div>
                            <div className="custom-toast-message">{t.message?.toString()}</div>
                        </div>

                        {/* Progress bar container */}
                        <div className="custom-toast-progress-track">
                            {/* Progress bar fill */}
                            <div
                                className="custom-toast-progress-bar"
                                style={{
                                    background: progressColor,
                                    animation: `toast-progress ${animationDuration}ms linear forwards`,
                                }}
                            />
                        </div>

                        {/* Inline styles for colors */}
                        <style>{`
              .custom-toast {
                background: #ffffff;
                color: ${textColor};
                border: 1px solid ${borderColor};
              }
            `}</style>
                    </div>
                );
            }}
        </Toaster>
    );
};

export default CustomToast;
