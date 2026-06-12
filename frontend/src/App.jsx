// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IndividualQuizResult from "./pages/student/quiz-results/IndividualQuizResult";
import QuizAttempt from "./pages/student/QuizAttempt.jsx";
import HonorBoard from './pages/public/HonorBoard';
import LandingPage from './pages/public/LandingPage';
import HomePage from './pages/public/HomePage';
import SchoolOnboarding from './pages/public/SchoolOnboarding';
import SchoolSignup from './pages/public/SchoolSignup';
import WhyJoin from './pages/public/WhyJoin';
import SignupPage from '@/pages/public/SignupPage';
import EditProfile from './pages/account/EditProfile';
import TeacherAssessment from './pages/teacher/TeacherAssessment';
import StudentQuizHistory from './pages/teacher/StudentQuizHistory';
import StudentSubjectPerformance from './pages/student/StudentSubjectPerformance';
import StudentQuizHistoryTable from './pages/student/StudentQuizHistoryTable';
import LearningDiagnosis from './pages/student/LearningDiagnosis';
import GuestAssessment from './pages/public/GuestAssessment';
import MembershipPage from '@/pages/public/MembershipPage';
import HelpCenter from '@/pages/public/HelpCenter';
import PaymentResult from "./pages/public/PaymentResult";
import StudentTasks from "./pages/student/StudentTasks";
import TeacherAssignTask from "./pages/teacher/TeacherAssignTask";
import TeacherTasks from "./pages/teacher/TeacherTasks";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import SchoolDashboard from "./pages/school/SchoolDashboard";
import SchoolUsers from "./pages/school/SchoolUsers";
import SchoolUploadRoster from "./pages/school/SchoolUploadRoster";
import SchoolAnalytics from "./pages/school/SchoolAnalytics";
import SchoolStudentSummary from "./pages/school/SchoolStudentSummary";
import SchoolStudentQuizHistory from "./pages/school/SchoolStudentQuizHistory";
import SchoolStudentLearningDiagnosis from "./pages/school/SchoolStudentLearningDiagnosis";
import SchoolTeacherAnalytics from "./pages/school/SchoolTeacherAnalytics";
import SchoolTeacherSummary from "./pages/school/SchoolTeacherSummary";
import SchoolTaskMonitoring from "./pages/school/SchoolTaskMonitoring";
import SchoolSettings from "./pages/school/SchoolSettings";
import MyProfile from "./pages/public/MyProfile";
import PwaUpdatePrompt from "./components/PwaUpdatePrompt";
import OfflineOverlay from "./components/OfflineOverlay";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import IosInstallPrompt from "./components/IosInstallPrompt";
import PrivacyPolicy from "./pages/public/PrivacyPolicy";
import DeleteAccount from "./pages/public/DeleteAccount";
import TopicIndexPage from "./pages/public/TopicIndexPage";
import WeeklyPlanPage from "./pages/public/WeeklyPlanPage";
import SchoolProtectedRoute from "./components/SchoolProtectedRoute";





function App() {
    console.log("✅ App loaded: this build includes _redirects and updated routes.");

  return (
    <Router>
      <OfflineOverlay />
      <div className="min-h-screen bg-white">
        <Routes>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/student/quiz-result/:attemptId/" element={<IndividualQuizResult />} />
          <Route path="/student/attempt-quiz/:quizId" element={<QuizAttempt />} />
          <Route path="/student/quiz/:quizId/start" element={<QuizAttempt />} />
          <Route path="/honor-roll" element={<HonorBoard />} />
          <Route path="/honor-board" element={<HonorBoard />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/school-onboarding" element={<SchoolOnboarding />} />
          <Route path="/school-signup" element={<SchoolSignup />} />
          <Route path="/learn" element={<LandingPage />} />
          <Route path="/why-join" element={<WhyJoin />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/account/edit-profile" element={<EditProfile />} />
          <Route path="/school/dashboard" element={<SchoolProtectedRoute><SchoolDashboard /></SchoolProtectedRoute>} />
          <Route path="/school/users" element={<SchoolProtectedRoute><SchoolUsers /></SchoolProtectedRoute>} />
          <Route path="/school/upload" element={<SchoolProtectedRoute><SchoolUploadRoster /></SchoolProtectedRoute>} />
          <Route path="/school/analytics" element={<SchoolProtectedRoute><SchoolAnalytics /></SchoolProtectedRoute>} />
          <Route path="/school/teachers" element={<SchoolProtectedRoute><SchoolTeacherAnalytics /></SchoolProtectedRoute>} />
          <Route path="/school/teacher/:username" element={<SchoolProtectedRoute><SchoolTeacherSummary /></SchoolProtectedRoute>} />
          <Route path="/school/tasks" element={<SchoolProtectedRoute><SchoolTaskMonitoring /></SchoolProtectedRoute>} />
          <Route path="/school/settings" element={<SchoolProtectedRoute><SchoolSettings /></SchoolProtectedRoute>} />
          <Route path="/school/student/:username/quiz-history" element={<SchoolProtectedRoute><SchoolStudentQuizHistory /></SchoolProtectedRoute>} />
          <Route path="/school/student/:username/learning-diagnosis" element={<SchoolProtectedRoute><SchoolStudentLearningDiagnosis /></SchoolProtectedRoute>} />
          <Route path="/school/student/:username" element={<SchoolProtectedRoute><SchoolStudentSummary /></SchoolProtectedRoute>} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/assessment" element={<TeacherAssessment />} />
          <Route path="/teacher/student/:username/quiz-history" element={<StudentQuizHistory />} />
          <Route path="/student/assessment" element={<StudentSubjectPerformance />} />
          <Route path="/student/learning-diagnosis" element={<LearningDiagnosis />} />
          <Route path="/student/quiz-history" element={<StudentQuizHistoryTable />} />
          <Route path="/assessment/public" element={<GuestAssessment />} />
          <Route path="/membership" element={<MembershipPage />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/payment/result" element={<PaymentResult />} />
          <Route path="/student/tasks" element={<StudentTasks />} />
          <Route path="/teacher/assign-task" element={<TeacherAssignTask />} />
          <Route path="/teacher/tasks" element={<TeacherTasks />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
          <Route path="/topic-index" element={<TopicIndexPage />} />
          <Route path="/weekly-plan" element={<WeeklyPlanPage />} />
        </Routes>
        <PwaInstallPrompt />
        <IosInstallPrompt />
        <PwaUpdatePrompt />
      </div>
    </Router>
  );
}

export default App;
