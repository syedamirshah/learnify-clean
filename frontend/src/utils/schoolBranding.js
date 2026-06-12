import learnifyLogo from "../assets/logo.png";

const logoListeners = new Set();

export function resolveSchoolLogoSrc(logoUrl, fallback = learnifyLogo) {
  return logoUrl || fallback;
}

export function subscribeSchoolLogo(listener) {
  logoListeners.add(listener);
  return () => logoListeners.delete(listener);
}

function notifySchoolLogoListeners(logoUrl) {
  logoListeners.forEach((listener) => listener(logoUrl));
}

export function getSchoolLogoUrl() {
  return cachedLogoUrl === undefined ? undefined : cachedLogoUrl;
}

export function setSchoolLogoUrl(logoUrl) {
  cachedLogoUrl = logoUrl ?? null;
  logoFetchPromise = Promise.resolve(cachedLogoUrl);
  notifySchoolLogoListeners(cachedLogoUrl);
}

export function invalidateSchoolLogoCache() {
  cachedLogoUrl = undefined;
  logoFetchPromise = null;
}

let cachedLogoUrl;
let logoFetchPromise = null;

export async function fetchSchoolLogoUrl() {
  if (cachedLogoUrl !== undefined) {
    return cachedLogoUrl;
  }
  if (!logoFetchPromise) {
    logoFetchPromise = import("./axiosInstance")
      .then(({ default: axiosInstance }) => axiosInstance.get("school/settings/"))
      .then((res) => res.data?.school?.logo_url || null)
      .catch(() => null)
      .then((url) => {
        cachedLogoUrl = url;
        notifySchoolLogoListeners(url);
        return url;
      });
  }
  return logoFetchPromise;
}
