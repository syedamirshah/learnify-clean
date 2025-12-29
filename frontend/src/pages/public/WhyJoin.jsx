// File: src/pages/landing/WhyJoinLearnify.jsx
import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import {
  FaBookOpen,
  FaBrain,
  FaChartBar,
  FaRedo,
  FaUserFriends,
  FaMoneyBillWave,
  FaChalkboardTeacher,
  FaGlobeAsia,
} from "react-icons/fa";

const WhyJoinLearnify = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Monogram Navigation */}
      <nav className="flex items-start px-6 py-2">
        <div className="inline-block">
          <Link to="/">
            <img
              src={logo}
              alt="Learnify Home"
              className="h-24 w-auto hover:opacity-80 transition duration-200"
              style={{ background: "transparent" }}
            />
          </Link>
        </div>
      </nav>

      {/* Page Content */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-left">
        <h2 className="text-4xl font-extrabold text-green-700 mb-4">
          Why Join Learnify Pakistan?
        </h2>

        <p className="text-lg text-gray-700 mb-12">
          Learnify Pakistan is more than a quiz app — it’s a joyful learning journey
          for primary students, supportive for parents, and practical for teachers.
          Built around Pakistan’s National Curriculum, Learnify blends simplicity,
          smart practice, and meaningful feedback to help every child grow with confidence.
        </p>

        <div className="space-y-12 text-left">
          {/* 1) Curriculum Alignment */}
          <div className="flex items-start space-x-4">
            <FaBookOpen className="text-green-600 text-2xl mt-1" />
            <div>
              <h3 className="text-xl font-bold text-green-700">
                Aligned with National Curriculum
              </h3>
              <p className="text-gray-700">
                Every quiz is mapped to nationally and provincially approved textbooks
                for Grades 1–5, so students practice exactly what they learn in class —
                in the right sequence, with the right concepts.
              </p>
            </div>
          </div>

          {/* 2) Smart Pedagogy */}
          <div className="flex items-start space-x-4">
            <FaBrain className="text-pink-500 text-2xl mt-1" />
            <div>
              <h3 className="text-xl font-bold text-pink-600">Smart Pedagogy</h3>
              <p className="text-gray-700">
                Learn through real-life examples, simple explanations, and engaging practice —
                from basic to advanced — designed to build strong understanding step by step.
              </p>
            </div>
          </div>

          {/* 3) Evaluation Modes */}
          <div className="flex items-start space-x-4">
            <FaChartBar className="text-blue-600 text-2xl mt-1" />
            <div>
              <h3 className="text-xl font-bold text-blue-700">
                Three Powerful Evaluation Modes
              </h3>
              <ul className="list-disc ml-5 text-gray-700">
                <li>
                  <strong>Instant Feedback:</strong> See correct/incorrect answers immediately
                  (with guidance where needed).
                </li>
                <li>
                  <strong>Progress Tracking:</strong> Monitor improvement across topics and subjects
                  over time.
                </li>
                <li>
                  <strong>Percentile Ranking:</strong> Understand performance compared to other
                  students nationwide.
                </li>
              </ul>
            </div>
          </div>

          {/* 4) Unlimited Attempts */}
          <div className="flex items-start space-x-4">
            <FaRedo className="text-purple-500 text-2xl mt-1" />
            <div>
              <h3 className="text-xl font-bold text-purple-700">
                Unlimited Quiz Attempts
              </h3>
              <p className="text-gray-700">
                Practice as much as you want — and it won’t feel repetitive. Each new attempt
                can serve fresh questions instead of repeating the same ones, so students keep
                learning with interest.
              </p>
            </div>
          </div>

          {/* 5) Inclusive */}
          <div className="flex items-start space-x-4">
            <FaUserFriends className="text-yellow-600 text-2xl mt-1" />
            <div>
              <h3 className="text-xl font-bold text-yellow-700">
                Inclusive for Everyone
              </h3>
              <p className="text-gray-700">
                Whether a child studies in school or at home, Learnify supports all learners —
                giving every student a fair chance to practice, improve, and shine.
              </p>
            </div>
          </div>

          {/* 6) Low cost */}
          <div className="flex items-start space-x-4">
            <FaMoneyBillWave className="text-green-500 text-2xl mt-1" />
            <div>
              <h3 className="text-xl font-bold text-green-600">
                Low-Cost, High-Impact
              </h3>
              <p className="text-gray-700">
                Premium learning at a price families can afford. Learnify is built on the belief
                that quality education should be within reach of every child.
              </p>
            </div>
          </div>

          {/* 7) Teachers */}
          <div className="flex items-start space-x-4">
            <FaChalkboardTeacher className="text-indigo-600 text-2xl mt-1" />
            <div>
              <h3 className="text-xl font-bold text-indigo-700">
                Empowering Teachers with Real-Time Insight
              </h3>
              <p className="text-gray-700">
                Teachers can instantly view assignments and quiz results — without checking piles
                of notebooks. This saves time, improves classroom planning, and helps teachers focus
                on targeted support where students need it most.
              </p>
            </div>
          </div>

          {/* 8) Parents */}
          <div className="flex items-start space-x-4">
            <FaChartBar className="text-emerald-600 text-2xl mt-1" />
            <div>
              <h3 className="text-xl font-bold text-emerald-700">
                Helping Parents Make Better School Choices
              </h3>
              <p className="text-gray-700">
                Learnify’s learning insights help parents understand academic progress more clearly.
                Over time, families can compare outcomes across schools and make more informed decisions
                for their child’s education.
              </p>
            </div>
          </div>

          {/* 9) Healthy competition */}
          <div className="flex items-start space-x-4">
            <FaChartBar className="text-cyan-700 text-2xl mt-1" />
            <div>
              <h3 className="text-xl font-bold text-cyan-800">
                Inspiring School-Wide Academic Competition
              </h3>
              <p className="text-gray-700">
                When learning progress becomes visible, schools feel motivated to improve teaching quality
                and student outcomes — creating a healthy nationwide culture of academic excellence.
              </p>
            </div>
          </div>

          {/* 10) Research */}
          <div className="flex items-start space-x-4">
            <FaGlobeAsia className="text-red-600 text-2xl mt-1" />
            <div>
              <h3 className="text-xl font-bold text-red-700">
                Driving National-Level Educational Research
              </h3>
              <p className="text-gray-700">
                Learnify can generate anonymized learning insights across regions, genders, schooling modes,
                and language groups — supporting researchers and policymakers to identify gaps and design
                more equitable learning interventions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhyJoinLearnify;