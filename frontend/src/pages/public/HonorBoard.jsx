import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import logo from "@/assets/logo.png";

const HonorBoard = () => {
  const [shiningStars, setShiningStars] = useState([]);
  const [nationalHeroes, setNationalHeroes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWithFallback = async (url1, url2) => {
    const token = localStorage.getItem('access');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const res = await axios.get(url1, { headers });
      return res.data;
    } catch {
      const fallbackRes = await axios.get(url2, { headers });
      return fallbackRes.data;
    }
  };

  useEffect(() => {
    const fetchHonorData = async () => {
      try {
        const [starsData, heroesData] = await Promise.all([
          fetchWithFallback('/api/honors/shining-stars/', '/honors/shining-stars/'),
          fetchWithFallback('/api/honors/national-heroes/', '/honors/national-heroes/')
        ]);
        setShiningStars(starsData);
        setNationalHeroes(heroesData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load honor board:', error);
        setLoading(false);
      }
    };

    fetchHonorData();
  }, []);

  const renderTable = (title, data) => (
    <div className="mb-12">
      <h2 className="text-xl font-semibold text-center mb-4">{title}</h2>
      {data.length === 0 ? (
        <p className="text-center text-green-500">No data available.</p>
      ) : (
        data.map((group, index) => (
          <div
            key={index}
            className="bg-green-50 border border-green-300 rounded-xl shadow-sm p-4 mb-6"
          >
            <h3 className="text-lg font-medium mb-2">Grade: {group.grade}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-green-300 text-sm">
                <thead className="bg-green-100">
                  <tr>
                    <th className="border px-3 py-2">Rank</th>
                    <th className="border px-3 py-2">Name</th>
                    <th className="border px-3 py-2">Username</th>
                    <th className="border px-3 py-2">School</th>
                    <th className="border px-3 py-2">City</th>
                    <th className="border px-3 py-2">Province</th>
                    <th className="border px-3 py-2">Quizzes Attempted</th>
                    <th className="border px-3 py-2">Avg. Score</th>
                    <th className="border px-3 py-2">Total Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {group.top_students.map((student, idx) => (
                    <tr key={idx} className="text-center">
                      <td className="border px-3 py-2">{idx + 1}</td>
                      <td className="border px-3 py-2">{student.full_name || 'N/A'}</td>
                      <td className="border px-3 py-2">{student.username}</td>
                      <td className="border px-3 py-2">{student.school}</td>
                      <td className="border px-3 py-2">{student.city}</td>
                      <td className="border px-3 py-2">{student.province}</td>
                      <td className="border px-3 py-2">{student.quizzes_attempted ?? '-'}</td>
                      <td className="border px-3 py-2">
                        {student.average_score != null ? `${student.average_score}%` : '-'}
                      </td>
                      <td className="border px-3 py-2 font-bold">{student.total_marks ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="bg-white min-h-screen pb-16">
      {/* ✅ Top-left monogram */}
      <div className="px-4 pt-4">
        <Link to="/">
          <img
            src={logo}
            alt="Learnify Home"
            className="h-24 w-auto hover:opacity-80 transition duration-200"
          />
        </Link>
      </div>

      {/* ✅ Title Section */}
      <div className="bg-green-50 border border-green-300 rounded-xl shadow-sm max-w-4xl mx-auto mt-4 mb-12 px-6 py-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-green-800 mb-3">
          🏆 Learnify Heroes
        </h1>
        <p className="text-green-800 text-lg font-medium">
          Celebrating our Shining Stars and National Heroes
        </p>
      </div>

      {/* ✅ Honor Board Section */}
      <div className="max-w-6xl mx-auto px-4">
        {loading ? (
          <p className="text-center text-green-500">Loading...</p>
        ) : (
          <>
            {renderTable('🌟 Shining Stars (Top Performers of the Month)', shiningStars)}
            {renderTable('🏆 National Heroes (Top Performers of the Quarter)', nationalHeroes)}
          </>
        )}
      </div>
    </div>
  );
};

export default HonorBoard;