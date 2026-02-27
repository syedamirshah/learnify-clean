import React, { useCallback, useEffect, useRef, useState } from "react";

const API_ORIGIN = "https://api.learnifypakistan.com";
const CHECK_THROTTLE_MS = 2000;

async function checkApiReachable(timeoutMs = 3500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    try {
      // Any HTTP response means origin is reachable (even 401/404/500)
      await fetch(`${API_ORIGIN}/api/health/`, {
        cache: "no-store",
        mode: "cors",
        signal: controller.signal,
      });
      return true;
    } catch (_) {
      // Fallback: no-cors probe only checks network reachability
      await fetch(`${API_ORIGIN}/`, {
        mode: "no-cors",
        cache: "no-store",
        signal: controller.signal,
      });
      return true;
    }
  } catch (_) {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export default function OfflineOverlay() {
  const [visible, setVisible] = useState(!navigator.onLine);
  const [statusText, setStatusText] = useState("");
  const [checking, setChecking] = useState(false);
  const lastCheckRef = useRef(0);
  const checkingRef = useRef(false);

  const redirectToHome = (mode) => {
    if (mode === "online") {
      window.location.href = `/?online=1&t=${Date.now()}`;
      return;
    }
    window.location.href = `/?r=${Date.now()}`;
  };

  const runHealthCheck = useCallback(
    async ({ recoverOnSuccess = false, force = false } = {}) => {
      const now = Date.now();
      if (!force && now - lastCheckRef.current < CHECK_THROTTLE_MS) return false;
      lastCheckRef.current = now;

      if (!navigator.onLine) {
        setVisible(true);
        setStatusText("Still offline");
        return false;
      }

      if (checkingRef.current) return false;
      checkingRef.current = true;
      setChecking(true);
      const reachable = await checkApiReachable();
      checkingRef.current = false;
      setChecking(false);

      if (reachable) {
        setVisible(false);
        setStatusText("");
        if (recoverOnSuccess) {
          redirectToHome("online");
        }
        return true;
      }

      setVisible(true);
      setStatusText("Still offline");
      return false;
    },
    []
  );

  const handleRetry = async () => {
    setStatusText("");
    const ok = await runHealthCheck({ recoverOnSuccess: false, force: true });
    if (!ok) {
      setStatusText("Still offline");
      return;
    }
    redirectToHome("r");
  };

  useEffect(() => {
    const onOffline = () => {
      setVisible(true);
      setStatusText("Still offline");
    };

    const onOnline = () => {
      setStatusText("");
      runHealthCheck({ recoverOnSuccess: true, force: true });
    };

    const onFocus = () => {
      if (!navigator.onLine || visible) {
        runHealthCheck({ recoverOnSuccess: false, force: false });
      }
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onFocus);

    // Initial sync in case network is "online" but API is unreachable.
    runHealthCheck({ recoverOnSuccess: false, force: true });

    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onFocus);
    };
  }, [runHealthCheck, visible]);

  useEffect(() => {
    if (!visible) return undefined;
    const interval = setInterval(() => {
      runHealthCheck({ recoverOnSuccess: false, force: false });
    }, CHECK_THROTTLE_MS);

    return () => clearInterval(interval);
  }, [visible, runHealthCheck]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-green-950/35 px-4 backdrop-blur-[1px]">
      <div className="w-full max-w-md rounded-2xl border border-green-200 bg-white p-6 text-center shadow-xl">
        <h2 className="text-2xl font-extrabold text-green-900">You&apos;re offline</h2>
        <p className="mt-2 text-sm text-gray-600">Please reconnect and try again.</p>
        <button
          type="button"
          onClick={handleRetry}
          disabled={checking}
          className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 disabled:opacity-60"
        >
          {checking ? "Checking..." : "Retry"}
        </button>
        <div className="mt-2 min-h-[16px] text-xs text-gray-500">{statusText}</div>
      </div>
    </div>
  );
}
