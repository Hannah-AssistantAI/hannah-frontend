import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast'

import ThemedPage from './components/ThemedPage'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/home/Home'
import Learn from './pages/Learn/Learn'
import Chat from './pages/Chat/Chat'
import Profile from './pages/Profile/Profile'
import AdminLayout from './pages/Admin/AdminLayout'
import UserManagement from './pages/Admin/UserManagement/UserManagement'
import APIKeys from './pages/Admin/SystemMonitoring/APIKeys/APIKeys'
import CourseManagement from './pages/Admin/CourseManagement/CourseManagement'
import CourseDetail from './pages/Admin/CourseManagement/CourseDetail'
import CustomMessages from './pages/Admin/CustomMessages/CustomMessages'
import CustomMessageDetail from './pages/Admin/CustomMessages/CustomMessageDetail'
import FacultyLayout from './pages/Faculty/FacultyLayout'
import FAQManagement from './pages/Faculty/FAQ/FAQManagement'
import QuestionAnalytics from './pages/Faculty/QuestionAnalytics/QuestionAnalytics'
import QuestionStatistics from './pages/Faculty/QuestionStatistics/QuestionStatistics'
import ConversationMonitoring from './pages/Faculty/ConversationMonitoring/ConversationMonitoring'
import ConversationDetail from './pages/Faculty/ConversationMonitoring/ConversationDetail'
import MaterialsLayout from './pages/Faculty/MaterialsManagement/MaterialsLayout'
import OutcomesManagement from './pages/Faculty/MaterialsManagement/OutcomesManagement'
import ChallengesManagement from './pages/Faculty/MaterialsManagement/ChallengesManagement'
import DocumentsManagement from './pages/Faculty/MaterialsManagement/DocumentsManagement'
import { Dashboard } from './pages/Admin/Dashboard'
import { SystemMonitoring } from './pages/Admin/SystemMonitoring/SystemMonitoring'
import { Configuration } from './pages/Admin/Configuration'
import SemesterManagement from './pages/Admin/SemesterManagement/SemesterManagement'
import QuizAttemptDetail from './pages/Faculty/QuestionAnalytics/QuizAttemptDetail'
import QuizDetail from './pages/Faculty/QuestionAnalytics/QuizDetail'
import FlaggedQuizzes from './pages/Admin/FlaggedQuizzes'
import FlaggedQuizDetail from './pages/Admin/FlaggedQuizDetail'
import { FlaggedMessagesList, FlaggedMessageDetail } from './pages/Admin/FlaggedMessages'
import { AssignedFlagsList } from './pages/Faculty/AssignedFlags'

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
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          // Default options
          duration: 3000,
          style: {
            padding: '16px',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: '500',
          },
          // Success - Màu xanh lá
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10b981',
            },
          },
          // Error - Màu đỏ
          error: {
            duration: 4000,
            style: {
              background: '#ef4444',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Protected Routes - Require Login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/learn" element={<ThemedPage><Learn /></ThemedPage>} />
          <Route path="/chat" element={<ThemedPage><Chat /></ThemedPage>} />
          <Route path="/profile" element={<ThemedPage><Profile /></ThemedPage>} />
        </Route>

        {/* Admin Routes - Require 'Admin' role */}
        <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<UserManagement />} />
            <Route path="user-management" element={<UserManagement />} />
            <Route path="custom-messages" element={<CustomMessages />} />
            <Route path="custom-messages/:id" element={<CustomMessageDetail />} />
            <Route path="system-monitoring/usage" element={<SystemMonitoring />} />
            <Route path="system-monitoring/api-keys" element={<APIKeys />} />
            <Route path="system-settings" element={<SystemMonitoring />} />
            <Route path="course-management" element={<CourseManagement />} />
            <Route path="course-management/:id" element={<CourseDetail />} />
            <Route path="semester-management" element={<SemesterManagement />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path='configuration' element={<Configuration />} />
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
            <Route path="conversations" element={<ConversationMonitoring />} />
            <Route path="conversations/:id" element={<ConversationDetail />} />
            <Route path="materials" element={<MaterialsLayout />}>
              <Route index element={<DocumentsManagement />} />
              <Route path="documents" element={<DocumentsManagement />} />
              <Route path="outcomes" element={<OutcomesManagement />} />
              <Route path="challenges" element={<ChallengesManagement />} />
            </Route>
            <Route path="analytics" element={<QuestionAnalytics />} />
            <Route path="analytics/quiz/:id" element={<QuizDetail />} />
            <Route path="analytics/quiz/:quizId/attempt/:id" element={<QuizAttemptDetail />} />
            <Route path="questions" element={<QuestionStatistics />} />
            <Route path="assigned-flags" element={<AssignedFlagsList />} />
            <Route path="assigned-flags/:id" element={<FlaggedMessageDetail />} />
            <Route path="profile" element={<Profile embedded={true} />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}

export default App
