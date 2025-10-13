import React from 'react';
import logo from '@/assets/logo.png';  // Adjust path if needed
import { Link } from 'react-router-dom';

const MembershipPage = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
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

      {/* Content */}
      <div className="flex justify-center px-4 py-8">
        <div className="bg-green-50 border border-green-300 shadow-md rounded-xl p-8 max-w-3xl w-full">
          <h1 className="text-3xl font-bold text-green-800 mb-6 text-center">
            📚 Membership & Subscription Details
          </h1>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-green-700 mb-2">💡 How to Subscribe</h2>
            <ol className="list-decimal list-inside text-gray-800">
              <li>Sign up for a Learnify Pakistan account.</li>
              <li>Go to your <strong>Account Settings</strong> and select <strong>Renew Subscription</strong>.</li>
              <li>Choose your desired plan (Monthly or Yearly).</li>
              <li>Upload a picture/screenshot of your paid fee receipt.</li>
              <li>Submit your request and wait for admin verification.</li>
            </ol>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-green-700 mb-2">💰 Subscription Plans & Rates</h2>
            <ul className="list-disc list-inside text-gray-800">
              <li><strong>Monthly Plan:</strong> Rs. 300 per student</li>
              <li><strong>Annual Plan:</strong> Rs. 3,600 – 25% OFF → Pay only Rs. 2,700</li>
              <li><strong>School Plan:</strong> For schools with 100+ students – 25% discount on total fee</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-green-700 mb-2">🏦 Payment Methods</h2>
            <ul className="list-disc list-inside text-gray-800">
              <li>💳 Bank Transfer (Account details provided during checkout)</li>
              <li>📱 EasyPaisa</li>
              <li>📞 JazzCash</li>
            </ul>
          </section>

          <section className="text-sm text-gray-600">
            <p>If you have any issues or questions, please contact Learnify Support through the Help Center.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MembershipPage;