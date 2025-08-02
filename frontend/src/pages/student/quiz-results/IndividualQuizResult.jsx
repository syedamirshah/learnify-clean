import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import logo from "../../../assets/logo.png";

const IndividualQuizResult = () => {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const token = localStorage.getItem('access_token');
        console.log("üîê JWT token used:", token);
  
        if (!token) {
          console.warn("‚ö†Ô∏è No token found in localStorage.");
        }
  
        const response = await axios.get(`/api/student/quiz-result/${attemptId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        console.log('‚úÖ Fetched Result:', response.data);
  
        // Patch to add missing fields for frontend display
        const data = response.data;
        const patchedResult = {
          ...data,
          grade_letter: data.grade_letter || data.grade || 'N/A',
          incorrect_answers:
            (data.total_questions || 0) - (data.correct_answers || 0),
        };
  
        setResult(patchedResult);
      } catch (error) {
        console.error('‚ùå Error fetching quiz result:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchResult();
  }, [attemptId]);

  const renderAnswer = (ans) => {
    if (!ans || ans === '') return <span className="text-gray-400 italic">No answer</span>;
    if (Array.isArray(ans)) return ans.join(', ');
    if (typeof ans === 'object') return Object.entries(ans).map(([k, v]) => `${k}: ${v}`).join(', ');
    return ans;
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (!result) return <div className="p-4 text-center text-red-600">Failed to load result.</div>;

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Top Logo on the Left */}
      <div className="mb-4 flex items-start">
        <Link to="/" className="inline-block">
          <img
            src={logo}
            alt="Learnify Logo"
            className="h-24 w-auto hover:opacity-80 transition duration-300"
          />
        </Link>
      </div>

      {/* ‚úÖ Result Card */}
      <div className="max-w-4xl mx-auto p-6 bg-green-50 shadow-md rounded-lg mt-2">
        <h1 className="text-3xl font-bold mb-6 text-center text-green-800">Quiz Result</h1>

        <div className="space-y-2 text-lg text-gray-800">
          <div><strong>Title:</strong> {result.quiz_title}</div>
          <div><strong>Total Questions:</strong> {result.total_questions}</div>
          <div><strong>Correct Answers:</strong> {result.correct_answers}</div>
          <div><strong>Incorrect Answers:</strong> {result.incorrect_answers}</div>
          <div><strong>Marks Obtained:</strong> {result.marks_obtained}</div>
          <div><strong>Percentage:</strong> {result.percentage}%</div>
          <div><strong>Grade:</strong> {result.grade_letter}</div>
        </div>

        {result.questions?.length > 0 ? (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold mb-4 text-green-700">Answer Review</h2>
            <div className="space-y-4">
              {result.questions.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 border-l-4 rounded shadow-sm ${
                    item.is_correct ? 'border-green-500 bg-green-100' : 'border-red-500 bg-red-100'
                  }`}
                >
                  <p><strong>Question:</strong></p>
                  <div className="bg-white border p-2 rounded mb-2">{item.question_text}</div>
                  <p><strong>Your Answer:</strong> {renderAnswer(item.student_answer)}</p>
                  <p><strong>Correct Answer:</strong> {renderAnswer(item.correct_answer)}</p>
                  <p className={`mt-1 font-bold ${item.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                    {item.is_correct ? 'Correct' : 'Incorrect'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-6 text-center text-gray-500">No questions were answered.</p>
        )}

        {/* ‚úÖ Navigation Links */}
        <div className="mt-10 text-center space-y-2">
          <Link to="/" className="text-green-700 hover:underline font-semibold">
            Go Back to Quizzes
          </Link>
          <br />
          <Link to="/student/quiz-history" className="text-green-700 hover:underline font-semibold">
            See Your Result History
          </Link>
        </div>
      </div>
    </div>
  );
};

export default IndividualQuizResult;
