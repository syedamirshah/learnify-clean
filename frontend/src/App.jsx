// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import IndividualQuizResult from "./pages/student/quiz-results/IndividualQuizResult";
import QuizAttempt from "./pages/student/QuizAttempt.jsx";
import HonorBoard from './pages/public/HonorBoard';
import LandingPage from './pages/public/LandingPage';
import WhyJoin from './pages/public/WhyJoin';
import SignupPage from './pages/public/SignupPage';
import RenewSubscription from './pages/account/RenewSubscription';
import EditProfile from './pages/account/EditProfile';
import TeacherAssessment from './pages/teacher/TeacherAssessment';
import StudentQuizHistory from './pages/teacher/StudentQuizHistory';
import StudentSubjectPerformance from './pages/student/StudentSubjectPerformance';
import StudentQuizHistoryTable from './pages/student/StudentQuizHistoryTable';
import GuestAssessment from './pages/public/GuestAssessment';
import MembershipPage from '@/pages/public/MembershipPage';
import HelpCenter from '@/pages/public/HelpCenter';



function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/student/quiz-result/:attemptId/" element={<IndividualQuizResult />} />
          <Route path="/student/attempt-quiz/:quizId" element={<QuizAttempt />} />
          <Route path="/honor-roll" element={<HonorBoard />} />
          <Route path="/honor-board" element={<HonorBoard />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/why-join" element={<WhyJoin />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/account/renew-subscription" element={<RenewSubscription />} />
          <Route path="/account/edit-profile" element={<EditProfile />} />
          <Route path="/teacher/assessment" element={<TeacherAssessment />} />
          <Route path="/teacher/student/:username/quiz-history" element={<StudentQuizHistory />} />
          <Route path="/student/assessment" element={<StudentSubjectPerformance />} />
          <Route path="/student/quiz-history" element={<StudentQuizHistoryTable />} />
          <Route path="/assessment/public" element={<GuestAssessment />} />
          <Route path="/membership" element={<MembershipPage />} />
          <Route path="/help-center" element={<HelpCenter />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

