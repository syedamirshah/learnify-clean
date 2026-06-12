import { useCallback, useEffect, useState } from "react";
import learnifyLogo from "../assets/logo.png";
import {
  fetchSchoolLogoUrl,
  invalidateSchoolLogoCache,
  resolveSchoolLogoSrc,
  setSchoolLogoUrl,
  subscribeSchoolLogo,
} from "../utils/schoolBranding";

function applyLogoUrl(setLogoUrl, setLogoSrc, url) {
  setLogoUrl(url);
  setLogoSrc(resolveSchoolLogoSrc(url));
}

export function useSchoolLogo() {
  const [logoSrc, setLogoSrc] = useState(learnifyLogo);
  const [logoUrl, setLogoUrl] = useState(null);

  const refreshLogo = useCallback(async () => {
    invalidateSchoolLogoCache();
    const url = await fetchSchoolLogoUrl();
    applyLogoUrl(setLogoUrl, setLogoSrc, url);
    return url;
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchSchoolLogoUrl().then((url) => {
      if (!cancelled) {
        applyLogoUrl(setLogoUrl, setLogoSrc, url);
      }
    });

    const unsubscribe = subscribeSchoolLogo((url) => {
      if (!cancelled) {
        applyLogoUrl(setLogoUrl, setLogoSrc, url);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return {
    logoSrc,
    logoUrl,
    logoAlt: logoUrl ? "School Logo" : "Learnify Pakistan Logo",
    refreshLogo,
    setLogoUrl: setSchoolLogoUrl,
  };
}
