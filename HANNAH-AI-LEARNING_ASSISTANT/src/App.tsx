import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import CustomToast from './components/CustomToast';

import ThemedPage from './components/ThemedPage'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/home/Home'
import Learn from './pages/Learn/Learn'
import Chat from './pages/Chat/Chat'
import Profile from './pages/Profile/Profile'
import SharedConversationView from './pages/SharedConversationView/SharedConversationView'
import AdminLayout from './pages/Admin/AdminLayout'
import UserManagement from './pages/Admin/UserManagement/UserManagement'
import APIKeys from './pages/Admin/SystemMonitoring/APIKeys/APIKeys'
import CourseManagement from './pages/Admin/CourseManagement/CourseManagement'
import CourseDetail from './pages/Admin/CourseManagement/CourseDetail'
import CourseOverviewManagement from './pages/Admin/CourseOverviewManagement/CourseOverviewManagement'

import FacultyLayout from './pages/Faculty/FacultyLayout'
import FAQManagement from './pages/Faculty/FAQ/FAQManagement'
import QuestionAnalytics from './pages/Faculty/QuestionAnalytics/QuestionAnalytics'
import QuestionStatistics from './pages/Faculty/QuestionStatistics/QuestionStatistics'

import OutcomesManagement from './pages/Faculty/MaterialsManagement/OutcomesManagement'
import ChallengesManagement from './pages/Faculty/MaterialsManagement/ChallengesManagement'
import DocumentsManagement from './pages/Faculty/MaterialsManagement/DocumentsManagement'
import { Dashboard } from './pages/Admin/Dashboard'
import { SystemMonitoring } from './pages/Admin/SystemMonitoring/SystemMonitoring'
import { Configuration } from './pages/Admin/Configuration'
import { AiSettingsManagement } from './pages/Admin/AiSettingsManagement'
import SemesterManagement from './pages/Admin/SemesterManagement/SemesterManagement'
import SpecializationManagement from './pages/Admin/SpecializationManagement/SpecializationManagement'
import QuizAttemptDetail from './pages/Faculty/QuestionAnalytics/QuizAttemptDetail'
import QuizDetail from './pages/Faculty/QuestionAnalytics/QuizDetail'
import FlaggedQuizzes from './pages/Admin/FlaggedQuizzes'
import FlaggedQuizDetail from './pages/Admin/FlaggedQuizDetail'
import { FlaggedMessagesList, FlaggedMessageDetail } from './pages/Admin/FlaggedMessages'
import { AssignedMessages, AssignedQuizzes } from './pages/Faculty/AssignedFlags'
import AssignedFlagDetailRouter from './pages/Faculty/AssignedFlags/AssignedFlagDetailRouter'
import MyFlags from './pages/MyFlags/MyFlags'
import OnboardingGuard from './components/OnboardingGuard'

// Onboarding pages - Phase 0 (Thesis Defense Remediation)
import {
  OnboardingWelcome,
  OnboardingProfile,
  OnboardingTranscript,
  OnboardingComplete
} from './pages/Onboarding'

// Student pages - Phase 1 (Career Path Explorer)
import { CareerPathExplorer } from './pages/Student/CareerPath'
// Student pages - Phase 4 (Learning Dashboard)
import { LearningDashboard } from './pages/Student/LearningDashboard'

const AuthRedirectHandler = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) {
      return;
    }

    // Only redirect if the user is on the homepage after logging in
    if (location.pathname === '/') {
      const role = user.role.toLowerCase();
      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (role === 'faculty') {
        navigate('/faculty', { replace: true });
      }
      // For students, do nothing and let them stay on the homepage.
    }
  }, [isAuthenticated, user, isLoading, navigate, location]);

  return null; // This component renders nothing, it's only for side effects
};

function App() {
  return (
    <>
      <AuthRedirectHandler />
      <CustomToast />
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Public shared conversation route - no auth required */}
        <Route path="/shared/:shareToken" element={<SharedConversationView />} />

        {/* Onboarding Routes - Require Login (Phase 0) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingWelcome />} />
          <Route path="/onboarding/profile" element={<OnboardingProfile />} />
          <Route path="/onboarding/transcript" element={<OnboardingTranscript />} />
          <Route path="/onboarding/complete" element={<OnboardingComplete />} />
        </Route>

        {/* Protected Routes - Require Login + Onboarding for Students */}
        <Route element={<ProtectedRoute />}>
          <Route element={<OnboardingGuard />}>
            <Route path="/learn" element={<ThemedPage><Learn /></ThemedPage>} />
            <Route path="/chat" element={<ThemedPage><Chat /></ThemedPage>} />
            <Route path="/chat/:conversationId" element={<ThemedPage><Chat /></ThemedPage>} />
            <Route path="/profile" element={<ThemedPage><Profile /></ThemedPage>} />
            <Route path="/my-flags" element={<ThemedPage><MyFlags /></ThemedPage>} />
            <Route path="/career-path" element={<CareerPathExplorer />} />
            <Route path="/student/learning-dashboard" element={<LearningDashboard />} />
          </Route>
        </Route>

        {/* Admin Routes - Require 'Admin' role */}
        <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<UserManagement />} />
            <Route path="user-management" element={<UserManagement />} />

            <Route path="system-monitoring/usage" element={<SystemMonitoring />} />
            <Route path="system-monitoring/api-keys" element={<APIKeys />} />
            <Route path="system-settings" element={<SystemMonitoring />} />
            <Route path="course-management" element={<CourseManagement />} />
            <Route path="course-management/:id" element={<CourseDetail />} />
            <Route path="semester-management" element={<SemesterManagement />} />
            <Route path="specializations" element={<SpecializationManagement />} />
            <Route path="course-overview" element={<CourseOverviewManagement />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path='configuration' element={<Configuration />} />
            <Route path='ai-settings' element={<AiSettingsManagement />} />
            <Route path="profile" element={<Profile embedded={true} />} />
            <Route path="flagged-quizzes" element={<FlaggedQuizzes />} />
            <Route path="flagged-quizzes/:id" element={<FlaggedQuizDetail />} />
            <Route path="flagged-messages" element={<FlaggedMessagesList />} />
            <Route path="flagged-messages/:id" element={<FlaggedMessageDetail />} />
          </Route>
        </Route>

        {/* Faculty Routes - Require 'Faculty' role */}
        <Route element={<ProtectedRoute allowedRoles={['Faculty']} />}>
          <Route path="/faculty" element={<FacultyLayout />}>
            <Route index element={<FAQManagement />} />
            <Route path="faq" element={<FAQManagement />} />

            <Route path="materials/documents" element={<DocumentsManagement />} />
            <Route path="materials/outcomes" element={<OutcomesManagement />} />
            <Route path="materials/challenges" element={<ChallengesManagement />} />
            <Route path="analytics" element={<QuestionAnalytics />} />
            <Route path="analytics/quiz/:id" element={<QuizDetail />} />
            <Route path="analytics/quiz/:quizId/attempt/:id" element={<QuizAttemptDetail />} />
            <Route path="questions" element={<QuestionStatistics />} />
            <Route path="assigned-flags/messages" element={<AssignedMessages />} />
            <Route path="assigned-flags/messages/:id" element={<FlaggedMessageDetail />} />
            <Route path="assigned-flags/quizzes" element={<AssignedQuizzes />} />
            <Route path="assigned-flags/quizzes/:id" element={<FlaggedQuizDetail />} />
            <Route path="assigned-flags/:id" element={<AssignedFlagDetailRouter />} />

            <Route path="profile" element={<Profile embedded={true} />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}

export default App
