import React, { useEffect, useMemo, useState } from "react";

const DISMISS_KEY = "ios_install_prompt_dismissed_at";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

function isStandaloneMode() {
  const mediaStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = Boolean(window.navigator.standalone);
  return mediaStandalone || iosStandalone;
}

function isIosSafari() {
  const ua = window.navigator.userAgent || "";
  const vendor = window.navigator.vendor || "";
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isAppleVendor = /Apple/i.test(vendor);
  const isCriOS = /CriOS/i.test(ua);
  const isFxiOS = /FxiOS/i.test(ua);
  return isIOS && isAppleVendor && !isCriOS && !isFxiOS;
}

export default function IosInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);

  const shouldShowFromStorage = useMemo(() => {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return true;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return true;
    return Date.now() - ts > DISMISS_MS;
  }, []);

  useEffect(() => {
    if (!isIosSafari() || isStandaloneMode() || !shouldShowFromStorage) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    const onAppInstalled = () => setIsVisible(false);
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = (event) => {
      if (event.matches) setIsVisible(false);
    };

    window.addEventListener("appinstalled", onAppInstalled);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", onDisplayModeChange);
    } else {
      mediaQuery.addListener(onDisplayModeChange);
    }

    return () => {
      window.removeEventListener("appinstalled", onAppInstalled);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", onDisplayModeChange);
      } else {
        mediaQuery.removeListener(onDisplayModeChange);
      }
    };
  }, [shouldShowFromStorage]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-32 z-[95] px-4 pb-4">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-xl border border-green-200 bg-white px-4 py-3 shadow-lg">
        <p className="text-sm font-medium text-gray-800">Install Learnify: Tap Share - Add to Home Screen</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex min-h-[36px] items-center justify-center rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
