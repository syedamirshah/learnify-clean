// File: src/pages/public/GuestAssessment.jsx
import React from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png"; // ✅ Adjust path if needed

const GuestAssessment = () => {
  return (
    <>
      {/* ✅ Logo on white background */}
      <nav className="w-full px-6 py-4 bg-white">
        <Link to="/">
          <img
            src={logo}
            alt="Learnify Home"
            className="h-24 w-auto hover:opacity-80 transition duration-200"
            style={{ background: "transparent" }}
          />
        </Link>
      </nav>

      {/* ✅ Green background only for the content below */}
      <div className="bg-green-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-12 text-left text-green-800">
          <h2 className="text-4xl font-extrabold text-green-700 mb-6">
            Learnify Assessments: Smart, Insightful & Transparent
          </h2>

          <p className="text-lg mb-10">
            At Learnify Pakistan, assessment isn't just about marks — it's about
            growth, understanding, and motivation. Our platform uses three powerful
            tools to help students, parents, and educators track real progress and
            identify areas for improvement.
          </p>

          <div className="space-y-10">
            <div>
              <h3 className="text-2xl font-bold text-blue-700 mb-2">
                ✅ Individual Quiz Results
              </h3>
              <p className="text-green-700 text-lg">
                After every quiz attempt, students receive instant feedback on each question —
                including whether their answer was correct or incorrect. Explanations are provided
                to reinforce learning, turning every quiz into a teaching moment.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-purple-700 mb-2">
                📘 Quiz History Table
              </h3>
              <p className="text-green-700 text-lg">
                All past attempts are stored in a personalized Quiz History Table. This allows
                students and parents to track performance over time — subject-wise, chapter-wise,
                and quiz-wise — enabling better planning and review.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-green-700 mb-2">
                🧠 Subject-Wise Performance
              </h3>
              <p className="text-green-700 text-lg">
                Our platform generates dynamic subject-level reports that show percentile rankings
                and performance comparisons with peers nationwide. This gives learners a clear
                sense of their strengths and areas that need attention.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GuestAssessment;