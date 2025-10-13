import React from 'react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';  // Adjust path if needed

const HelpCenter = () => {
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
            🛠️ Help Center
          </h1>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-green-700 mb-2">📬 Contact Support</h2>
            <p className="text-gray-800">
              If you have any questions, technical issues, or need help with using Learnify Pakistan, we’re here to help!
            </p>
            <p className="mt-2 text-sm text-gray-600 italic">
              (Support email, phone, and live chat details will be available once official domain is live.)
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-green-700 mb-2">❓ Frequently Asked Questions</h2>
            <ul className="list-disc list-inside text-gray-800">
              <li>How do I register my child?</li>
              <li>How do I upload a fee receipt?</li>
              <li>How can teachers access student performance?</li>
              <li>Can I cancel or pause my subscription?</li>
            </ul>
            <p className="text-sm text-gray-600 mt-2 italic">
              (Answers and more topics coming soon.)
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-green-700 mb-2">🌐 Technical Issues</h2>
            <p className="text-gray-800">
              For login issues, quiz errors, or any bugs in the system, please take a screenshot and send it to our support team once we provide official contact info.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;