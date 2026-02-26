import React from "react";
import { Link } from "react-router-dom";

export default function PublicHeader({
  logoSrc,
  logoAlt = "Learnify",
  logoHref = "/",
  brandTitle = "Learnify Pakistan",
  brandMotto = "Learning with Responsibility",
  onMenuClick,
  isMenuOpen = false,
  menuControlsId = "primary-mobile-drawer",
  desktopAuthContent = null,
  desktopProfileDropdown = null,
  mobileActionContent = null,
  className = "",
}) {
  return (
    <header className={`w-full border-b border-gray-100 bg-white ${className}`}>
      <div className="mx-auto flex w-full max-w-[1200px] min-w-0 items-center gap-2 px-3 py-2 sm:px-4 md:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 md:hidden"
          aria-label="Open menu"
          aria-expanded={isMenuOpen}
          aria-controls={menuControlsId}
        >
          <span className="text-lg leading-none">☰</span>
        </button>

        <Link to={logoHref} className="inline-flex shrink-0 items-center">
          {logoSrc ? (
            <img src={logoSrc} alt={logoAlt} className="h-12 w-auto sm:h-14 md:h-16" />
          ) : (
            <span className="text-base font-bold text-green-900">{brandTitle}</span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-extrabold leading-tight text-green-900 sm:text-lg md:text-2xl">
            {brandTitle}
          </div>
          <div className="truncate text-xs font-semibold italic leading-tight text-green-800 sm:text-sm md:text-base">
            {brandMotto}
          </div>
        </div>

        <div className="ml-auto hidden min-w-0 flex-1 md:block">
          <div className="relative">
            {desktopAuthContent}
            {desktopProfileDropdown ? (
              <div className="absolute right-0 top-full z-50 pt-2">{desktopProfileDropdown}</div>
            ) : null}
          </div>
        </div>

        <div className="ml-auto md:hidden">{mobileActionContent}</div>
      </div>
    </header>
  );
}
