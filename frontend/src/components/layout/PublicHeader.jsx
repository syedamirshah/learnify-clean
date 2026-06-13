import React from "react";
import { Link } from "react-router-dom";

export default function PublicHeader({
  logoSrc,
  logoAlt = "Learnify",
  logoHref = "/",
  brandTitle = "Learnify Pakistan",
  brandMotto = "Practicing Math Responsibly",
  onMenuClick,
  isMenuOpen = false,
  menuControlsId = "primary-mobile-drawer",
  desktopAuthContent = null,
  desktopProfileDropdown = null,
  desktopHeaderAction = null,
  mobileActionContent = null,
  className = "",
}) {
  return (
    <header className={`w-full border-b border-green-100 bg-white ${className}`}>
      <div className="mx-auto flex w-full max-w-[1200px] min-w-0 items-center gap-3 px-4 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-green-100 text-gray-700 transition hover:border-green-200 hover:bg-green-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 md:hidden"
          aria-label="Open menu"
          aria-expanded={isMenuOpen}
          aria-controls={menuControlsId}
        >
          <span className="text-lg leading-none">☰</span>
        </button>

        <Link to={logoHref} className="inline-flex shrink-0 items-center">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={logoAlt}
              className="h-11 w-auto object-contain sm:h-12 md:h-14"
            />
          ) : (
            <span className="text-base font-extrabold text-gray-900">{brandTitle}</span>
          )}
        </Link>

        <div className="min-w-0 flex-1 leading-none">
          <div className="truncate text-base font-extrabold text-gray-900 sm:text-lg md:text-xl">
            {brandTitle}
          </div>
          <div className="mt-0.5 truncate text-[11px] font-semibold text-[#42b72a] sm:text-xs md:text-sm">
            {brandMotto}
          </div>
        </div>

        <div className="ml-auto hidden min-w-0 items-center gap-2 md:flex md:flex-1 md:justify-end">
          {desktopHeaderAction}
          <div className="relative min-w-0">
            {desktopAuthContent}
            {desktopProfileDropdown ? (
              <div className="absolute right-0 top-full z-50 pt-2">{desktopProfileDropdown}</div>
            ) : null}
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center md:hidden">{mobileActionContent}</div>
      </div>
    </header>
  );
}
