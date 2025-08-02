import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import logo from '@/assets/logo.png'; // ✅ adjust path if needed

const RenewSubscription = () => {
  const [plan, setPlan] = useState('monthly');
  const [receipt, setReceipt] = useState(null);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/account/subscription-info/', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }
    })
    .then(response => setInfo(response.data))
    .catch(() => setError('Failed to fetch subscription info.'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('plan', plan);
    if (receipt) form.append('fee_receipt', receipt);

    try {
      await axios.post('/api/account/renew-subscription/', form, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('✅ Renewal request submitted! You are now signed out.');

      // ✅ Clear tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('account_status');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      localStorage.removeItem('full_name');
      localStorage.removeItem('user_full_name');
      localStorage.removeItem('user_role');

      // ✅ Redirect to home as guest
      setTimeout(() => {
        window.location.href = "/";
      }, 500);

    } catch (err) {
      alert('❌ Failed to submit renewal request.');
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="bg-white min-h-screen">
      {/* ✅ Logo top-left only */}
      <nav className="w-full px-6 py-4">
        <Link to="/">
          <img
            src={logo}
            alt="Learnify Home"
            className="h-24 w-auto hover:opacity-80 transition duration-200"
            style={{ background: 'transparent' }}
          />
        </Link>
      </nav>

      {/* ✅ Clean white background, centered form */}
      <div className="flex justify-center items-start pt-8 px-4">
        <div className="bg-green-50 border border-green-300 shadow-md rounded-xl p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-semibold text-green-800 mb-6">
            <span role="img" aria-label="refresh">🔄</span> Renew / Extend Subscription
          </h2>

          {error ? (
            <p className="text-red-600 text-sm mb-4">❌ {error}</p>
          ) : info ? (
            <div className="mb-6 text-left text-sm text-gray-700">
              <p><strong>Current Plan:</strong> {info.plan}</p>
              <p><strong>Status:</strong> {info.status}</p>
              <p><strong>Expiry Date:</strong> {formatDate(info.expiry)}</p>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-left">
              <label htmlFor="plan" className="block text-sm font-medium mb-1">Select Plan</label>
              <select
                id="plan"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div className="text-left">
              <label className="block text-sm font-medium mb-1">Upload Fee Receipt</label>
              <input
                type="file"
                onChange={(e) => setReceipt(e.target.files[0])}
                className="w-full border rounded px-3 py-2 bg-white"
              />
            </div>

            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
              <span role="img" aria-label="submit">📩</span> Submit Renewal Request
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RenewSubscription;