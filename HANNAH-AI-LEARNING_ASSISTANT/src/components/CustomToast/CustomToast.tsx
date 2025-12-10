import toast, { Toaster, type Toast } from 'react-hot-toast';
import './CustomToast.css';

const TOAST_DURATION = 2000; // Visual duration for progress bar

const CustomToast = () => {
    return (
        <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
                duration: Infinity, // We control dismissal manually
                success: {
                    iconTheme: {
                        primary: '#10b981',
                        secondary: '#ffffff',
                    },
                },
                error: {
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

                return (
                    <div
                        className="custom-toast"
                        style={{ cursor: 'pointer' }}
                    >
                        {/* Toast content */}
                        <div className="custom-toast-content">
                            <div className="custom-toast-icon">{t.icon}</div>
                            <div className="custom-toast-message">{t.message?.toString()}</div>
                            {/* Close button */}
                            <button
                                className="custom-toast-close"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toast.remove(t.id);
                                }}
                                title="Close"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    marginLeft: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '4px',
                                    color: '#6b7280',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#f3f4f6';
                                    e.currentTarget.style.color = '#111827';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#6b7280';
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        {/* Progress bar container */}
                        <div className="custom-toast-progress-track">
                            {/* Progress bar fill - dismisses toast when animation ends */}
                            <div
                                className="custom-toast-progress-bar"
                                style={{
                                    background: progressColor,
                                    animation: `toast-progress ${TOAST_DURATION}ms linear forwards`,
                                }}
                                onAnimationEnd={() => {
                                    toast.remove(t.id); // Dismiss immediately when progress bar ends
                                }}
                            />
                        </div>

                        {/* Inline styles for colors */}
                        <style>{`
              .custom-toast {
                background: #ffffff;
                color: ${textColor};
                box-shadow: inset 0 0 0 1px ${borderColor}, 0 4px 12px rgba(0, 0, 0, 0.1);
              }
            `}</style>
                    </div>
                );
            }}
        </Toaster>
    );
};

export default CustomToast;
