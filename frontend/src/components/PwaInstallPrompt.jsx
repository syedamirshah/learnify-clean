import React, { useEffect, useState } from "react";

function isStandaloneMode() {
  const mediaStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = Boolean(window.navigator.standalone);
  return mediaStandalone || iosStandalone;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneMode());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setDismissed(false);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setDismissed(true);
    };

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = (e) => {
      if (e.matches) {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setDismissed(true);
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", onDisplayModeChange);
    } else {
      mediaQuery.addListener(onDisplayModeChange);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", onDisplayModeChange);
      } else {
        mediaQuery.removeListener(onDisplayModeChange);
      }
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } finally {
      setDeferredPrompt(null);
      setDismissed(true);
    }
  };

  if (isInstalled || dismissed || !deferredPrompt) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-[95] px-4 pb-4">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-xl border border-green-200 bg-white px-4 py-3 shadow-lg">
        <p className="text-sm font-medium text-gray-800">Install Learnify Pakistan</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={handleInstall}
            className="inline-flex min-h-[36px] items-center justify-center rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
