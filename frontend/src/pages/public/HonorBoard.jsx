import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance'; // adjust path if needed
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

  // UI-only: palettes to give each grade section a pleasant theme (no logic change)
  const palettes = useMemo(() => ([
    { cardBg: "bg-emerald-50", border: "border-emerald-200", headBg: "bg-emerald-100", accent: "text-emerald-800" },
    { cardBg: "bg-lime-50",    border: "border-lime-200",    headBg: "bg-lime-100",    accent: "text-lime-800" },
    { cardBg: "bg-sky-50",     border: "border-sky-200",     headBg: "bg-sky-100",     accent: "text-sky-800" },
    { cardBg: "bg-amber-50",   border: "border-amber-200",   headBg: "bg-amber-100",   accent: "text-amber-800" },
    { cardBg: "bg-rose-50",    border: "border-rose-200",    headBg: "bg-rose-100",    accent: "text-rose-800" },
    { cardBg: "bg-indigo-50",  border: "border-indigo-200",  headBg: "bg-indigo-100",  accent: "text-indigo-800" },
  ]), []);

  const getPalette = (i) => palettes[i % palettes.length];

  const renderTable = (title, data, icon) => (
    <div className="mb-12">
      {/* Section title (clean + centered) */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-xl md:text-2xl font-extrabold text-green-900 text-center">
          {title}
        </h2>
      </div>

      {data.length === 0 ? (
        <div className="max-w-3xl mx-auto bg-white border border-green-200 rounded-2xl shadow-sm p-8 text-center">
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
                {/* Grade header */}
                <div className={`px-5 py-4 border-b ${p.headBg} ${p.border}`}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className={`text-lg md:text-xl font-black ${p.accent}`}>
                      Grade: <span className="font-extrabold">{group.grade}</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-700">
                      Total Students Shown: <span className="font-bold">{group.top_students?.length ?? 0}</span>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white">
                      <tr className="text-green-900">
                        <th className="px-4 py-3 border-b border-gray-200 text-center font-extrabold">Rank</th>
                        <th className="px-4 py-3 border-b border-gray-200 text-left font-extrabold">Name</th>
                        <th className="px-4 py-3 border-b border-gray-200 text-left font-extrabold">Username</th>
                        <th className="px-4 py-3 border-b border-gray-200 text-left font-extrabold">School</th>
                        <th className="px-4 py-3 border-b border-gray-200 text-left font-extrabold">City</th>
                        <th className="px-4 py-3 border-b border-gray-200 text-left font-extrabold">Province</th>
                        <th className="px-4 py-3 border-b border-gray-200 text-center font-extrabold">Quizzes</th>
                        <th className="px-4 py-3 border-b border-gray-200 text-center font-extrabold">Avg. Score</th>
                        <th className="px-4 py-3 border-b border-gray-200 text-center font-extrabold">Total Marks</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(group.top_students || []).map((student, idx) => (
                        <tr
                          key={idx}
                          className={`border-b border-gray-100 hover:bg-green-50/60 transition text-gray-800`}
                        >
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-white border border-gray-200 font-extrabold text-gray-700">
                              {idx + 1}
                            </span>
                          </td>

                          <td className="px-4 py-3 font-semibold">
                            {student.full_name || 'N/A'}
                          </td>

                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700 font-semibold">
                              {student.username}
                            </span>
                          </td>

                          <td className="px-4 py-3">{student.school}</td>
                          <td className="px-4 py-3">{student.city}</td>
                          <td className="px-4 py-3">{student.province}</td>

                          <td className="px-4 py-3 text-center font-semibold">
                            {student.quizzes_attempted ?? '-'}
                          </td>

                          <td className="px-4 py-3 text-center">
                            {student.average_score != null ? (
                              <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-white border border-gray-200 font-semibold text-gray-700">
                                {student.average_score}%
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 font-extrabold text-gray-800">
                              {student.total_marks ?? '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer bar (subtle) */}
                <div className={`px-5 py-3 ${p.cardBg} border-t ${p.border}`}>
                  <div className="text-xs md:text-sm text-gray-700 font-semibold">
                    Tip: Rankings are based on your Honor System (attempts + total marks).
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
    <div className="min-h-screen bg-[#f6fff6] text-gray-800 pb-16">
      {/* Top-left logo (same pattern as your other pages) */}
      <div className="px-4 pt-4">
        <Link to="/" title="Go to Home">
          <img
            src={logo}
            alt="Learnify Home"
            className="h-24 w-auto hover:opacity-80 transition duration-200"
          />
        </Link>
      </div>

      {/* Title card */}
      <div className="max-w-5xl mx-auto mt-3 px-4">
        <div className="bg-white/70 border border-green-200 rounded-2xl shadow-sm px-6 py-8 text-center">
          <div className="text-4xl md:text-5xl font-extrabold text-green-900 flex items-center justify-center gap-3">
            <span>🏆</span>
            <span>Learnify Heroes</span>
          </div>
          <p className="mt-2 text-green-800 text-base md:text-lg font-semibold">
            Celebrating our Shining Stars and National Heroes
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 mt-10">
        {loading ? (
          <div className="bg-white border border-green-200 rounded-2xl shadow-sm p-10 text-center">
            <div className="text-green-900 font-extrabold text-lg">Loading…</div>
            <div className="text-gray-600 text-sm mt-1">Fetching honor board data</div>
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