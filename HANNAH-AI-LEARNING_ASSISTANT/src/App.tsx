import { Route, Routes } from 'react-router-dom'
import Home from './pages/home/Home'
import Learn from './pages/Learn/Learn'
import Chat from './pages/Chat/Chat'
import Profile from './pages/Profile/Profile'
import AdminLayout from './pages/Admin/AdminLayout'
import UserManagement from './pages/Admin/UserManagement'
import APIKeys from './pages/Admin/SystemMonitoring/APIKeys/APIKeys'
import CourseManagement from './pages/Admin/CourseManagement/CourseManagement'
import CourseDetail from './pages/Admin/CourseManagement/CourseDetail'
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/learn" element={<Learn />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/profile" element={<Profile />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<UserManagement />} />
        <Route path="user-management" element={<UserManagement />} />
        <Route path="system-monitoring/usage" element={<SystemMonitoring />} />
        <Route path="system-monitoring/api-keys" element={<APIKeys />} />
        <Route path="system-settings" element={<SystemMonitoring />} />
        <Route path="course-management" element={<CourseManagement />} />
  <Route path="course-management/:id" element={<CourseDetail />} />
        <Route path="semester-management" element={<SemesterManagement />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path='configuration' element={<Configuration />} />
      </Route>

      {/* Faculty Routes */}
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
        <Route path="analytics/quiz/:id" element={<QuizAttemptDetail />} />
        <Route path="questions" element={<QuestionStatistics />} />
      </Route>
    </Routes>
  )
}

export default App
