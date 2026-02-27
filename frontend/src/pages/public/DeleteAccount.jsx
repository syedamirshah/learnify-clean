import React from "react";

export default function DeleteAccount() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Delete Your Account</h1>

      <p className="mt-4 text-gray-700">
        Learnify Pakistan respects your right to control your personal data.
      </p>

      <h2 className="mt-6 text-xl font-semibold">How to request account deletion</h2>

      <ol className="mt-3 list-decimal list-inside text-gray-700 space-y-2">
        <li>Email us at: <strong>learnifypakistan81@gmail.com</strong></li>
        <li>Use subject: <strong>Account Deletion Request</strong></li>
        <li>Include your registered username/email</li>
      </ol>

      <h2 className="mt-6 text-xl font-semibold">What happens after request</h2>

      <ul className="mt-3 list-disc list-inside text-gray-700 space-y-2">
        <li>Your account will be permanently deleted</li>
        <li>Your quiz history will be removed</li>
        <li>Your personal profile data will be erased</li>
      </ul>

      <p className="mt-6 text-gray-700">
        Requests are processed within 7 days.
      </p>
    </div>
  );
}