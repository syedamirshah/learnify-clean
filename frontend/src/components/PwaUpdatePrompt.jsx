import React, { useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export default function PwaUpdatePrompt() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      console.log("PWA SW registered:", swUrl);
    },
    onRegisterError(error) {
      console.error("PWA SW registration error:", error);
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setDismissed(true);

    try {
      await updateServiceWorker(true);
    } catch (error) {
      console.error("PWA update activation failed:", error);
    } finally {
      window.location.href = `/?sw=1&t=${Date.now()}`;
    }
  };

  if (!needRefresh || dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-xl border border-green-200 bg-white px-4 py-3 shadow-lg">
        <p className="text-sm font-medium text-gray-800">New version available</p>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex min-h-[36px] items-center justify-center rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 disabled:opacity-60"
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
    </div>
  );
}
