// src/pages/teacher/TeacherDashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const TeacherDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">👨‍🏫 Teacher Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <button
          onClick={() => navigate("/teacher/students")}
          className="bg-purple-500 text-white p-4 rounded shadow hover:bg-purple-600"
        >
          👥 View Assigned Students
        </button>

        <button
          onClick={() => navigate("/teacher/quiz-reports")}
          className="bg-blue-500 text-white p-4 rounded shadow hover:bg-blue-600"
        >
          📊 Quiz Performance Reports
        </button>

        <button
          onClick={() => navigate("/teacher/honor-board")}
          className="bg-yellow-500 text-white p-4 rounded shadow hover:bg-yellow-600"
        >
          🌟 View Honor Board
        </button>
      </div>
    </div>
  );
};

export default TeacherDashboard;