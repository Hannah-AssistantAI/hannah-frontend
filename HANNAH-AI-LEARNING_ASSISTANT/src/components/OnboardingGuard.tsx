import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import onboardingService from '../service/onboardingService';
import type { OnboardingStatus } from '../service/onboardingService';

/**
 * OnboardingGuard - Ensures students complete onboarding before accessing main app
 * 
 * Logic:
 * - Admin/Faculty: bypass, no onboarding needed
 * - Student with onboarding complete: allow access
 * - Student without onboarding: redirect to /onboarding
 */
const OnboardingGuard: React.FC = () => {
    const { user, isLoading: authLoading } = useAuth();
    const location = useLocation();
    const [status, setStatus] = useState<OnboardingStatus | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        checkOnboardingStatus();
    }, [user]);

    const checkOnboardingStatus = async () => {
        // Skip check if not a student
        if (!user || user.role.toLowerCase() !== 'student') {
            setChecking(false);
            return;
        }

        try {
            const onboardingStatus = await onboardingService.getStatus();
            setStatus(onboardingStatus);
        } catch (error) {
            console.error('Error checking onboarding status:', error);
            // On error, allow access (don't block user)
            setStatus({
                isOnboardingComplete: true,
                profileCompleted: true,
                transcriptUploaded: true,
                onboardingCompletedAt: null,
                fullName: null,
                studentId: null,
                specialization: null,
                currentSemester: null
            });
        } finally {
            setChecking(false);
        }
    };

    // Show loading while checking auth or onboarding
    if (authLoading || checking) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: '#0f0f1a',
                color: '#8b5cf6'
            }}>
                <div>Đang kiểm tra...</div>
            </div>
        );
    }

    // Admin and Faculty bypass onboarding
    if (user && ['admin', 'faculty'].includes(user.role.toLowerCase())) {
        return <Outlet />;
    }

    // Student: check if onboarding is complete
    if (user && user.role.toLowerCase() === 'student') {
        // If onboarding not complete, redirect to onboarding
        if (status && !status.isOnboardingComplete) {
            // Don't redirect if already on an onboarding page
            if (location.pathname.startsWith('/onboarding')) {
                return <Outlet />;
            }

            // Redirect to appropriate onboarding step
            const redirectUrl = onboardingService.getNextStepUrl(status);
            return <Navigate to={redirectUrl} replace state={{ from: location }} />;
        }
    }

    // Onboarding complete or not a student, allow access
    return <Outlet />;
};

export default OnboardingGuard;
