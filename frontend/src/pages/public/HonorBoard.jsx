import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { Link } from 'react-router-dom';
import logo from "@/assets/logo.png";

const HonorBoard = () => {
  const [shiningStars, setShiningStars] = useState([]);
  const [nationalHeroes, setNationalHeroes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWithFallback = async (url1, url2) => {
    try {
      const res = await axiosInstance.get(url1);
      return res.data;
    } catch {
      const fallbackRes = await axiosInstance.get(url2);
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

  const palettes = useMemo(() => ([
    { cardBg: "bg-emerald-50", border: "border-emerald-200", headBg: "bg-emerald-100", accent: "text-emerald-800" },
    { cardBg: "bg-lime-50",    border: "border-lime-200",    headBg: "bg-lime-100",    accent: "text-lime-800" },
    { cardBg: "bg-sky-50",     border: "border-sky-200",     headBg: "bg-sky-100",     accent: "text-sky-800" },
    { cardBg: "bg-amber-50",   border: "border-amber-200",   headBg: "bg-amber-100",   accent: "text-amber-800" },
    { cardBg: "bg-rose-50",    border: "border-rose-200",    headBg: "bg-rose-100",    accent: "text-rose-800" },
  ]), []);

  const getPalette = (i) => palettes[i % palettes.length];

  const renderTable = (title, data, icon) => (
    <div className="mb-14">
      <div className="flex items-center justify-center gap-2 mb-5">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-xl md:text-2xl font-extrabold text-green-900">
          {title}
        </h2>
      </div>

      {data.length === 0 ? (
        <div className="bg-white border border-green-200 rounded-2xl shadow-sm p-8 text-center">
          <div className="text-green-800 font-semibold">No data available.</div>
        </div>
      ) : (
        <div className="space-y-6">
          {data.map((group, index) => {
            const p = getPalette(index);

            return (
              <div
                key={index}
                className={`rounded-2xl border-2 shadow-sm overflow-hidden bg-white ${p.border}`}
              >
                {/* Grade Header */}
                <div className={`px-5 py-4 border-b ${p.headBg} ${p.border}`}>
                  <div className={`text-lg md:text-xl font-black ${p.accent}`}>
                    Grade {group.grade}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-white text-green-900">
                        <th className="px-4 py-3 border-b text-center font-extrabold">Rank</th>
                        <th className="px-4 py-3 border-b text-left font-extrabold">Name</th>
                        <th className="px-4 py-3 border-b text-left font-extrabold">School</th>
                        <th className="px-4 py-3 border-b text-left font-extrabold">City</th>
                        <th className="px-4 py-3 border-b text-left font-extrabold">Province</th>
                        <th className="px-4 py-3 border-b text-center font-extrabold">Quizzes</th>
                        <th className="px-4 py-3 border-b text-center font-extrabold">Avg. Score</th>
                        <th className="px-4 py-3 border-b text-center font-extrabold">Total Marks</th>
                      </tr>
                    </thead>

                    <tbody>
                      {group.top_students.map((student, idx) => (
                        <tr
                          key={idx}
                          className="border-b hover:bg-green-50/60 transition"
                        >
                          <td className="px-4 py-3 text-center font-bold">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {student.full_name || 'N/A'}
                          </td>
                          <td className="px-4 py-3">{student.school}</td>
                          <td className="px-4 py-3">{student.city}</td>
                          <td className="px-4 py-3">{student.province}</td>
                          <td className="px-4 py-3 text-center font-semibold">
                            {student.quizzes_attempted ?? '-'}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold">
                            {student.average_score != null ? `${student.average_score}%` : '-'}
                          </td>
                          <td className="px-4 py-3 text-center font-extrabold">
                            {student.total_marks ?? '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className={`px-5 py-3 ${p.cardBg} border-t ${p.border}`}>
                  <div className="text-xs text-gray-700 font-semibold">
                    Rankings are based on total marks and quiz attempts.
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6fff6] pb-16">
      {/* Logo */}
      <div className="px-4 pt-4">
        <Link to="/">
          <img
            src={logo}
            alt="Learnify Home"
            className="h-24 hover:opacity-80 transition"
          />
        </Link>
      </div>

      {/* Title */}
      <div className="max-w-5xl mx-auto mt-3 px-4">
        <div className="bg-white/70 border border-green-200 rounded-2xl shadow-sm px-6 py-8 text-center">
          <h1 className="text-4xl font-extrabold text-green-900 flex justify-center gap-2">
            🏆 Learnify Heroes
          </h1>
          <p className="mt-2 text-green-800 text-lg font-semibold">
            Celebrating our Shining Stars and National Heroes
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 mt-10">
        {loading ? (
          <div className="bg-white border border-green-200 rounded-2xl shadow-sm p-10 text-center">
            <div className="text-green-900 font-bold">Loading…</div>
          </div>
        ) : (
          <>
            {renderTable('Shining Stars (Top Performers of the Month)', shiningStars, '🌟')}
            {renderTable('National Heroes (Top Performers of the Quarter)', nationalHeroes, '🏅')}
          </>
        )}
      </div>
    </div>
  );
};

export default HonorBoard;