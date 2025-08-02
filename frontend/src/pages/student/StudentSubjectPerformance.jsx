import React, { useEffect, useState } from 'react';
import axios from 'axios';
import logo from '../../assets/logo.png';
import { Link } from 'react-router-dom';

const StudentSubjectPerformance = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');

    axios.get('/api/student/subject-performance/', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then((res) => {
      setRows(res.data);
      setLoading(false);
    })
    .catch((err) => {
      setError('Failed to load subject performance.');
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-white px-8 py-6 text-gray-800 font-[Calibri]">
      
      {/* Header: Monogram + Title */}
      <div className="flex items-center justify-between mb-6">
  {/* Left: Monogram */}
  <Link to="/">
    <img
      src={logo}
      alt="Learnify Home"
      className="h-24 w-auto hover:opacity-80 transition duration-200"
    />
  </Link>

  {/* Center: Table title */}
  <h2 className="text-2xl md:text-3xl font-bold text-green-800 text-center flex-1">
     Subject-wise Performance
  </h2>

  {/* Right: Spacer for balance */}
  <div className="h-20 w-[80px]"></div>
</div>

      {/* Table */}
      <table className="w-full border-collapse border border-green-200 text-sm md:text-base shadow-sm">
        <thead className="bg-green-100 text-green-900">
          <tr>
            <th className="border px-4 py-2 text-left">Subject</th>
            <th className="border px-4 py-2 text-center">Student Avg (%)</th>
            <th className="border px-4 py-2 text-center">Class Avg (%)</th>
            <th className="border px-4 py-2 text-center">Percentile</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={idx}
              className={
                row.subject === 'Overall Performance'
                  ? 'font-bold bg-green-50 text-center'
                  : 'hover:bg-green-50 text-center transition'
              }
            >
              <td className="border px-3 py-2 text-left">{row.subject}</td>
              <td className="border px-3 py-2">{row.student_avg}%</td>
              <td className="border px-3 py-2">{row.class_avg}%</td>
              <td className="border px-3 py-2">{row.percentile}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentSubjectPerformance;