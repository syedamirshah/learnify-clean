// src/pages/student/StudentDashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🎓 Student Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <button
          onClick={() => navigate("/student/quizzes")}
          className="bg-green-500 text-white p-4 rounded shadow hover:bg-green-600"
        >
          📚 Attempt a Quiz
        </button>

        <button
          onClick={() => navigate("/student/quiz-history")}
          className="bg-blue-500 text-white p-4 rounded shadow hover:bg-blue-600"
        >
          📊 View Quiz History
        </button>

        <button
          onClick={() => navigate("/student/medals")}
          className="bg-yellow-500 text-white p-4 rounded shadow hover:bg-yellow-600"
        >
          🏅 My Medals & Honors
        </button>
      </div>
    </div>
  );
};

export default StudentDashboard;