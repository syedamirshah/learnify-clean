import React from "react";

export default function AuthPanel({
  isAuthenticated = false,
  username = "",
  password = "",
  remember = false,
  userFullName = "",
  onUsernameChange,
  onPasswordChange,
  onRememberChange,
  onSignInClick,
  onLogoutClick,
  onProfileClick,
  className = "",
}) {
  if (isAuthenticated) {
    return (
      <div className={`flex w-full flex-wrap items-center justify-end gap-2 ${className}`}>
        {userFullName ? (
          <button
            type="button"
            onClick={onProfileClick}
            className="max-w-full truncate rounded-md px-2 py-1 text-sm font-semibold text-gray-700 hover:underline"
          >
            Welcome, {userFullName}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onLogoutClick}
          className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-center">
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={username}
          onChange={onUsernameChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={password}
          onChange={onPasswordChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />

        <button
          type="button"
          onClick={onSignInClick}
          className="w-full rounded-md bg-[#42b72a] px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700 lg:w-auto"
        >
          Sign in
        </button>

        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={remember}
            onChange={onRememberChange}
            className="h-4 w-4"
          />
          Remember
        </label>
      </div>
    </div>
  );
}
