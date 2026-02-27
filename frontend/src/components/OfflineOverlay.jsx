import React, { useEffect, useState } from "react";

export default function OfflineOverlay() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [statusText, setStatusText] = useState("");

  const goOnline = (flag) => {
    window.location.replace(`/?${flag}=1&t=${Date.now()}`);
  };

  const handleRetry = () => {
    if (navigator.onLine) {
      goOnline("online");
      return;
    }
    setStatusText("Still offline");
  };

  useEffect(() => {
    const onOffline = () => {
      setIsOffline(true);
      setStatusText("");
    };

    const onOnline = () => {
      setIsOffline(false);
      goOnline("online");
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-green-950/30 px-4 backdrop-blur-[1px]">
      <div className="w-full max-w-md rounded-2xl border border-green-200 bg-white p-6 text-center shadow-xl">
        <h2 className="text-2xl font-extrabold text-green-900">You’re offline</h2>
        <p className="mt-2 text-sm text-gray-600">Please reconnect and try again.</p>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
        >
          Retry
        </button>
        <div className="mt-2 min-h-[16px] text-xs text-gray-500">{statusText}</div>
      </div>
    </div>
  );
}
