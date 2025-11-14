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

          {/* How to Subscribe */}
          <section className="mb-6">
            <h2 className="text-xl font-semibold text-green-700 mb-2">💡 How to Subscribe</h2>
            <ol className="list-decimal list-inside text-gray-800 space-y-1">
              <li>
                On the top green bar, move your mouse to <strong>Sign up</strong> and click{' '}
                <strong>Create Account</strong> to register for Learnify Pakistan.
              </li>
              <li>
                After your account is created, again go to <strong>Sign up</strong> and select{' '}
                <strong>Make Payment</strong>.
              </li>
              <li>
                On the payment page, enter your <strong>User ID</strong> (if asked) and choose your
                plan: <strong>Monthly</strong> or <strong>Yearly</strong>.
              </li>
              <li>
                Click <strong>Pay with Easypay</strong> to open the secure Easypaisa payment page.
              </li>
              <li>
                Complete your payment. Once the payment is successful, your subscription will be
                activated automatically.
              </li>
            </ol>
          </section>

          {/* Subscription Plans & Rates */}
          <section className="mb-6">
            <h2 className="text-xl font-semibold text-green-700 mb-2">💰 Subscription Plans & Rates</h2>
            <ul className="list-disc list-inside text-gray-800 space-y-1">
              <li>
                <strong>Monthly Plan:</strong> Rs. 100 per student
              </li>
              <li>
                <strong>Annual Plan:</strong> Rs. 1,200 – 25% OFF → Pay only Rs. 900
              </li>
              <li>
                <strong>School Plan:</strong> For schools with 100+ students – 25% discount on
                total fee
              </li>
            </ul>
          </section>

          {/* Payment Methods */}
          <section className="mb-6">
            <h2 className="text-xl font-semibold text-green-700 mb-2">🏦 Payment Methods</h2>
            <ul className="list-disc list-inside text-gray-800 space-y-1">
              <li>
                📱 All online payments are processed securely through{' '}
                <strong>Easypay (Easypaisa)</strong>.
              </li>
              <li>
                You can pay using the Easypaisa app or any option available on the Easypay
                checkout page.
              </li>
            </ul>
          </section>

          <section className="text-sm text-gray-600">
            <p>
              If you have any issues or questions, please contact Learnify Support through the
              Help Center.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MembershipPage;