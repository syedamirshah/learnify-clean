// src/pages/student/StudentQuizList.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StudentQuizList = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await axios.get("http://127.0.0.1:8000/api/student/quiz-list/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuizzes(res.data);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        alert("Failed to load quizzes.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const handleStartQuiz = async (quizId) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`http://127.0.0.1:8000/api/student/quiz/${quizId}/start/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Store attempt data locally
      localStorage.setItem("current_attempt", JSON.stringify(res.data));
      window.location.href = `/student/quiz-attempt`;
    } catch (error) {
      console.error("Error starting quiz:", error);
      alert("Unable to start quiz.");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📝 Available Quizzes</h2>

      {loading ? (
        <p>Loading quizzes...</p>
      ) : quizzes.length === 0 ? (
        <p>No quizzes available at the moment.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white p-4 shadow rounded border">
              <h3 className="text-lg font-semibold">{quiz.title}</h3>
              <p><strong>Subject:</strong> {quiz.subject}</p>
              <p><strong>Chapter:</strong> {quiz.chapter}</p>
              <p><strong>Marks:</strong> {quiz.total_marks}</p>
              <button
                onClick={() => handleStartQuiz(quiz.id)}
                className="mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Start Quiz
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentQuizList;