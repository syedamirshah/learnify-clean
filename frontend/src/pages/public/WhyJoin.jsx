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
          Learnify Pakistan is more than just a quiz app — it's a joyful journey
          of discovery, designed for primary students, teachers, and parents.
          Grounded in Pakistan’s National Curriculum, we blend innovation,
          simplicity, and inclusivity to make learning unforgettable.
        </p>

        <div className="space-y-12 text-left">
          {/* Existing 6 features unchanged */}
          <div className="flex items-start space-x-4">
            <FaBookOpen className="text-green-600 text-2xl mt-1" />
            <div>
              <h3 className="text-xl font-bold text-green-700">
                Aligned with National Curriculum
              </h3>
              <p className="text-gray-700">
                Every quiz, topic, and explanation is 100% aligned with
                Pakistan’s official curriculum for Grades 1–5 — ensuring you're
                always on track.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <FaBrain className="text-pink-500 text-2xl mt-1" />
            <div>
              <h3 className="text-xl font-bold text-pink-600">Smart Pedagogy</h3>
              <p className="text-gray-700">
                Learn through real-life examples, visual aids, and interactive
                practice — from easy to advanced levels — crafted to build deep
                understanding.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <FaChartBar className="text-blue-600 text-2xl mt-1" />
            <div>
              <h3 className="text-xl font-bold text-blue-700">
                Three Powerful Evaluation Modes
              </h3>
              <ul className="list-disc ml-5 text-gray-700">
                <li>
                  <strong>Instant Feedback:</strong> Get right/wrong answers
                  instantly with explanations.
                </li>
                <li>
                  <strong>Progress Tracking:</strong> Monitor your learning across
                  subjects over time.
                </li>
                <li>
                  <strong>Percentile Ranking:</strong> See how you perform compared
                  to other students nationwide.
                </li>
              </ul>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <FaRedo className="text-purple-500 text-2xl mt-1" />
            <div>
              <h3 className="text-xl font-bold text-purple-700">
                Unlimited Quiz Attempts
              </h3>
              <p className="text-gray-700">
                Practice as much as you want. Every attempt gives you fresh
                questions, so learning never gets boring.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <FaUserFriends className="text-yellow-600 text-2xl mt-1" />
            <div>
              <h3 className="text-xl font-bold text-yellow-700">
                Inclusive for Everyone
              </h3>
              <p className="text-gray-700">
                Whether you're in school or studying at home, Learnify is made for
                you — accessible, inclusive, and full of opportunities to shine.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <FaMoneyBillWave className="text-green-500 text-2xl mt-1" />
            <div>
              <h3 className="text-xl font-bold text-green-600">
                Low-Cost, High-Impact
              </h3>
              <p className="text-gray-700">
                Premium learning at a price every household can afford. We believe
                quality education should be within reach of every child.
              </p>
            </div>
          </div>

          {/* ✅ New Feature 1: Teacher Empowerment */}
          <div className="flex items-start space-x-4">
            <FaChalkboardTeacher className="text-indigo-600 text-2xl mt-1" />
            <div>
              <h3 className="text-xl font-bold text-indigo-700">
                Empowering Teachers with Real-Time Insight
              </h3>
              <p className="text-gray-700">
                Teachers can instantly access students' assignments and quiz results — no need to check piles of homework manually. This streamlines classroom management, reduces workload, and enables educators to focus more on lesson planning and improving instructional quality.
              </p>
            </div>
          </div>

        {/* ✅ New Feature 3: Helping Parents Make Better School Choices */}
        <div className="flex items-start space-x-4">
        <FaChartBar className="text-emerald-600 text-2xl mt-1" />
        <div>
            <h3 className="text-xl font-bold text-emerald-700">
            Helping Parents Make Better School Choices
            </h3>
            <p className="text-gray-700">
            Learnify’s real-time student performance insights empower parents to compare school-level academic outcomes. This transparency helps families make more informed decisions about their child’s education.
            </p>
        </div>
        </div>

        {/* ✅ New Feature 4: Inspiring School-Wide Academic Competition */}
        <div className="flex items-start space-x-4">
        <FaChartBar className="text-cyan-700 text-2xl mt-1" />
        <div>
            <h3 className="text-xl font-bold text-cyan-800">
            Inspiring School-Wide Academic Competition
            </h3>
            <p className="text-gray-700">
            By tracking and showcasing school-level performance, Learnify motivates schools to continuously improve the quality of teaching and learning — creating a healthy, nationwide spirit of academic excellence.
            </p>
        </div>
        </div>

          {/* ✅ New Feature 2: National Research Insights */}
          <div className="flex items-start space-x-4">
            <FaGlobeAsia className="text-red-600 text-2xl mt-1" />
            <div>
              <h3 className="text-xl font-bold text-red-700">
                Driving National-Level Educational Research
              </h3>
              <p className="text-gray-700">
                Learnify collects anonymized learning data across cities, regions, genders, sectors, and language groups — providing a powerful tool for education researchers and policymakers to understand national trends and design more equitable learning interventions.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WhyJoinLearnify;